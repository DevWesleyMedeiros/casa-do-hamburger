// ApiConfig.ts
import axios, { CanceledError } from 'axios';
import { sessionRequests } from '../sessionRequests';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    sessionGeneration?: number;
    sessionController?: AbortController;
  }
}

const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/';
  return apiUrl.replace(/\/auth$/, '');
};

export const api = axios.create({
  baseURL: getBaseURL(), // O axios envia automaticamente Content-Type: application/json
  withCredentials: true, // para enviar cookies junto com as requisições
});

api.interceptors.request.use(
  (config) => {
    if (config.method === 'get' && config.url === '/auth/products') return config;
    config.sessionGeneration = sessionRequests.generation();
    const controller = new AbortController();
    config.sessionController = controller;
    if (config.signal?.aborted) controller.abort();
    else config.signal?.addEventListener?.('abort', () => controller.abort(), { once: true });
    config.signal = controller.signal;
    sessionRequests.track(controller);
    return config;
  },
  undefined,
  { synchronous: true },
);

api.interceptors.response.use(
  (response) => {
    sessionRequests.release(response.config.sessionController);
    if (
      response.config.sessionGeneration !== undefined &&
      response.config.sessionGeneration !== sessionRequests.generation()
    ) {
      throw new CanceledError('Sessão alterada');
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      sessionRequests.release(error.config?.sessionController);
      if (
        error.config?.sessionGeneration !== undefined &&
        error.config.sessionGeneration !== sessionRequests.generation()
      ) {
        return Promise.reject(new CanceledError('Sessão alterada'));
      }
      const publicAuth = [
        '/auth/login',
        '/auth/register',
        '/auth/google',
        '/auth/forgot-password',
        '/auth/reset-password',
      ];
      if (error.response?.status === 401 && !publicAuth.includes(error.config?.url ?? '')) {
        sessionRequests.expire();
      }
    }
    return Promise.reject(error);
  },
);
