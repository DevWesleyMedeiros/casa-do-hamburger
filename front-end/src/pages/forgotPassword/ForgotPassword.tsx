import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "../../shared/schemas/passwordResetSchema";
import { forgotPassword } from "../../shared/services/api/recovery/forgotPassword";
import { Input } from "../../components/input/Input";
import { Button } from "../../components/button/Button";
import { useCallback } from "react";
import { Link } from "react-router-dom";

export const ForgotPassword = () => {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = useCallback(async (data: ForgotPasswordInput) => {
    try {
      await forgotPassword.create({ email: data.email });
    } catch (error: unknown) {
      // RN-AUTH-15: NÃO diferenciamos a mensagem por status code aqui
      // Se checássemos statusCode === 404 pra exibir erro, estaríamos
      // recriando a mesma falha de enumeração de usuário no login. Só registramos para observabilidade interna.
      console.error("[ForgotPassword] Falha na requisição:", error);
    } finally {
      // RN-AUTH-15: mesma mensagem no front, independentemente do resultado real do backend
      toast.success(
        "Se o e-mail informado estiver cadastrado, você receberá um link de redefinição em instantes.",
      );
    }
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#282724] px-4">
      <div className="rounded-2xl border border-white/10 bg-white/3 p-8 shadow-2xl shadow-black/40">
        {/* Cabeçalho: título + contexto */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-[#F2DAAC]">
            Esqueci minha senha
          </h1>
          <p className="mt-1.5 text-sm text-[#F2DAAC]/60">
            Informe seu e-mail e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-1.5"
          noValidate
        >
          <label
            htmlFor="email"
            className="text-xs font-medium tracking-wide text-[#F2DAAC]/80 uppercase"
          >
            E-mail
          </label>
          <Input
            id="email"
            {...register("email")}
            placeholder="seu@email.com"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="mb-1 w-full rounded-lg border border-[#F2DAAC]/25 bg-transparent px-3 py-2.5 text-[#F2DAAC] transition-colors focus:border-[#F2DAAC]/60 focus:outline-none"
          />
          {errors.email && (
            <span id="email-error" className="mb-1 text-sm text-red-400">
              {errors.email.message}
            </span>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            colorVariation="bgRedVariation"
            className="mt-5 w-full"
          >
            {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="text-brand-amber text-sm transition-opacity hover:opacity-80"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
};
