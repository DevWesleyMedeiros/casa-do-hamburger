import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword } from "../../shared/services/api/recovery/resetPassword";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "../../shared/schemas/passwordResetSchema";
import { resolveApiErrorMessage } from "../../shared/utils/apiErrorMessage";
import { useCallback } from "react";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { Input } from "../../components/input/Input";

// RN-CRYPT-04 — mesma política validada no backend

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
        }
      }
    },
    [token, navigate],
  );

  if (!token) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 text-center">
        <h1 className="text-xl font-semibold text-[#F2DAAC]">Link inválido</h1>
        <p className="text-sm text-[#F2DAAC]/80">
          Solicite uma nova redefinição de senha.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex max-w-sm flex-col gap-4"
    >
      <h1 className="text-xl font-semibold text-[#F2DAAC]">Redefinir senha</h1>

      <Input
        placeholder="Nova senha"
        {...register("newPassword")}
        type="password"
        className="rounded border border-[#F2DAAC]/30 bg-transparent px-3 py-2 text-[#F2DAAC]"
      />
      {errors.newPassword && (
        <span className="text-sm text-red-400">
          {errors.newPassword.message}
        </span>
      )}

      <Input
        placeholder="Confirmar nova senha"
        {...register("confirmNewPassword")}
        type="password"
        className="rounded border border-[#F2DAAC]/30 bg-transparent px-3 py-2 text-[#F2DAAC]"
      />
      {errors.confirmNewPassword && (
        <span className="text-sm text-red-400">
          {errors.confirmNewPassword.message}
        </span>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-[#C41E00] px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
      </button>
    </form>
  );
}
