# Wizybot Chat UI

React + TypeScript frontend for the Wizybot chatbot: a minimal chat interface (Tailwind CSS + [flowbite-react](https://flowbite-react.com/)) that talks to the [backend](../backend)'s `POST /chat` endpoint.

The backend is stateless per request — this app keeps the visible conversation thread on the client, but each message is sent independently (no server-side memory between messages).

## Setup

```bash
cp .env.example .env   # set VITE_API_BASE_URL if the backend isn't on localhost:3000
pnpm install
pnpm run dev
```

Requires the [backend](../backend) running (`docker compose up -d && pnpm run seed && pnpm run start:dev`) with CORS enabled (already configured in `backend/src/main.ts`).

Open `http://localhost:5173`.

## Structure

- `src/lib/api.ts` — fetch client for `POST /chat`, maps non-2xx responses to a `ChatApiError`.
- `src/hooks/useChat.ts` — owns the message thread state (`messages`, `isLoading`) and `sendMessage`.
- `src/components/` — `ChatWindow` (message list + auto-scroll), `ChatMessageBubble` (renders markdown — the backend returns bold text, links and product images), `ChatInput`, `TypingIndicator`.

## Scripts

- `pnpm run dev` — dev server.
- `pnpm run build` — typecheck (`tsc -b`) + production build.
- `pnpm run lint` — oxlint.
