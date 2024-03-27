import { Elysia, t } from "elysia";
import init_database from "../../db";
import { sessionMiddleware } from "../../middlewares";
import { userTable } from "../../db/schema";
import { eq } from "drizzle-orm";
const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const userController = new Elysia({ prefix: "/user" })
  .use(db)
  .use(sessionMiddleware)
  .get(
    "/",
    async ({ db, user, session }) => {
    // ! See if fetching is needed. Because the context already gives us.
    //   const userId = user!.id;

    //   const profile = await db.db
    //     .select({
    //         email: userTable.email,
    //         email_verified: userTable.email_verified
    //     })
    //     .from(userTable)
    //     .where(eq(userTable.id, userId));

    //   return profile;

      return user;
    },
    {
      detail: {
        summary: "Get User Profile",
        tags: ["User"],
      },
    }
  );
