import type { IDatabase } from "../types";

export class BusRoutesService {
  private db: IDatabase;

  constructor(db: IDatabase) {
    this.db = db;
  }
}
