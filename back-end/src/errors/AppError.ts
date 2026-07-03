// Classe customizada para carregar status HTTP junto com o erro e permitir instanceof checks no catch

export class AppError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'AppError' // Nomeia o erro — aparece no stack trace como "AppError" em vez de "Error"
    // seta a cadeia de protótipos para AppError. Sem ela, o instanceof AppError retorna false mesmo o objeto sendo um AppError
    Object.setPrototypeOf(this, AppError.prototype)
  }
}
