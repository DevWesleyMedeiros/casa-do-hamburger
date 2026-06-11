import { Eye, EyeOff } from "lucide-react";
import React, { useCallback, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/button/Button";
import { Input } from "../../components/input/Input";
import { UserContext } from "../../shared/context/UserContext";
import { ApiError } from "../../shared/services/api/ApiExceptions";
import { LoginDate } from "../../shared/services/api/login/Login";


export const Login = () => {
  const [email, setEmail] = useState<string | null>("");
  const [password, setPassword] = useState<string | null>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // variável que desestrutura as variávies de um contexto do tipo UserContext
  const { setUser } = useContext(UserContext); // somente uso o setUser, pois eu recebo o user, mas o  uso será noutro componente

  // variável de navegação
  const navigate = useNavigate();

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
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
          setIsLoading(false);
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

        setErrorMessage(result.message);
        return;
      }

      // Se chegou aqui, é porque NÃO é ApiError — ou seja, sucesso
      // setUser é um objeto UserDate {} ou null
      setUser({
        name: result.user.name,
        email: result.user.email,
        admin: result.user.admin,
      });
      setEmail("");
      setPassword("");
      navigate("/home");

      console.log("Login bem-sucedido:", result); // dados do usuário cadastrado num objeto padrão
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      setErrorMessage("Ocorreu um erro inesperado. Tente novamente.");
    }
  }, [email, password, navigate, setUser]);

  const handleOnSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleLogin();
      // setIsLoading(true);
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
      <div className="justify-left flex flex-col items-center gap-2 rounded-xl border-[0.5px] border-white/13 p-7">
        <Link to="/home">
          <img src="./logo.png" alt="logo da hamburgeria" className="mb-4" />
        </Link>

        <div className="mb-4 border-amber-100">
          <p className="text-center font-bold text-[#F2DAAC]">
            Bem vindo à Casa do Hamburguer!!
          </p>
        </div>

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

          <Button
            type="submit"
            title={isLoading ? "Entrando" : "Entrar"}
            colorVariation="bgRedVariation"
          />

          <div>
            <Link to="/register" className="w-full">
              <Button
                type="button"
                title="Não tem uma conta?"
                colorVariation="bgWhiteVariation"
              />
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
};
