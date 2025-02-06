export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}
