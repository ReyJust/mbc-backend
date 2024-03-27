import { eq } from "drizzle-orm";
import * as schema from "../../db/schema.ts";

import { TimeSpan, createDate } from "oslo";
import { generateRandomString, alphabet } from "oslo/crypto";
import type { DrizzleDatabase } from "../../db/index.ts";

export const generateEmailVerificationCode = async (
  userId: string,
  email: string,
  db: DrizzleDatabase
): Promise<string> => {
  await db.db
    .delete(schema.emailVerificationCodeTable)
    .where(eq(schema.emailVerificationCodeTable.userId, userId));

  const code = generateRandomString(8, alphabet("0-9"));
  await db.db.insert(schema.emailVerificationCodeTable).values({
    userId,
    email,
    code,
    expiresAt: createDate(new TimeSpan(15, "m")), // 15 minutes
  });
  return code;
};
