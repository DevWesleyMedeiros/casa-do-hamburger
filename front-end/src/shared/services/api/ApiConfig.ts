// arquivo de configuração do axios
import axios from "axios";

// Criar BASEURL: apenas http://localhost:3000 (sem /auth)
// As rotas devem incluir /auth na chamada
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/";
  
  // Remove /auth se estiver no final
  return apiUrl.replace(/\/auth$/, "");
};

export const api = () => {
  return axios.create({
    baseURL: getBaseURL(),
    // O axios envia automaticamente Content-Type: application/json
    withCredentials: true, // para enviar cookies junto com as requisições
  });
};
