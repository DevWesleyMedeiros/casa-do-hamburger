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
      // RN-AUTH-15: NÃO diferenciamos a mensagem por status code aqui.
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold text-[#F2DAAC]">
        Esqueci minha senha
      </h1>
      <Input
        {...register("email")}
        placeholder="seu@email.com"
        type="email"
        className="rounded border border-[#F2DAAC]/30 bg-transparent px-3 py-2 text-[#F2DAAC]"
      />
      {errors.email && (
        <span className="text-sm text-red-400">{errors.email.message}</span>
      )}

      <Button
        type="submit"
        title="Enviar"
        disabled={isSubmitting}
        colorVariation="bgRedVariation"
      >
        {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
    </form>
  );
};
