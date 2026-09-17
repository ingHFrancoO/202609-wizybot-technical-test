import { Button, Textarea } from 'flowbite-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface ChatInputProps {
  disabled: boolean;
  onSend: (query: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) {
      return;
    }
    onSend(value);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
      <Textarea
        rows={1}
        placeholder="Ask about a product, price or currency conversion…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="resize-none"
      />
      <Button color="purple" onClick={handleSend} disabled={disabled || !value.trim()}>
        Send
      </Button>
    </div>
  );
}
