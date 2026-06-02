import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { RegisterDate } from "../../shared/services/api/register/Register";
import { EyeOff, Eye } from "lucide-react";

export const Register = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [matchingPasswordError, setMatchingPasswordError] = useState<
    string | null
  >(null);
  const [cep, setCep] = useState<string>("");
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

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
      const result = await RegisterDate.create({ name, email, password, cep });

      // erros do backend
      switch (result.status) {
        case 409:
          setRegisterError("Email já cadastrado");
          break;
        case 400:
          setRegisterError("Todas as informações são obrigatórias");
          break;
        case 201:
          setName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setCep("");
          break;
        case 500:
          setRegisterError("Erro interno. Tente novamente mais tarde.");
          break;
        default:
          setRegisterError("");
          break;
      }
    } catch (error) {
      console.error("Erro inesperado ao registrar:", error);
      setRegisterError("Ocorreu um erro inesperado. Tente novamente.");
    }
  }, [name, email, password, confirmPassword, cep]);

  const handleOnSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleRegister();
    },
    [handleRegister],
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <form
      className="flex h-screen items-center justify-center bg-[#161410]"
      onSubmit={handleOnSubmit}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <Link to="/home">
          <img src="./logo.png" alt="logo do hamburger" className="mb-4" />
        </Link>

        <div className="justify-left flex flex-col gap-2">
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
            <p className="text-left text-sm font-bold text-red-500">
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
            <p className="text-left text-sm font-bold text-red-500">
              {registerError}
            </p>
          )}
        </div>

        <div className="mt-2 flex w-full flex-col gap-1">
          <Button title="Criar conta" type="submit" />

          <Link to="/login" className="w-full">
            <Button
              title="Já tenho uma conta"
              type="button"
              colorVariation="bgWhiteVariation"
            />
          </Link>
        </div>
      </div>
    </form>
  );
};
