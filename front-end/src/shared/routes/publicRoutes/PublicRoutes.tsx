import type { ReactNode } from "react";
import { UserContext } from "../../context/UserContext";
import { useContext } from "react";
import { Navigate } from "react-router-dom";

export const PublicRoutes = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useContext(UserContext);

  if (isLoading) return null;
  // se já está logado, redireciona para home — não deixa ver o login
  if (user) return <Navigate to="/home" replace />;

  // se não está logado, renderiza a página pública normalmente
  // página pública vem do childre (Login)
  return <div>{children}</div>;
};
