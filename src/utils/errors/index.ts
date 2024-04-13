// Create a custom error for already existing items
export class AlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyExistsError";
  }
}
