import { api } from "./ApiConfig";
import { toast } from "sonner";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const message =
        error?.response.data?.error ??
        "Muitas tentativas. Aguarde antes de tentar novamente.";
      toast(message);
    }
    return Promise.reject(error);
  },
);
