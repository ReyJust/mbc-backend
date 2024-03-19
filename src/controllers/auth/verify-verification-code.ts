import type { User } from "lucia";
import * as schema from "../../db/schema.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { isWithinExpirationDate } from "oslo";

export const verifyVerificationCode = async (
  user: User,
  code: string,
  db: NodePgDatabase<typeof schema>
): Promise<boolean> => {
  const databaseCode = await db.query.emailVerificationCodeTable.findFirst({
    where: eq(schema.emailVerificationCodeTable.userId, user.id),
  });

  if (!databaseCode || databaseCode.code !== code) {
    return false;
  }

  await db
    .delete(schema.emailVerificationCodeTable)
    .where(eq(schema.emailVerificationCodeTable.id, databaseCode.id));

  if (!isWithinExpirationDate(databaseCode.expiresAt)) {
    return false;
  }
  if (databaseCode.email !== user.email) {
    return false;
  }
  return true;
};
