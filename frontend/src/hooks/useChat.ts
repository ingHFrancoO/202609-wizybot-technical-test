import { useCallback, useState } from 'react';
import { ChatApiError, sendChatMessage } from '../lib/api';
import type { ChatMessage } from '../types/chat';

function createMessageId(): string {
  return crypto.randomUUID();
}

/**
 * Owns the chat thread state. The backend is stateless per request (each
 * call only sends the latest query, no conversation history) — this hook
 * keeps the visible thread on the client so the UI still reads like a
 * normal chat.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setMessages((current) => [...current, { id: createMessageId(), role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed);
      setMessages((current) => [...current, { id: createMessageId(), role: 'assistant', content: response }]);
    } catch (error) {
      const message = error instanceof ChatApiError ? error.message : 'Something went wrong. Please try again.';
      setMessages((current) => [
        ...current,
        { id: createMessageId(), role: 'assistant', content: message, isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return { messages, isLoading, sendMessage };
}
