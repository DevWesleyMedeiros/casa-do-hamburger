import { Login } from "../../pages/login/Login";
import { Register } from "../../pages/register/Register";
import Home from "../../pages/home/Home";

import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};
