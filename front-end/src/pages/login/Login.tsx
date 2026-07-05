import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useState } from "react";
// import { useContext } from 'react'
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";

import { toast } from "sonner";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { loginSchema, type loginInput } from "../../shared/schemas/authSchemas";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { LoginDate } from "../../shared/services/api/login/Login";
import { useUserStore } from "../../shared/stores/useUserStrore";
import { useCartStore } from "../../shared/stores/useCartStore";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  // erros de campo (email inválido, senha vazia) ficam em formState.errors
  // erros do servidor (usuário não encontrado, senha incorreta) ficam aqui

  // const { setUser } = useContext(UserContext);
  // consumindo minhas função do meu store via um hook personalida
  const setUser = useUserStore((state) => state.setUser);
  const fetchCartItemList = useCartStore((state) => state.fetchCartItems);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<loginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = useCallback(
    async (data: loginInput) => {
      setIsLoading(true);
      setBackendError(null); // limpa erro anterior do backend

      try {
        const result = await LoginDate.create({
          email: data.email, // já vem com .trim() do schema
          password: data.password,
        });

        if (result instanceof ApiError) {
          if (result.statusCode === 401) setBackendError("Senha incorreta");
          else if (result.statusCode === 404)
            setBackendError("Usuário não encontrado");
          else if (result.statusCode === 500)
            setBackendError("Erro no servidor, tente depois");
          else setBackendError(result.message);
          return;
        }

        // criar um efeito de espera de 4 segundos
        toast("Logando ...");
        await new Promise((resolve) => setTimeout(resolve, 4000));

        // sucesso
        setUser({
          name: result.user.name,
          email: result.user.email,
          admin: result.user.admin,
        });
        reset();
        fetchCartItemList();
        navigate("/home");
      } catch {
        setBackendError("Ocorreu um erro inesperado. Tente novamente.");
      } finally {
        setIsLoading(false); // ← sempre reseta, independente do resultado
      }
    },
    [navigate, setUser, reset, fetchCartItemList],
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <form
      className="bg-brand-dark flex h-screen items-center justify-center"
      onSubmit={handleSubmit(onSubmit)} // ← Zod valida antes de chamar onSubmit
    >
      <div className="justify-left flex flex-col items-center gap-2 rounded-xl border-[0.5px] border-white/13 p-7">
        <Link to="/home">
          <img
            src="./logo-casa-do-hamburguer.png"
            alt="logo da hamburgeria"
            className="mb-4"
          />
        </Link>

        <div className="w-full rounded-2xl border-white/13 bg-[#1b1a16] px-4 py-4">
          <div className="mb-4">
            <p className="text-center font-bold text-[#F2DAAC]">
              Bem vindo à Casa do Hamburguer!!
            </p>
          </div>

          <div className="justify-left flex flex-col gap-2">
            {/* email */}
            <div>
              <Input
                placeholder="E-mail"
                type="email"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-left text-xs font-bold text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* senha */}
            <div>
              <div className="relative w-full">
                <Input
                  placeholder="Senha"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-left text-xs font-bold text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* erro vindo do backend */}
            {backendError && (
              <p className="text-left text-sm font-bold text-red-500">
                {backendError}
              </p>
            )}

            <Button
              type="submit"
              title={isLoading ? "Entrando..." : "Entrar"}
              colorVariation="bgDarkVariation"
              disabled={isLoading}
            />

            <div className="flex w-full items-center justify-center gap-2 text-[#595753]">
              <div className="h-px w-full border-[0.5px] border-white/10" />
              <span className="text-sm">ou</span>
              <div className="h-px w-full border-[0.5px] border-white/10" />
            </div>

            <Button
              type="button"
              title="Cadastrar com Google"
              colorVariation="bgGoogleVariation"
              disabled={isSubmitting}
            >
              <FcGoogle size={ICON_CONFIG.mxSize} />
            </Button>

            <div className="my-2 flex justify-center gap-1 text-sm">
              <p className="font-bold text-[#4c4b48]">Não tem uma conta?</p>
              <Link to={isSubmitting ? "#" : "/register"}>
                <span
                  className={`text-brand-amber text-right text-sm ${isSubmitting ? "pointer-events-none cursor-not-allowed opacity-50 select-none" : ""}`}
                >
                  Criar conta
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
