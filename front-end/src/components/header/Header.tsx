import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, LayoutDashboard, LogOut, Plus, ShoppingCart } from "lucide-react";
import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { queryKeys } from "../../constant/queryKeys";
import { useMe } from "../../hook/useMe";
import { getCartItemsList } from "../../shared/services/api/cartItems/getCartItems";
import { userLogOut } from "../../shared/services/api/logout/Logout";
import { useCartUIStore } from "../../shared/stores";
import { Cart } from "../cart/Cart";

export const Header = () => {
  const { data: user } = useMe();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handleToggleCartVisibility = useCartUIStore(
    (state) => state.toggleCart,
  );
  const isOpenCart = useCartUIStore((state) => state.isCartOpen);

  // buscando CartItems
  const { data: totalItems = 0 } = useQuery({
    queryKey: queryKeys.cartItems,
    queryFn: () => getCartItemsList.getCartItemsProduct(),
    select: (cartItem) =>
      cartItem.reduce((sum, item) => sum + item.quantity, 0),
    enabled: Boolean(user), // só busca carrinho se tiver usuário logado
    retry: false,
  });

  // Quando deslogar o usuário
  const handleLogout = useCallback(async () => {
    toast("saindo...");
    try {
      // quando eu deslogar, remova o usuário e a lista de CartItems (identificados pelas queryKeys)
      await userLogOut();
      queryClient.removeQueries({ queryKey: queryKeys.me });
      queryClient.removeQueries({ queryKey: queryKeys.cartItems });
    } catch {
      toast.error("Erro ao sair. Tente novamente.");
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
    toast.success("Usuário deslogado");
    navigate("/login");
  }, [navigate, queryClient]);

  const setNavItemActiveClass = (pathname: string): string => {
    const baseClass =
      "flex h-[8.75] w-[8.75] items-center justify-center rounded-md p-1.5";
    return pathname === location.pathname
      ? `${baseClass} border-2 border-amber-200 text-[#161410] bg-[#F2DAAC]`
      : `${baseClass}`;
  };

  return (
    <div className="bg-brand-dark">
      {/* render janela lateral do cart */}
      <div className="bg-brand-dark">
        <Cart />
        {/* Sheet controla visibilidade internamente via `open` prop */}
        {/* resto do header continua igual */}
      </div>
      <div className="mx-auto flex w-full items-center justify-between p-3 md:w-184.25 md:p-0">
        <Link to="/">
          <img
            src="./logo-casa-do-hamburguer.png"
            alt="Logo link caso do Hamburger"
          />
        </Link>

        {user ? (
          <div className="flex items-center gap-6 text-white">
            {user.admin && (
              <div className="hidden gap-2 text-[#F2DAAC] md:flex">
                <Link to="/home">
                  <div className={setNavItemActiveClass("/home")}>
                    <Box
                      size={ICON_CONFIG.mxSize}
                      strokeWidth={ICON_CONFIG.strokWidth}
                      className="cursor-pointer"
                    />
                  </div>
                </Link>

                <Link to="/pedidos">
                  <div className={setNavItemActiveClass("/pedidos")}>
                    <LayoutDashboard
                      size={ICON_CONFIG.mxSize}
                      strokeWidth={ICON_CONFIG.strokWidth}
                      className="cursor-pointer"
                    />
                  </div>
                </Link>

                <div className="flex h-[8.75] w-[8.75] items-center justify-center rounded-md">
                  <Plus
                    size={ICON_CONFIG.mxSize}
                    strokeWidth={ICON_CONFIG.strokWidth}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="relative cursor-pointer">
              <ShoppingCart
                size={ICON_CONFIG.mxSize}
                strokeWidth={ICON_CONFIG.strokWidth}
                onClick={handleToggleCartVisibility}
              />
              <p className="text-brand-dark absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-md bg-amber-200">
                {totalItems}
              </p>
            </div>
            <div className="item-center flex gap-2">
              <p className="text-white">{user.name}!</p>
              <LogOut
                size={ICON_CONFIG.mxSize}
                strokeWidth={ICON_CONFIG.strokWidth}
                className="cursor-pointer"
                onClick={handleLogout}
              />
            </div>
          </div>
        ) : (
          <Link to="/login">
            <button
              type="button"
              title="Entrar"
              className="btn-login flex h-8.75 w-32.5 cursor-pointer items-center justify-center rounded-md bg-[#F2DAAC]"
            >
              Entrar
            </button>
          </Link>
        )}
        {/* envelopando o botão dentro do link, o link fica em toda o formato do botão */}
      </div>
    </div>
  );
};
