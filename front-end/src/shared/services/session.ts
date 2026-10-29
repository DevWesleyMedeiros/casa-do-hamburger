import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../constant/queryKeys';
import type { UserLogin } from '../../types/Payload';
import { useCartUIStore } from '../stores/useCartUIStore';
import { useNewProductUIModalStore } from '../stores/useNewProductUIModal';
import { userLogOut } from './api/logout/Logout';
import { sessionRequests } from './sessionRequests';

export async function clearPrivateSession(client: QueryClient): Promise<void> {
  sessionRequests.cancel();
  const cancellation = client.cancelQueries({ queryKey: queryKeys.private });
  client.removeQueries({ queryKey: queryKeys.private });
  client.getMutationCache().clear();
  // null mantém os observers de sessão anônimos; remover me provocaria novo bootstrap.
  client.setQueryData(queryKeys.me, null);
  useCartUIStore.getState().closeCart();
  useNewProductUIModalStore.getState().closeModal();
  await cancellation;
}

export async function establishSession(client: QueryClient, user: UserLogin): Promise<void> {
  await clearPrivateSession(client);
  client.setQueryData(queryKeys.me, user);
}

export async function logoutSession(client: QueryClient): Promise<void> {
  // Só anuncia sucesso após o servidor confirmar a remoção do cookie.
  await userLogOut();
  await clearPrivateSession(client);
}
