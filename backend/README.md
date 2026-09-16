# Wizybot Chatbot API

NestJS backend for the Wizybot technical test: a chat endpoint backed by the OpenAI Chat Completions API with function calling, exposing two tools — `searchProducts()` and `convertCurrencies()`.

Products are migrated from `products_list.csv` into PostgreSQL (instead of reading the CSV at request time), and `searchProducts()` queries Postgres using native full-text search.

## Stack

- NestJS + TypeScript (ESM)
- PostgreSQL + TypeORM (`synchronize: true`, no formal migrations — fine for this scope)
- OpenAI Chat Completions API (function calling)
- Open Exchange Rates API (currency conversion)
- Scalar (`/api/docs`) for OpenAPI documentation
- pnpm

## Setup

1. **Start Postgres:**

   ```bash
   docker compose up -d
   ```

   > Uses host port `55432` (not the default `5432`) to avoid clashing with a Postgres instance you may already have running locally.

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Fill in `OPENAI_API_KEY` and `OPEN_EXCHANGE_RATES_APP_ID`. The app fails fast at boot if either is missing.

3. **Add the product data:** place `products_list.csv` in `data/` (columns: `displayTitle, embeddingText, url, imageUrl, productType, discount, price, variants, createDate`). Prices are assumed to be in USD.

4. **Install dependencies and seed the database:**

   ```bash
   pnpm install
   pnpm run seed
   ```

   The seed script is idempotent (upserts on `url`) — safe to re-run whenever the CSV changes.

5. **Run the app:**

   ```bash
   pnpm run start:dev
   ```

API docs: `http://localhost:3000/api/docs`.

## Endpoints

- `POST /chat` — `{ "query": "..." }` → `{ "response": "..." }`. Runs the OpenAI function-calling loop, invoking `searchProducts` and/or `convertCurrencies` as needed.
- `GET /products/search?q=...` — debug endpoint to test the product search logic directly, without going through the LLM.

## Manual verification

```bash
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"query": "I am looking for a phone"}'
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"query": "I am looking for a present for my dad"}'
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"query": "How much does a watch costs?"}'
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"query": "What is the price of the watch in Euros"}'
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d '{"query": "How many Canadian Dollars are 350 Euros"}'
```

The 4th query chains both tools (`searchProducts` → `convertCurrencies`); the 5th only calls `convertCurrencies`.
