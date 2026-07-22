// por aqui, eu cadastro um usuário no meu banco de dados enviando um payload via post e que são tratados no meu backend

import { zodResolver } from "@hookform/resolvers/zod";
// conector que faz o react-hook-form conversar com o Zod

import { Copy, Eye, EyeOff, Wand2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { ICON_CONFIG } from "../../constant/iconConfig";
import {
  registerSchema,
  type registerInput,
} from "../../shared/schemas/authSchemas";
import { RegisterDate } from "../../shared/services/api/register/Register";
import { passwordGenerator } from "../../shared/utils/PasswordGenerator";
import { displayStrongPassword } from "../../shared/utils/Utils";
import { ApiError } from "../../shared/services/api/ApiExceptions";

export const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const navigate = useNavigate();

  // estados que controlaram o popover effect
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [suggestedPassword, setSuggestedPassword] = useState<string>("");

  // useForm conectado ao Zod via zodResolver
  // register → conecta cada input ao useForm (como se fosse o value e setValue de um input)
  // handleSubmit → envolve o onSubmit, só chama se o schema validar
  // formState → carrega os erros de cada campo
  // reset → reseta os campos do input
  const {
    register,
    handleSubmit,
    setValue,
    // é uma função que permite alterar dinamicamente o valor de um campo de forma programática, sem precisar que o usuário digite ou interaja diretamente
    watch,
    // lê o valor atual de um campo sem causar re-render excessivo
    formState: { errors, isSubmitting },
    // ainda dentro do formState, temos um propriedade disable -> usada para gerar formulários de visualização somente
    reset,
  } = useForm<registerInput>({
    resolver: zodResolver(registerSchema), // antes de chamar o submit pelo useForm, o zod irá validar
    // defaultValues: {
    //   name: "Seu nome",
    //   email: "E-mail",
    //   password: "Sua senha",
    //   confirmPassword: "Confirme sua senha",
    //   cep: "Digite um cep",
    // },
    // passe os defaults values se você sabe os status inicial dos seus inputs
  });

  // abre uma janela popover com uma sugestão de senha
  const handleSugestedPassword = useCallback(() => {
    setSuggestedPassword(passwordGenerator());
    setShowPopover((prev) => !prev);
  }, []);

  // gera outra senha sem fechar o popover
  const handleRegeneratePassword = useCallback(() => {
    setSuggestedPassword(passwordGenerator());
    toast("Nova senha gerada");
  }, []);

  // aplica a senha sugerida nos dois campos e fecha o popover
  const handlePassword = useCallback(() => {
    setValue("password", suggestedPassword, { shouldValidate: true });
    setValue("confirmPassword", suggestedPassword, { shouldValidate: true });
    // se shouldValidate for true, vai acionar a validação do campo imediatamente
    // { shouldValidate: true } → dispara o Zod imediatamente após setar
    // assim o indicador de força já aparece e o erro some na hora
    setShowPopover(false);
    toast.success("Senha aplicada!");
  }, [suggestedPassword, setValue]);

  // função que pega senha no clipboard
  const handleCopyPassword = useCallback(async () => {
    await navigator.clipboard.writeText(suggestedPassword);
    toast.success("Senha copiada para área de transferência");
  }, [suggestedPassword]);

  // watch('password') assina o campo e retorna o valor atual
  // usado para calcular a força em tempo real enquanto o usuário digita
  const passwordValue = watch("password") ?? "";
  // monitorar e retornar o valor de um ou mais campos do formulário em tempo real

  const strength = displayStrongPassword(passwordValue);

  const onSubmit: SubmitHandler<registerInput> = useCallback(
    async (data) => {
      setIsLoading(true); // não se usa toogle para valores booleanos absolutos
      // toggle para controlar um estado booleano que deveria ser explícito. Isso é um code smell clássico: se por qualquer motivo a função rodar fora da ordem esperada (double-click no botão antes do disabled surtir efeito, StrictMode remontando em dev, etc.), o estado pode "destravar" incorretamente. A prática correta é sempre setar o valor absoluto:

      try {
        await RegisterDate.create({
          name: data.name,
          email: data.email,
          password: data.password,
          cep: data.cep,
        });

        // Se chegou até aqui, a Promise resolveu = backend respondeu 2xx.
        // Não existe mais motivo para checar result?.status manualmente.
        reset();
        toast.success("Usuário criado com sucesso");
        navigate("/login");
      } catch (error) {
        const finalError =
          error instanceof ApiError
            ? error
            : new ApiError(500, "Erro inesperado");

        if (finalError.statusCode === 409) {
          toast.error("Email já cadastrado");
        } else if (finalError.statusCode === 400) {
          toast.error("Todas as informações são obrigatórias");
        } else {
          toast.error(finalError.message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, reset],
  );

  // manipula os views da senha e confirmar senha
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <form
      className="bg-brand-dark flex h-screen flex-col items-center justify-center"
      onSubmit={handleSubmit(onSubmit)} // ← handleSubmit valida antes de chamar onSubmit
    >
      <div className="flex flex-col items-center justify-center rounded-xl border-[0.5px] border-white/13 px-5 py-3">
        <div className="justify-left third-level flex flex-col gap-1.5 rounded-2xl border-white/13 bg-[#1b1a16] px-5 py-4">
          {/* nome */}
          <Input
            placeholder="Seu nome"
            type="text"
            {...register("name")}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-brand-red mt-1 text-left text-xs font-bold">
              {errors.name.message}
            </p>
          )}

          {/* email */}
          <Input
            placeholder="E-mail"
            type="email"
            {...register("email")}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-0.5 text-left text-xs font-bold text-red-500">
              {errors.email.message}
            </p>
          )}

          <div className="relative flex w-full flex-col">
            {/* password */}
            <Input
              placeholder="Senha"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute top-1/2 right-8 -translate-y-1/2 transform text-gray-500"
              aria-label={showPassword ? "Mostrar senha" : "Ocultar senha"}
            >
              {showPassword ? (
                <Eye size={ICON_CONFIG.mnSize} />
              ) : (
                <EyeOff size={ICON_CONFIG.mnSize} />
              )}
            </button>

            {/* ícone varinha — abre o popover de sugestão */}
            <button
              type="button"
              onClick={handleSugestedPassword}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-white/40 transition-colors hover:text-[#F2DAAC]"
              aria-label="Sugerir senha forte"
              title="Sugerir senha forte"
            >
              <Wand2 size={ICON_CONFIG.mnSize} />
            </button>
          </div>

          {/* popover de sugestão */}
          {showPopover && (
            <div className="mt-2 rounded-lg border border-white/12 bg-[#1f1d18] p-3">
              {/* senha sugerida */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-mono text-sm break-all text-white/80">
                  {suggestedPassword}
                </p>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="shrink-0 text-white/40 transition-colors hover:text-[#F2DAAC]"
                  aria-label="Copiar senha sugerida"
                  title="Copiar senha"
                >
                  <Copy size={ICON_CONFIG.mnSize} />
                </button>
              </div>

              {/* ações */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePassword}
                  className="flex-1 rounded-md bg-[#C41E00] py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#a81900]"
                >
                  Usar esta senha
                </button>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="flex-1 rounded-md border border-white/12 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/5"
                >
                  Gerar outra
                </button>
                <button
                  type="button"
                  onClick={() => setShowPopover(false)}
                  className="rounded-md border border-white/8 px-2.5 py-1.5 text-white/40 transition-colors hover:bg-white/5"
                  aria-label="Fechar sugestão"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* só aparece quando o usuário começa a digitar */}
          {passwordValue && (
            <div className="mt-1.5 flex items-center gap-1 px-0.5">
              {strength.bars.map((active, i) => (
                <div
                  key={i}
                  className="h-0.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: active
                      ? strength.color
                      : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
              <span className="ml-1.5 text-[11px] text-white/35">
                {strength.label}
              </span>
            </div>
          )}

          {errors.password && (
            <p className="mt-0.5 text-left text-xs font-bold text-red-500">
              {errors.password.message}
            </p>
          )}
          <div className="relative flex flex-col gap-2">
            {/* div campos formulário */}
            {/* confirmar senha */}
            <Input
              placeholder="Confirme sua senha"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute top-5 right-3 -translate-y-1/2 transform text-gray-500"
              aria-label={
                showConfirmPassword ? "Mostrar senha" : "Ocultar senha"
              }
            >
              {showConfirmPassword ? (
                <Eye size={ICON_CONFIG.mnSize} />
              ) : (
                <EyeOff size={ICON_CONFIG.mnSize} />
              )}
            </button>
            {errors.confirmPassword && (
              <p className="mt-0.5 text-left text-xs font-bold text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}

            {/* cep */}
            <Input
              placeholder="Seu CEP"
              type="text"
              {...register("cep")}
              disabled={isSubmitting}
            />
            <p className="mt-0.5 text-left text-xs text-white/30">
              formato: 00000-000
            </p>
            {errors.cep && (
              <p className="mt-0.5 text-left text-xs font-bold text-red-500">
                {errors.cep.message}
              </p>
            )}

            <div className="flex flex-col justify-center">
              <Button
                title={isLoading ? "Cadastrando" : "Cadastrar"}
                type="submit"
                colorVariation="bgDarkVariation"
                disabled={isLoading}
                // desabilitar o botão durante o envio dos dados para registro
              />

              <div className="my-1 flex w-full justify-center align-super text-[#595753]">
                <div className="my-2 h-0 w-full border"></div>
                <div className="mx-1 text-sm"> OU </div>
                <div className="my-2 h-0 w-full border"></div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  title="Registrar com Google"
                  colorVariation="bgGoogleVariation"
                  disabled={isSubmitting}
                >
                  <FcGoogle size={ICON_CONFIG.mxSize} />
                </Button>

                <div className="align-center my-1 flex justify-center gap-1">
                  <p className="font-bold text-[#4c4b48]">Já tenho uma conta</p>
                  <Link to={isSubmitting ? "#" : "/login"}>
                    <span
                      className={`text-brand-amber text-right text-sm ${isSubmitting ? "pointer-events-none cursor-not-allowed opacity-50 select-none" : ""}`}
                    >
                      Entrar
                    </span>
                  </Link>
                  ,
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
