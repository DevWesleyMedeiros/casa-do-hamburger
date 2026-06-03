// arquivo de configuração do axios
import axios from "axios";

export const Api = () => {
  return axios.create({
    baseURL: "http://localhost:3000",
    // headers: {
    //   "Content-Type": "application/json",
    // },
    // não é necessário eu configurar o body aqui, pois o axios já faz isso automaticamente quando passo um objeto como segundo argumento em uma requisição POST ou PUT, por exemplo. O axios converte esse objeto para JSON e define o header "Content-Type" como "application/json" automaticamente.
    withCredentials: true, // para enviar cookies junto com as requisições
  });
};
