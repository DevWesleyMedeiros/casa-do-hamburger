import { Input } from "../../components/input/Input";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/button/Button";

export const Register = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [cep, setCep] = useState<string>("");

  function handleOnSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log({ name, email, password, confirmPassword, cep });
  }

  return (
    <form
      className="flex h-screen items-center justify-center bg-[#161410]"
      onSubmit={handleOnSubmit}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <Link to="/home">
          <img src="./logo.png" alt="logo do hamburger" className="mb-4" />
        </Link>
        <Input
          placeholder="Seu nome"
          type="text"
          onChange={(e) => setName(e.target.value)}
        />
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
        <Input
          placeholder="Confirme sua senha"
          type="password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Input
          placeholder="Seu CEP"
          type="text"
          onChange={(e) => setCep(e.target.value)}
        />
        <Button title="Criar conta" type="submit"></Button>

        <Link to="/login" className="w-full">
          <Button
            title="Já tenho uma conta"
            type="submit"
            colorVariation="bgWhiteVariation"
          ></Button>
        </Link>
      </div>
    </form>
  );
};
