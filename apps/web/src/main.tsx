import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { RxNotifyToaster } from './components/ui/rx-notify-toaster';
import { AuthProvider } from './features/auth/auth-context';
import { createAppQueryClient } from './lib/query-client';
import './index.css';

const queryClient = createAppQueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <RxNotifyToaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
