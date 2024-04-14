import { Elysia, t } from "elysia";
import { sessionMiddleware, databaseMiddleware } from "../middlewares";

import UserService from "../services/user.service";

export const userController = new Elysia({ prefix: "/user" })
  .use(databaseMiddleware)
  .use(sessionMiddleware)
  .derive(({ db }) => {
    return {
      UserService: new UserService(db),
    };
  })
  .get(
    "/",
    async ({ UserService, user, session }) => {
      // TODO: Use service
      // const user = await UserService.getUserByEmail(user.email);

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
