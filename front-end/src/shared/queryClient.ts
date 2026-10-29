import { QueryClient } from '@tanstack/react-query';
import { clearPrivateSession } from './services/session';
import { sessionRequests } from './services/sessionRequests';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
  },
});

sessionRequests.onExpired(() => {
  void clearPrivateSession(queryClient);
});
