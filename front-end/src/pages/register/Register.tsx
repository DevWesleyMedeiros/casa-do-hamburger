// por aqui, eu cadastro um usuário no meu banco de dados enviando um payload via post e que são tratados no meu backend

import { Eye, EyeOff } from "lucide-react";
import { useCallback, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { ICON_CONFIG } from "../../constant/iconConfig";
import { RegisterDate } from "../../shared/services/api/register/Register";
import { inputTrimToValue } from "../../shared/utils/Utils";

export const Register = () => {
  // estados para campos de formulário
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [matchingPasswordError, setMatchingPasswordError] = useState<
    string | null
  >(null);

  // estados para erros
  const [cep, setCep] = useState<string>("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const navigate = useNavigate();

  // validações do meu frontend
  const handleRegister = useCallback(async () => {
    if (!name || !email || !password || !confirmPassword || !cep) {
      setRegisterError("Nome, Email, Senha e CEP são obrigatórios");
      return;
    }

    if (confirmPassword !== password) {
      setMatchingPasswordError("As senhas não coincidem");
      return;
    }

    // Limpa erros anteriores antes de submeter
    setRegisterError("");
    setMatchingPasswordError("");

    try {
      const result = await RegisterDate.create({
        name: inputTrimToValue(name),
        email: inputTrimToValue(email),
        password: inputTrimToValue(password),
        cep: inputTrimToValue(cep),
      });

      // erros do backend
      switch (result.status) {
        case 409:
          setRegisterError("Email já cadastrado");
          break;
        case 400:
          setRegisterError("Todas as informações são obrigatórias");
          break;
        case 500:
          setRegisterError("Erro interno. Tente novamente mais tarde.");
          break;
        default:
          setRegisterError("");
          break;
      }

      // deu todo certo após o valores terem sidos registrados, limpa os campos
      // ativa as toast
      toast("Criando usuário ...");

      await new Promise((resolve) => setTimeout(resolve, 4000));

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCep("");
      toast.success("Usuário criado com sucesso");
      navigate("/login");
    } catch (error) {
      console.error("Erro inesperado ao registrar:", error);
      setRegisterError("Ocorreu um erro inesperado. Tente novamente.");
    }
  }, [name, email, password, confirmPassword, cep, navigate]);

  const handleOnSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleRegister();
    },
    [handleRegister],
  );

  // toggle password visibility on input form for password
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // toggle password visibility on input form for confirmPassword
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <form
      className="bg-brand-dark flex h-screen items-center justify-center"
      onSubmit={handleOnSubmit}
    >
      <div className="flex flex-col items-center justify-center rounded-xl border-[0.5px] border-white/13 px-5 py-3">
        {/* <Link to="/home">
          <img src="./logo.png" alt="logo do hamburger" className="mb-1" />
        </Link> */}

        <div className="mb-4 border-amber-100">
          <p className="text-center font-bold text-[#F2DAAC]">
            Bem vindo à Casa do Hamburguer!!
          </p>
        </div>

        <div className="justify-left flex flex-col gap-1.5 rounded-2xl border-white/13 bg-[#1b1a16] px-5 py-4 text-red-500">
          <Input
            placeholder="Seu nome"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative w-full">
            <Input
              placeholder="Senha"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500"
              aria-label={showPassword ? "Mostrar senha" : "Ocultar senha"}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          <div className="relative w-full">
            <Input
              placeholder="Confirme sua senha"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-500"
              aria-label={
                showConfirmPassword ? "Mostrar senha" : "Ocultar senha"
              }
            >
              {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {matchingPasswordError && (
            <p className="text-left text-sm font-bold">
              {matchingPasswordError}
            </p>
          )}

          <Input
            placeholder="Seu CEP"
            type="text"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
          />

          {registerError && (
            <p className="text-left text-sm font-bold">{registerError}</p>
          )}
        </div>

        <div className="flex w-full flex-col justify-start gap-1">
          <Button
            title="Criar conta"
            type="submit"
            colorVariation="bgDarkVariation"
          />

          <div className="flex w-full justify-center align-super text-[#595753]">
            <div className="my-2 h-0 w-full border"></div>
            <div className="mx-1 text-sm"> OU </div>
            <div className="my-2 h-0 w-full border"></div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              title="Cadastrar com Google"
              colorVariation="bgGoogleVariation"
            >
              <FcGoogle size={ICON_CONFIG.mxSize} />
            </Button>
            <div className="align-center my-1 flex justify-center gap-1">
              <p className="font-bold text-[#4c4b48]">Já tenho uma conta</p>
              <Link to="/login">
                <span className="text-brand-amber text-right text-sm">
                  Entrar
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
