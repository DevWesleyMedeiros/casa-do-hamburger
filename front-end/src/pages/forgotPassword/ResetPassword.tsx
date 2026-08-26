import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "../../components/input/Input";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "../../shared/schemas/passwordResetSchema";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { resetPassword } from "../../shared/services/api/recovery/resetPassword";
import { resolveApiErrorMessage } from "../../shared/utils/apiErrorMessage";

// RN-CRYPT-04 — mesma política de senha validada no backend (mín. 9 caracteres,
// 1 número, 1 caractere especial e 1 letra maiúscula)

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tokenError, setTokenError] = useState<boolean>(false);
  const token = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
  });

  const onSubmit = useCallback(
    async (data: ResetPasswordFormInput) => {
      try {
        await resetPassword.reset({ token, newPassword: data.newPassword });
        toast.success(
          "Senha redefinida com sucesso. Faça login com a nova senha.",
        );
        navigate("/login");
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          toast.error(
            resolveApiErrorMessage(error, {
              400: "Link inválido ou expirado. Solicite uma nova redefinição.",
            }),
          );
          if (error.statusCode === 400) {
            setTokenError(true);
          }
        } else {
          // Erro fora do formato ApiError (rede, timeout etc.) — ainda assim
          // precisamos avisar o usuário, senão a falha fica silenciosa
          toast.error("Ocorreu um erro inesperado. Tente novamente.");
        }
      }
    },
    [token, navigate],
  );

  // Sem token na URL: usuário chegou aqui sem passar pelo e-mail de recuperação (RF-09)
  if (!token) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#282724] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/40">
          <h1 className="text-xl font-semibold text-[#F2DAAC]">
            Link inválido
          </h1>
          <p className="mt-1.5 text-sm text-[#F2DAAC]/60">
            Solicite uma nova redefinição de senha.
          </p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-block text-sm font-medium text-[#C41E00] transition-opacity hover:opacity-80"
          >
            Solicitar novo link →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#282724] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-[#F2DAAC]">
            Redefinir senha
          </h1>
          <p className="mt-1.5 text-sm text-[#F2DAAC]/60">
            Escolha uma nova senha para sua conta
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-1.5"
          noValidate
        >
          <label
            htmlFor="newPassword"
            className="text-xs font-medium tracking-wide text-[#F2DAAC]/80 uppercase"
          >
            Nova senha
          </label>
          <Input
            id="newPassword"
            placeholder="••••••••"
            {...register("newPassword")}
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            aria-describedby={
              errors.newPassword ? "new-password-error" : undefined
            }
            className="rounded-lg border border-[#F2DAAC]/25 bg-transparent px-3 py-2.5 text-[#F2DAAC] transition-colors focus:border-[#F2DAAC]/60 focus:outline-none"
          />
          {errors.newPassword && (
            <span id="new-password-error" className="mt-1 text-sm text-red-400">
              {errors.newPassword.message}
            </span>
          )}

          <label
            htmlFor="confirmNewPassword"
            className="mt-3 text-xs font-medium tracking-wide text-[#F2DAAC]/80 uppercase"
          >
            Confirmar nova senha
          </label>
          <Input
            id="confirmNewPassword"
            placeholder="••••••••"
            {...register("confirmNewPassword")}
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmNewPassword}
            aria-describedby={
              errors.confirmNewPassword ? "confirm-password-error" : undefined
            }
            className="rounded-lg border border-[#F2DAAC]/25 bg-transparent px-3 py-2.5 text-[#F2DAAC] transition-colors focus:border-[#F2DAAC]/60 focus:outline-none"
          />
          {errors.confirmNewPassword && (
            <span
              id="confirm-password-error"
              className="mt-1 text-sm text-red-400"
            >
              {errors.confirmNewPassword.message}
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full rounded-lg bg-[#C41E00] px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>
        {/* caso meu token seja inválido */}
        {tokenError && (
          <p className="mt-4 text-center text-sm text-[#F2DAAC]/60">
            Token expirado ou inválido.{" "}
            <Link
              to="/forgot-password"
              className="font-medium text-[#C41E00] transition-opacity hover:opacity-80"
            >
              Solicitar novo link
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
