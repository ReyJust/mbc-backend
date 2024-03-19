import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";

import { sessionTable, userTable } from "./db/schema.ts";
import init_database from "./db/index.ts";

const db = await init_database();

const adapter = new DrizzlePostgreSQLAdapter(db.db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes: any) => {
    return {
      // we don't need to expose the hashed password!
      email: attributes.email,
      emailVerified: attributes.email_verified,
    };
  },
});

// ! IMPORTANT!
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      email_verified: boolean;
    };
  }
}
