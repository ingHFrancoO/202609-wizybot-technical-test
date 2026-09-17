import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types/chat';
import { ChatMessageBubble } from './ChatMessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-gray-400 dark:text-gray-500">
        Ask Wizybot about a product, its price, or a currency conversion.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
