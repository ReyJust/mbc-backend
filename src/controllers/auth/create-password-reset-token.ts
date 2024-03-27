import { TimeSpan, createDate } from "oslo";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import { generateId } from "lucia";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../db/schema.ts";
import { eq } from "drizzle-orm";

export const createPasswordResetToken = async (
  userId: string,
  db: NodePgDatabase<typeof schema>
): Promise<string> => {
  // Optionally invalidate all existing tokens
  await db
    .delete(schema.passwordResetTokenTable)
    .where(eq(schema.passwordResetTokenTable.userId, userId));

  const tokenId = generateId(40);
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));

  await db.insert(schema.passwordResetTokenTable).values({
    tokenHash: tokenHash,
    userId: userId,
    expiresAt: createDate(new TimeSpan(2, "h")),
  });

  return tokenId;
};
