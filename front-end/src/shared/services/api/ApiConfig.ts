// ApiConfig.ts
import axios from "axios";

const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/";
  return apiUrl.replace(/\/auth$/, "");
};

export const api = axios.create({
  baseURL: getBaseURL(), // O axios envia automaticamente Content-Type: application/json
  withCredentials: true, // para enviar cookies junto com as requisições
});
