// classes de erro da minha api
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
