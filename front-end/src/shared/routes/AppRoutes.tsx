import { Login } from "../../pages/login/Login";
import { Register } from "../../pages/register/Register";
import { Home } from "../../pages/home/Home";
import { Header } from "../../components/header/Header";
import { Pedidos } from "../../pages/pedidos/Pedidos";

import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen flex-col bg-red-500">
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
