import type { ChatApiErrorBody, ChatApiResponse } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ChatApiError extends Error {}

/**
 * Sends a single user query to the backend's stateless POST /chat endpoint
 * and returns the assistant's final text response.
 */
export async function sendChatMessage(query: string): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
  } catch {
    throw new ChatApiError('Could not reach the server. Is the backend running?');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ChatApiErrorBody | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ChatApiError(message ?? `Request failed with status ${response.status}`);
  }

  const body = (await response.json()) as ChatApiResponse;
  return body.response;
}
