import { ChatInput } from './components/ChatInput';
import { ChatWindow } from './components/ChatWindow';
import { useChat } from './hooks/useChat';

function App() {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <div className="mx-auto flex h-svh max-w-2xl flex-col border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:border-x">
      <header className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Wizybot</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">AI shopping assistant</p>
      </header>
      <ChatWindow messages={messages} isLoading={isLoading} />
      <ChatInput disabled={isLoading} onSend={sendMessage} />
    </div>
  );
}

export default App;
