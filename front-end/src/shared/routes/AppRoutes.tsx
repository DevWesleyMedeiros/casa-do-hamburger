import { Header } from "../../components/header/Header";
import { PublicRoutes } from "./publicRoutes/PublicRoutes";
import { Home } from "../../pages/home/Home";
import { Login } from "../../pages/login/Login";
import { Pedidos } from "../../pages/pedidos/Pedidos";
import { Register } from "../../pages/register/Register";

import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen flex-col bg-black">
      <Header></Header>
      <Outlet />
      {/* Outlet - conteúdo; Se abrirmos o componente header e acessarmos as rotas de home e pedidos. elas serão renderizadas e o header fica fixo  */}
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* PublicRoutes é um componente que defini que serão os outros componentes que serão público.
        Se eu acessar a rota de login, a lógica do componente PublicRoutes será executado antes */}
        <Route
          path="/login"
          element={
            <PublicRoutes>
              <Login />
            </PublicRoutes>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoutes>
              <Register />
            </PublicRoutes>
          }
        />

        {/* Rotas COM header — Layout é o pai, filhos usam Outlet */}
        <Route element={<Layout />}>
          {/* tudo que tiver aqui dentro terá um layout definido */}
          <Route path="/home" element={<Home />} />
          <Route path="/pedidos" element={<Pedidos />}></Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
