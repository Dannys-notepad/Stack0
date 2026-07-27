// Shared response shape used by the services and controllers.
// This makes API responses consistent across the app.
export type ApiResponse<T> = {
  message: string
  data: T | null
  status: number
}

// A custom error type that carries an HTTP status code.
// This makes it easier to return meaningful errors from controllers.
export class AppError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status = 500, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.details = details
  }
}

// Helper for successful responses.
export const ok = <T>(message: string, data: T, status = 200): ApiResponse<T> => ({
  message,
  data,
  status,
})

// Helper for failed or validation responses.
export const fail = <T>(message: string, status = 400, data: T | null = null): ApiResponse<T> => ({
  message,
  data,
  status,
})
