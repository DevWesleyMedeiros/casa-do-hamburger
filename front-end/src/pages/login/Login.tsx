import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/input/Input";
import { Button } from "../../components/button/Button";
import { LoginDate } from "../../shared/services/api/login/Login";
import { ApiError } from "../../shared/services/api/ApiExceptions";

export const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // função que envia dados de login ao backend
  const handleLogin = useCallback(async () => {
    if (!email || !password) return;

    // validações separdas para email
    // validação separada para password

    // Passando os dados capturados para o serviço de API
    const result = await LoginDate.create({ email, password });

    if (result instanceof ApiError) {
      alert(result.message);
      return;
    }

    return result;
  }, [email, password]);

  function handleOnSubimit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log({ email, password });
    handleLogin();
  }

  return (
    <form
      className="flex h-screen items-center justify-center bg-[#161410]"
      onSubmit={handleOnSubimit}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <Link to="/home">
          <img src="./logo.png" alt="" className="mb-4" />
        </Link>
        <Input
          placeholder="E-mail"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        ></Input>
        <Input
          placeholder="Senha"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        ></Input>

        {/* botão que tera o type=submit, pois enviará email e senha para o backend */}
        <Button
          type="submit"
          title="Login"
          colorVariation="bgRedVariation"
        ></Button>

        <Link to="/register" className="w-full">
          <Button
            type="button"
            title="Não tem uma conta?"
            colorVariation="bgWhiteVariation"
          ></Button>
        </Link>

        {/* com botões, a envelopação acarreta erro no style: pesquisar sobre isso */}
      </div>
    </form>
  );
};
