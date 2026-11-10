export class ApiError extends Error {
  constructor(status, code, details) {
    super(code)
    Object.assign(this, { status, code, details })
  }
}
export const invalid = (field) =>
  new ApiError(400, 'VALIDATION_ERROR', [{ field, message: 'Invalid value' }])
export const notFound = () => new ApiError(404, 'NOT_FOUND')
export function checkId(id) {
  if (typeof id !== 'string' || !/^[a-f0-9]{24}$/.test(id)) throw notFound()
  return id
}
