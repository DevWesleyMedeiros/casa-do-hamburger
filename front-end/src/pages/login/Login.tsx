import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { LoginDate } from "../../shared/services/api/login/Login";

export const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setErrorMessage("Email ou Senha são obrigatórios");
      return;
    }

    setErrorMessage(null); // limpa erro anterior

    try {
      const result = await LoginDate.create({ email, password });

      if (result instanceof ApiError) {
        if (result.statusCode === 404) {
          setErrorMessage("Usuário não encontrado");
          return;
        }
        if (result.statusCode === 400) {
          setErrorMessage("Email e senha são obrigatórios");
          return;
        }
        if (result.statusCode === 500) {
          setErrorMessage("Erro no servidor, tente depois");
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
          <Input
            placeholder="Senha"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

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
