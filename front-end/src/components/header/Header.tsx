import { Box, LayoutDashboard, LogOut, Plus, ShoppingCart } from "lucide-react";
import { useCallback, useState } from "react";
// import { useContext } from 'react'
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ICON_CONFIG } from "../../constant/iconConfig";
// import { UserContext } from "../../shared/context/UserContext";
import { Cart } from "../cart/Cart";
import { useUserStore } from "../../shared/stores";

export const Header = () => {
  // desestruturando variável UserContext
  // const { user, logout } = useContext(UserContext);

  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  //variável que inicia location
  const location = useLocation();
  // console.log(location.pathname);

  const navigate = useNavigate();

  // variável de estado para manipular visibility do meu cart
  // true = showcart; false hiddencart
  const [showCart, setShowCart] = useState<boolean>(false);
  // função que irá esconder ou mostrar cart invertendo seu valor lógico
  const handleCartVisibility = useCallback(() => {
    setShowCart((prev) => !prev);
  }, []);

  // função de logout
  const handleLogout = useCallback(async () => {
    toast("saindo...");

    // use o await para travar o setTimeout. Do contrário, o que vier depois será executado sobre ele
    await new Promise((resolve) => setTimeout(resolve, 4000));

    toast.success("Usuário deslogado");
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  // função que implementa um active no ícone de acordo com a pathname do location
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
            {/* vai começar não renderizando nada, pois, qualquer user cadastrado no Banco de Dados é admin false; user.admin = true mostre o que está entre parêntese; user.admin = false não mostre o que está entre parênteses */}

            {user.admin && (
              // md:flex - tamanhas maiores de 768px (md), mostre o conteúdo. Menor que isso, hidden
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
                1
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
