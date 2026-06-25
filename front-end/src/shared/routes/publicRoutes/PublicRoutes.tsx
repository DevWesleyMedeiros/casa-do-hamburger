import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUserStore } from "../../stores";

export const PublicRoutes = ({ children }: { children: ReactNode }) => {
  // O componente SÓ vai re-renderizar se o `user` ou `isLoading` mudarem.
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);

  if (isLoading) return null;

  // se já está logado, redireciona para home — não deixa ver o login
  if (user) return <Navigate to="/home" replace />;

  // se não está logado, renderiza a página pública normalmente
  // página pública vem do children (Login)
  return <div>{children}</div>;
};
