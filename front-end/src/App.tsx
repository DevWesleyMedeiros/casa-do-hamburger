import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';
import { AppRoutes } from './shared/routes/AppRoutes';
import { AuthGate } from './shared/components/AuthGate';

import { queryClient } from './shared/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-center" richColors duration={3000} />
        <AuthGate>
          <AppRoutes></AppRoutes>
        </AuthGate>
      </BrowserRouter>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
export default App;
