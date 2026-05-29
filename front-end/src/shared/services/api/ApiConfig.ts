// arquivo de configuração do axios
import axios from "axios";

export const Api = () => {
  return axios.create({
    baseURL: "http://localhost:3000",
    headers: {
      "Content-Type": "application/json",
    },
  });
};
