import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/input/Input";
import { Button } from "../../components/button/Button";

export const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  function handleOnSubimit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    alert({ email, password });
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
        {/* <p className="text-white">Seu email:{email}</p>
        <p className="text-white">Sua senha:{password}</p> */}

        <Button
          type="submit"
          title="Login"
          colorVariation="bgRedVariation"
        ></Button>
        <Button
          type="submit"
          title="Não tem uma conta?"
          colorVariation="bgWhiteVariation"
        ></Button>
      </div>
    </form>
  );
};
