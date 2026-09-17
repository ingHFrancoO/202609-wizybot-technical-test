# Wizybot Technical Test

AI shopping assistant chatbot (OpenAI function calling) with two required tools — `searchProducts` and `convertCurrencies` — plus a bonus `getProductPriceStats` tool. See [technical_test_instructions.md](technical_test_instructions.md) for the original spec.

Differentiator: the product CSV is migrated into PostgreSQL (Docker Compose) instead of read at request time, with full-text search backing `searchProducts`.

- [`backend/`](backend/README.md) — NestJS API (`POST /chat`), Postgres, OpenAI function calling. Start here.
- [`frontend/`](frontend/README.md) — React + Tailwind/Flowbite chat UI.

Run the backend first, then the frontend — each README has its own setup steps.
