// classes de erro da minha api
export class ApiError extends Error {
  public readonly statusCode: number; // guarda o código https do erro que vem do backend
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
