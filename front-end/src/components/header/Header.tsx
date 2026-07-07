import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, LayoutDashboard, LogOut, Plus, ShoppingCart } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { queryKeys } from "../../constant/queryKeys";
import { getCartItemsList } from "../../shared/services/api/cartItems/getCartItems";
import { useUserStore } from "../../shared/stores";
import { Cart } from "../cart/Cart";

export const Header = () => {
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  const location = useLocation();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: totalItems = 0 } = useQuery({
    queryKey: queryKeys.cartItems,
    queryFn: () => getCartItemsList.getCartItemsProduct(),
    select: (cartItem) =>
      cartItem.reduce((sum, item) => sum + item.quantity, 0),
  });

  const [showCart, setShowCart] = useState<boolean>(false);
  const handleCartVisibility = useCallback(() => {
    setShowCart((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    toast("saindo...");

    await new Promise((resolve) => setTimeout(resolve, 4000));
    toast.success("Usuário deslogado");
    await logout();

    queryClient.removeQueries({ queryKey: queryKeys.cartItems });
    navigate("/login");
  }, [logout, navigate, queryClient]);

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
      {showCart && <Cart setShowCart={setShowCart} showCart={showCart}></Cart>}
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
                onClick={() => handleCartVisibility()}
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
