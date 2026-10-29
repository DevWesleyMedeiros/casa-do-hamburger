import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, ShoppingCart } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ICON_CONFIG } from '../../constant/iconConfig';
import { queryKeys } from '../../constant/queryKeys';
import { useMe } from '../../hook/useMe';
import { getCartItemsList } from '../../shared/services/api/cartItems/getCartItems';
import { logoutSession } from '../../shared/services/session';
import { useCartUIStore } from '../../shared/stores';
import { useNewProductUIModalStore } from '../../shared/stores/useNewProductUIModal';
import { Cart } from '../cart/Cart';
import { NewProductModal } from '../newProductModal/NewProductModal';
import { AvatarUpload } from '../AvatarUpload';
import { AdminNavigation } from './AdminNavigation';

export const Header = () => {
  const { data: user } = useMe();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handleToggleCartVisibility = useCartUIStore((state) => state.toggleCart);
  const isOpenModal = useNewProductUIModalStore((state) => state.isModalOpen);
  const openModal = useNewProductUIModalStore((state) => state.openModal);

  // buscando CartItems
  const { data: totalItems = 0 } = useQuery({
    queryKey: queryKeys.cartFor(user?.id),
    queryFn: ({ signal }) => getCartItemsList.getCartItemsProduct(signal),
    select: (cartItem) => cartItem.reduce((sum, item) => sum + item.quantity, 0),
    enabled: Boolean(user), // só busca carrinho se tiver usuário logado
    retry: false,
  });

  // Quando deslogar o usuário
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logoutSession(queryClient);
    } catch {
      toast.error('Erro ao sair. Tente novamente.');
      return;
    } finally {
      setIsLoggingOut(false);
    }
    toast.success('Usuário deslogado');
    navigate('/login');
  }, [navigate, queryClient]);

  return (
    <div className="bg-brand-dark">
      {/* render janela lateral do cart */}
      <div className="bg-brand-dark">
        <Cart />
        {/* Sheet controla visibilidade internamente via `open` prop */}
        {/* resto do header continua igual */}
      </div>
      <div className="mx-auto flex w-full items-center justify-between p-3 md:w-184.25 md:p-0">
        <div className="h-21.5 w-20 shrink-0 sm:w-25">
          <Link to="/">
            <img src="/assetsImages/logo-casa-do-hamburguer.png" alt="Logo caso do Hamburger" />
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-1 text-white sm:gap-3">
            {user.admin && <AdminNavigation onAdd={openModal} />}
            {isOpenModal && <NewProductModal></NewProductModal>}

            <button
              type="button"
              aria-label="Abrir carrinho"
              onClick={handleToggleCartVisibility}
              className="relative flex min-h-11 min-w-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-amber-200"
            >
              <ShoppingCart size={ICON_CONFIG.mxSize} strokeWidth={ICON_CONFIG.strokWidth} />
              <p className="text-brand-dark absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-md bg-amber-200">
                {totalItems}
              </p>
            </button>
            <div className="flex items-center gap-2">
              <p className="hidden text-white lg:block">{user.name.split(' ')[0] || ''}</p>
              <button
                type="button"
                aria-label="Sair"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-amber-200"
                disabled={isLoggingOut}
                onClick={handleLogout}
              >
                <LogOut
                  size={ICON_CONFIG.mxSize}
                  strokeWidth={ICON_CONFIG.strokWidth}
                  className="cursor-pointer"
                />
              </button>
            </div>
            {/* icone do avatar pelo provider local */}
            {user.provider === 'LOCAL' && (
              <AvatarUpload name={user.name} avatarUrl={user?.avatarUrl}></AvatarUpload>
            )}
            {/* icone do avatar pelo provider Google */}
            {user.provider === 'GOOGLE' && (
              <AvatarUpload name={user.name} avatarUrl={user?.avatarUrl}></AvatarUpload>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex min-h-11 w-28 items-center justify-center rounded-md bg-[#F2DAAC] focus-visible:outline-2 focus-visible:outline-white"
          >
            Entrar
          </Link>
        )}
        {/* envelopando o botão dentro do link, o link fica em toda o formato do botão */}
      </div>
    </div>
  );
};
