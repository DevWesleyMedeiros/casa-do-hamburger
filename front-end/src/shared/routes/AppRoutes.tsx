import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Header } from "../../components/header/Header";
import { Home } from "../../pages/home/Home";
import { Login } from "../../pages/login/Login";
import { Pedidos } from "../../pages/pedidos/Pedidos";
import { Register } from "../../pages/register/Register";
import { PublicRoutes } from "./publicRoutes/PublicRoutes";
import { ForgotPassword } from "../../pages/forgotPassword/ForgotPassword";
import { ResetPassword } from "../../pages/forgotPassword/ResetPassword";

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col bg-black">
      <Header></Header>
      <Outlet />
      {/* Outlet: ponto onde o conteúdo da rota filha é renderizado. Toda rota declarada
        dentro de <Route element={<Layout />}> (home, forgot-password, reset-password,
        pedidos) aparece aqui, com o Header permanecendo fixo acima. */}
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* PublicRoutes é o componente que envolve as rotas públicas (login, register).
        Antes de renderizar a rota filha (ex.: Login), a lógica interna de PublicRoutes
        é executada primeiro. */}
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

      {/* Rotas COM header — Layout é o pai, filhos usam Outlet.
        forgot-password e reset-password ficam fora do PublicRoutes de propósito:
        precisam estar acessíveis independentemente do estado de autenticação,
        mas ainda com o Header visível para navegação. */}
      <Route element={<Layout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pedidos" element={<Pedidos />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
