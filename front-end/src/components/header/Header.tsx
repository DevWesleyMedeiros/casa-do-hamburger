import { Box, LayoutDashboard, LogOut, Plus, ShoppingCart } from "lucide-react";
import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { UserContext } from "../../shared/context/UserContext";

export const Header = () => {
  // desestruturando variável user
  const { user } = useContext(UserContext);

  //variável que inicia location
  const location = useLocation();
  console.log(location.pathname);

  // função que implementa um active no ícone de acordo com a pathname do location
  const setNavItemActiveClass = (pathname: string): string => {
    const baseClass =
      "flex h-[8.75] w-[8.75] items-center justify-center rounded-md p-1.5";
    return pathname === location.pathname
      ? `${baseClass} border-2 border-amber-200 text-[#161410] bg-[#F2DAAC]`
      : `${baseClass}`;
  };

  return (
    <div className="bg-[#161410]">
      <div className="mx-auto flex w-full items-center justify-between p-3 md:w-184.25 md:p-0">
        <Link to="/">
          <img src="./logo.png" alt="Logo link caso do Hamburger" />
        </Link>

        {user ? (
          <div className="flex items-center gap-6 text-white">
            <div className="flex gap-2 text-[#F2DAAC]">
              <Link to="/home">
                <div className={setNavItemActiveClass("/home")}>
                  <Box
                    size={ICON_CONFIG.size}
                    strokeWidth={ICON_CONFIG.strokWidth}
                    className="cursor-pointer"
                  />
                </div>
              </Link>

              <Link to="/pedidos">
                <div className={setNavItemActiveClass("/pedidos")}>
                  <LayoutDashboard
                    size={ICON_CONFIG.size}
                    strokeWidth={ICON_CONFIG.strokWidth}
                    className="cursor-pointer"
                  />
                </div>
              </Link>

              <div className="flex h-[8.75] w-[8.75] items-center justify-center rounded-md">
                <Plus
                  size={ICON_CONFIG.size}
                  strokeWidth={ICON_CONFIG.strokWidth}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="relative cursor-pointer">
              <ShoppingCart
                size={ICON_CONFIG.size}
                strokeWidth={ICON_CONFIG.strokWidth}
              />
              <p className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-md bg-amber-200 text-[#161410]">
                1
              </p>
            </div>

            <div className="item-center flex gap-2">
              <p className="text-white">{user.name}!</p>
              <LogOut
                size={ICON_CONFIG.size}
                strokeWidth={ICON_CONFIG.strokWidth}
                className="cursor-pointer"
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
