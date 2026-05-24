import { Input } from "../input/Input";
import React, { useState } from "react";

export const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  function handleOnSubimit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    alert(`Seu Email: ${email}\n sua senha: ${password}`);
  }

  return (
    <form
      className="flex h-screen items-center justify-center bg-[#161410]"
      onSubmit={handleOnSubimit}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <img src="./logo.png" alt="" className="mb-4" />
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
        <p className="text-white">Seu email:{email}</p>
        <p className="text-white">Sua senha:{password}</p>
        <button
          className="h-[7.5] w-full cursor-pointer rounded-md bg-[#C92A0E] py-2 text-sm font-bold text-white"
          type="submit"
        >
          Login
        </button>
      </div>
    </form>
  );
};
