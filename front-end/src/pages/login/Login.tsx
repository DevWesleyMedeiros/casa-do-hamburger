import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { queryKeys } from "../../constant/queryKeys";
import { loginSchema, type loginInput } from "../../shared/schemas/authSchemas";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { LoginDate } from "../../shared/services/api/login/Login";

// import login firebase
import {
  firebaseAuthSignOut,
  signInWithGooglePopup,
} from "../../shared/config/firebase";
import { GoogleLoginDate } from "../../shared/services/api/login/googleLogin";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      setBackendError(null); // limpa o erro do backend de uma tentativa anterior antes de reenviar

      try {
        const result = await LoginDate.create({
          email: data.email, // já vem normalizado (.trim()) pelo schema Zod
          password: data.password, // já vem normalizado (.trim()) pelo schema Zod
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

        // Sucesso: sessão criada no backend, atualiza o estado local do app
        toast("Login realizado");

        // Escreve o usuário direto no cache da query "me" (React Query) em vez de
        // disparar um novo GET /auth/me — Header e AuthGate reagem de imediato à
        // mudança de estado, sem esperar um round-trip extra à API.
        queryClient.setQueryData(queryKeys.me, result.user);
        reset();
        navigate("/home");
      } catch {
        setBackendError("Ocorreu um erro inesperado. Tente novamente.");
      } finally {
        setIsLoading(false); // ← sempre reseta o loading, com sucesso ou erro
      }
    },
    [navigate, reset, queryClient],
  );

  // Fecha o ciclo do login Google: manda o idToken pro backend e trata a resposta. Extraído do handler de clique porque agora também é chamado pelo useEffect (retorno do redirect), não só por interação direta.
  // const finishGoogleLogin = useCallback(
  //   async (idToken: string) => {
  //     setIsGoogleLoading(true);
  //     setBackendError(null);
  //     try {
  //       const result = await GoogleLoginDate.create({ idToken });

  //       if (result instanceof ApiError) {
  //         if (result.statusCode === 409) {
  //           setBackendError("Usuário já cadastrado");
  //           return;
  //         } else if (result.statusCode === 401) {
  //           setBackendError(
  //             "Não foi possível confirmar sua conta Google. Tente novamente",
  //           );
  //           return;
  //         } else {
  //           setBackendError(result.message);
  //           return;
  //         }
  //       }

  //       toast("Login realizado");
  //       queryClient.setQueryData(queryKeys.me, result.user);
  //       reset();
  //       navigate("/home");
  //     } catch (err) {
  //       setBackendError("Ocorreu um erro inesperado. Tente novamente." + err);
  //     } finally {
  //       setIsGoogleLoading(false);
  //     }
  //   },
  //   [navigate, reset, queryClient],
  // );

  // Fluxo de login com popup — resolve o redirect_uri_mismatch e o COOP
  const handleGoogleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    setBackendError(null);
    try {
      const idToken = await signInWithGooglePopup();
      const result = await GoogleLoginDate.create({ idToken });

      if (result instanceof ApiError) {
        if (result.statusCode === 409) {
          setBackendError("Usuário já cadastrado");
          return;
        } else if (result.statusCode === 401) {
          setBackendError(
            "Não foi possível confirmar sua conta Google. Tente novamente",
          );
          return;
        } else {
          setBackendError(result.message);
          return;
        }
      }

      toast("Login realizado");
      queryClient.setQueryData(queryKeys.me, result.user);
      reset();
      navigate("/home");
    } catch (err) {
      console.error("[GoogleLogin] Erro no fluxo de popup:", err);
      setBackendError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      // Limpa sessão do Firebase no cliente — sessão real é o cookie do backend
      await firebaseAuthSignOut();
      setIsGoogleLoading(false);
    }
  }, [navigate, reset, queryClient]);

  // --- Versão anterior (signInWithPopup) — mantida comentada de propósito.
  // Volta a ser a versão ativa quando o popup for reabilitado (também exige
  // trocar de volta o import lá em cima, de signInWithGoogleRedirect/
  // getGoogleRedirectResult pra signInWithGooglePopup, e descomentar o
  // export correspondente em firebase.ts). Até lá, o fluxo em uso é o de
  // cima (signInWithGoogleRedirect + useEffect).
  // const handleGoogleLogin = useCallback(async () => {
  //   setIsGoogleLoading(true);
  //   setBackendError(null);
  //   try {
  //     const idToken = await signInWithGooglePopup(); // ← nome corrigido, bate com o import
  //     const result = await GoogleLoginDate.create({ idToken });

  //     if (result instanceof ApiError) {
  //       if (result.statusCode === 409) {
  //         setBackendError("Usuário já cadastrado");
  //         return;
  //       } else if (result.statusCode === 401) {
  //         setBackendError(
  //           "Não foi possível confirmar sua conta Google. Tente novamente",
  //         );
  //         return;
  //       } else {
  //         setBackendError(result.message);
  //         return;
  //       }
  //     }

  //     toast("Login realizado");
  //     queryClient.setQueryData(queryKeys.me, result.user);
  //     reset();
  //     navigate("/home");
  //   } catch {
  //     setBackendError("Ocorreu um erro inesperado. Tente novamente.");
  //   } finally {
  //     setIsGoogleLoading(false);
  //   }
  // }, [navigate, reset, queryClient]);

  // const handleGoogleLogin = useCallback(async () => {
  //   setIsGoogleLoading(true);
  //   setBackendError(null);
  //   try {
  //     const idToken = await handleRedirectResult();
  //     if (!idToken) return;
  //     const result = await GoogleLoginDate.create({ idToken });
  //     if (result instanceof ApiError) {
  //       if (result.statusCode === 409) {
  //         setBackendError("Usuário já cadastrado");
  //         return;
  //       } else if (result.statusCode === 401) {
  //         setBackendError(
  //           "Não foi possível confirmar sua conta Google. Tente novamente",
  //         );
  //         return;
  //       } else {
  //         setBackendError(result.message);
  //         return;
  //       } catch {
  //         setBackendError("Ocorreu um erro inesperado. Tente novamente.");
  //       } finally {
  //         setBackendError(false)
  //       }
  //   })

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <form
      className="bg-brand-dark flex min-h-screen w-full items-center justify-center px-4"
      onSubmit={handleSubmit(onSubmit)} // ← Zod valida os campos antes de onSubmit ser chamado
      noValidate
    >
      <div className="flex flex-col items-center gap-2 rounded-xl border-[0.5px] border-white/13 p-7 shadow-2xl shadow-black/40">
        <Link to="/home">
          <img
            src="./assetsImages/logo-casa-do-hamburguer.png"
            alt="logo da hamburgeria"
            className="mb-4"
          />
        </Link>

        <div className="w-full rounded-2xl border border-white/10 bg-[#1b1a16] px-4 py-5">
          <div className="mb-5">
            <p className="text-center font-bold text-[#F2DAAC]">
              Bem vindo à Casa do Hamburguer!!
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium tracking-wide text-[#F2DAAC]/80 uppercase"
              >
                E-mail
              </label>
              <Input
                id="email"
                placeholder="seu@email.com"
                type="email"
                autoComplete="email"
                {...register("email")}
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-left text-xs font-bold text-red-500"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* senha */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium tracking-wide text-[#F2DAAC]/80 uppercase"
              >
                Senha
              </label>
              <div className="relative w-full">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-300"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              {errors.password && (
                <p
                  id="password-error"
                  className="text-left text-sm font-bold text-red-500"
                >
                  {errors.password.message}
                </p>
              )}
              {backendError && (
                <p
                  role="alert"
                  className="text-left text-sm font-bold text-red-500"
                >
                  {backendError}
                </p>
              )}

              <div className="mt-1 flex items-center justify-end gap-3 text-xs">
                <Link className="text-brand-amber" to="/forgot-password">
                  Esqueceu senha
                </Link>
                <span className="text-white/20">•</span>
                <Link className="text-brand-amber" to="/reset-password">
                  Redefinir senha
                </Link>
              </div>
            </div>

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
              title={isGoogleLoading ? "Conectando..." : "Entrar com Google"}
              colorVariation="bgGoogleVariation"
              disabled={isSubmitting || isGoogleLoading}
              onClick={handleGoogleLogin}
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
