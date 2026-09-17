import { Avatar, Spinner } from 'flowbite-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar rounded placeholderInitials="W" size="sm" color="blue" />
      <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-300">
        <Spinner size="sm" />
        <span>Wizybot is typing…</span>
      </div>
    </div>
  );
}
