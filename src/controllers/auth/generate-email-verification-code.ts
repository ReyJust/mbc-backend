import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../db/schema.js";
import { eq } from "drizzle-orm";

import { TimeSpan, createDate } from "oslo";
import { generateRandomString, alphabet } from "oslo/crypto";

export const generateEmailVerificationCode = async (
  userId: string,
  email: string,
  db: NodePgDatabase<typeof schema>
): Promise<string> => {
  await db
    .delete(schema.emailVerificationCodeTable)
    .where(eq(schema.userTable.id, userId));

  const code = generateRandomString(8, alphabet("0-9"));
  await db.insert(schema.emailVerificationCodeTable).values({
    userId,
    email,
    code,
    expiresAt: createDate(new TimeSpan(15, "m")), // 15 minutes
  });
  return code;
};
