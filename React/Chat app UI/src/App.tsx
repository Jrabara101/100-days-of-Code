import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatAppShell } from './components/layout/ChatAppShell';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatAppShell />
    </QueryClientProvider>
  );
}

export default App;

