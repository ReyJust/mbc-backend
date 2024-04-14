import type { IDatabase } from "../types";

import { userTable } from "../db/schema.js";
import { NotFoundError } from "elysia";
import { eq } from "drizzle-orm";

export default class UserService {
  private db: IDatabase;

  constructor(db: IDatabase) {
    this.db = db;
  }

  public getUserByEmail = async (email: string) => {
    const user = await this.db.db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (!user) {
      throw new NotFoundError(`User ${email} not found`);
    }

    return user;
  };
}
