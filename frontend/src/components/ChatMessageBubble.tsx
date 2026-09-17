import { Avatar } from 'flowbite-react';
import Markdown from 'react-markdown';
import type { ChatMessage } from '../types/chat';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar
        rounded
        placeholderInitials={isUser ? 'U' : 'W'}
        size="sm"
        color={isUser ? 'purple' : 'blue'}
      />
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-purple-600 text-white'
            : message.isError
              ? 'border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
              : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
        }`}
      >
        <div className="space-y-2 break-words">
          <Markdown
            components={{
              p: ({ children }) => <p className="my-0">{children}</p>,
              a: ({ children, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" className="underline">
                  {children}
                </a>
              ),
              img: ({ alt, ...props }) => (
                <img {...props} alt={alt ?? ''} className="mt-2 max-w-full rounded-lg" />
              ),
              ul: ({ children }) => <ul className="list-inside list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="list-inside list-decimal">{children}</ol>,
            }}
          >
            {message.content}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
