import { Login } from "../../pages/login/Login";
import { Register } from "../../pages/register/Register";
import Home from "../../pages/home/Home";
import { Header } from "../../components/header/Header";

import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <>
      <Header></Header>
      <Outlet />
    </>
  );
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
