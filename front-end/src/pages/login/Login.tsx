import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { LoginDate } from "../../shared/services/api/login/Login";
import { EyeOff, Eye } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setErrorMessage("Email ou Senha são obrigatórios");
      return;
    }

    setErrorMessage(null); // limpa erro anterior

    try {
      const result = await LoginDate.create({ email, password });

      if (result instanceof ApiError) {

        if (result.statusCode === 400) {
          setErrorMessage("Email e senha são obrigatórios");
          return;
        }
        if (result.statusCode === 401) {
          setErrorMessage("Senha incorreta");
          return;
        }
        if (result.statusCode === 404) {
          setErrorMessage("Usuário não encontrado");
          return;
        }

        if (result.statusCode === 500) {
          setErrorMessage("Erro no servidor, tente depois");
          return;
        }
        if (result.statusCode === 200) {
          setErrorMessage("");
          console.log({ result });
          return;
        }
        setErrorMessage(result.message);
        return;
      }
      console.log("Login bem-sucedido:", result);
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      setErrorMessage("Ocorreu um erro inesperado. Tente novamente.");
    }
  }, [email, password]);

  const handleOnSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleLogin();
    },
    [handleLogin],
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <form
      className="flex h-screen items-center justify-center bg-[#161410]"
      onSubmit={handleOnSubmit}
    >
      <div className="justify-left flex flex-col items-center gap-2">
        <Link to="/home">
          <img src="./logo.png" alt="logo da hamburgeria" className="mb-4" />
        </Link>

        <div className="justify-left flex flex-col gap-2">
          <Input
            placeholder="E-mail"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative w-full">
            <Input
              placeholder="Senha"
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Mostrar senha" : "Ocultar senha"}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {errorMessage && (
            <p className="text-left text-sm font-bold text-red-500">
              {errorMessage}
            </p>
          )}

          <Button type="submit" title="Login" colorVariation="bgRedVariation" />
          <Link to="/register" className="w-full">
            <Button
              type="button"
              title="Não tem uma conta?"
              colorVariation="bgWhiteVariation"
            />
          </Link>
        </div>
      </div>
    </form>
  );
};
