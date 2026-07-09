import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useMe } from "../../../hook/useMe";

export const PublicRoutes = ({ children }: { children: ReactNode }) => {
  // O componente SÓ vai re-renderizar se o `user`
  const { data: user } = useMe();

  // se já está logado, redireciona para home ao invés de login — não deixa ver o login
  if (user) return <Navigate to="/home" replace />;

  // se não está logado, renderiza a página pública normalmente
  // página pública vem do children (Login)
  return <div>{children}</div>;
};
