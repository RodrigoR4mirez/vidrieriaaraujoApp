export class DomainError extends Error {}
export class ConflictError extends DomainError {
  constructor(
    message = "Conflicto de actualización. Recarga la página e inténtalo de nuevo.",
  ) {
    super(message);
  }
}
export class AlreadyExistsError extends ConflictError {}
