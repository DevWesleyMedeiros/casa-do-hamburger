// classes de erro da minha api
export class ApiError extends Error {
  public readonly statusCode: number; // guarda o código https do erro que vem do backend
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}
