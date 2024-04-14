import { Elysia, t } from "elysia";
import { databaseMiddleware } from "../middlewares";

import { authDTO } from "../models/index.ts";

import { AuthService, UserService } from "../services";

export const authController = new Elysia({ prefix: "/user" })
  .use(databaseMiddleware)
  .use(authDTO)
  .derive(({ db }) => {
    return {
      AuthService: new AuthService(db),
      UserService: new UserService(db),
    };
  })
  .post(
    "/signup",
    async ({ AuthService, body: { email, password }, set }) => {
      try {
        const sessionCookie = await AuthService.signup(email, password);

        set.status = 302;
        set.headers["Location"] = "/";
        set.headers["Set-Cookie"] = sessionCookie.serialize();

        return null;
      } catch (e) {
        console.log(e);
        set.status = 400;
        return { message: "Email already used" };
      }
    },
    {
      body: "auth",
      detail: {
        summary: "Register a user",
        tags: ["Auth"],
      },
    }
  )
  .post(
    "/login",
    async ({ AuthService, UserService, body: { email, password }, set }) => {
      try {
        const user = await UserService.getUserByEmail(email);

        try {
          const sessionCookie = await AuthService.login(email, user);

          set.status = 302;
          set.headers["Location"] = "/";
          set.headers["Set-Cookie"] = sessionCookie.serialize();
        } catch {
          set.status = 400;
          return { message: "Invalid email or password" };
        }
      } catch (e) {
        // NOTE:
        // Returning immediately allows malicious actors to figure out valid emails from response times,
        // allowing them to only focus on guessing passwords in brute-force attacks.
        // As a preventive measure, you may want to hash passwords even for invalid emails.
        // However, valid emails can be already be revealed with the signup page
        // and a similar timing issue can likely be found in password reset implementation.
        // It will also be much more resource intensive.
        // Since protecting against this is none-trivial,
        // it is crucial your implementation is protected against brute-force attacks with login throttling etc.
        // If emails/usernames are public, you may outright tell the user that the username is invalid.
        set.status = 400;
        return { message: "Invalid email or password" };
      }
    },
    {
      body: "auth",
      detail: {
        summary: "Login a user",
        tags: ["Auth"],
      },
    }
  )
  .post(
    "/email-verification",
    async ({ AuthService, body: { code }, set, headers: { cookie } }) => {
      try {
        const sessionCookie = await AuthService.verifyEmail(cookie, code);

        if (!sessionCookie) {
          set.status = 401;
          return null;
        }

        set.status = 302;
        set.headers["Location"] = "/";
        set.headers["Set-Cookie"] = sessionCookie.serialize();
      } catch (e) {
        return new Response(null, {
          status: 400,
        });
      }
    },
    {
      body: t.Object({
        code: t.String(),
      }),
      headers: t.Object({
        cookie: t.String(),
      }),
      detail: {
        summary: "Verify user email",
        tags: ["Auth"],
      },
    }
  )
  .post(
    "/reset-password",
    async ({ AuthService, UserService, body: { email }, set }) => {
      const user = await UserService.getUserByEmail(email);

      if (!user || !user.email_verified) {
        set.status = 400;
        return { message: "Invalid email" };
      }
      await AuthService.resetPasswordRequest(user, email);

      set.status = 200;
      return null;
    },
    {
      body: t.Object({
        email: t.String(),
      }),
      detail: {
        summary: "Get reset user password request",
        tags: ["Auth"],
      },
    }
  )
  .get(
    "/reset-password/:token",
    async ({ AuthService, set, body: { password }, params }) => {
      try {
        const sessionCookie = await AuthService.resetPassword(
          params.token,
          password
        );

        set.status = 302;
        set.headers["Location"] = "/";
        set.headers["Set-Cookie"] = sessionCookie.serialize();
      } catch (e) {
        set.status = 400;
        return null;
      }
    },
    {
      body: t.Object({
        password: t.String({
          minLength: 8,
          maxLength: 64,
          error: "Invalid password",
        }),
      }),
      detail: {
        summary: "Reset user password",
        tags: ["Auth"],
      },
    }
  );
