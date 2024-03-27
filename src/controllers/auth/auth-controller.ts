import { Elysia, t } from "elysia";
import init_database from "../../db/index.js";
import { lucia } from "../../lucia.ts";
import { generateId } from "lucia";
import { userTable, passwordResetTokenTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";

import { authModel } from "../../models/auth.model.js";
import { generateEmailVerificationCode } from "./generate-email-verification-code.js";
import { sendVerificationCode } from "./send-verification-code.js";
import { verifyVerificationCode } from "./verify-verification-code.js";
import { createPasswordResetToken } from "./create-password-reset-token.js";
import { sendPasswordResetToken } from "./send-password-reset-token.js";

import { isWithinExpirationDate } from "oslo";
import { Argon2id } from "oslo/password";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";

const db = new Elysia({ name: "db" }).decorate("db", await init_database());

export const authController = new Elysia({ prefix: "/user" })
  .use(db)
  .use(authModel)
  .post(
    "/signup",
    async ({ db, body: { email, password }, set }) => {
      const hashedPassword = await Bun.password.hash(password);
      const userId = generateId(15);

      try {
        await db.db.insert(userTable).values({
          id: userId,
          email,
          hashed_password: hashedPassword,
          email_verified: false,
        });

        const verificationCode = await generateEmailVerificationCode(
          userId,
          email,
          db
        );

        await sendVerificationCode(email, verificationCode);

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

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
    }
  )
  .post(
    "/login",
    async ({ db, body: { email, password }, set }) => {
      const user = await db.db.query.userTable.findFirst({
        where: eq(userTable.email, email),
      });

      if (!user) {
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

      const validPassword = await Bun.password.verify(
        password,
        user.hashed_password
      );

      if (!validPassword) {
        set.status = 400;
        return { message: "Invalid email or password" };
      }

      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      set.status = 302;
      set.headers["Location"] = "/";
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    },
    {
      body: "auth",
    }
  )
  .post(
    "/email-verification",
    async ({ db, body: { code }, set, headers: { cookie } }) => {
      const sessionId = lucia.readSessionCookie(cookie ?? ""); // ? get the correct value from the cookies string
      if (!sessionId) {
        set.status = 401;
        return null;
      }
      const { user } = await lucia.validateSession(sessionId);
      if (!user) {
        set.status = 401;
        return null;
      }

      const validCode = await verifyVerificationCode(user, code, db.db);
      if (!validCode) {
        return new Response(null, {
          status: 400,
        });
      }

      await lucia.invalidateUserSessions(user.id);
      await db.db
        .update(userTable)
        .set({ email_verified: true })
        .where(eq(userTable.id, user.id));

      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      set.status = 302;
      set.headers["Location"] = "/";
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    },
    {
      body: t.Object({
        code: t.String(),
      }),
      headers: t.Object({
        cookie: t.String(),
      }),
    }
  )
  .post(
    "/reset-password",
    async ({ db, body: { email }, set }) => {
      const user = await db.db.query.userTable.findFirst({
        where: eq(userTable.email, email),
      });

      if (!user || !user.email_verified) {
        set.status = 400;
        return { message: "Invalid email" };
      }

      const verificationToken = await createPasswordResetToken(user.id, db.db);
      // TODO: hostname must be dynamic
      const verificationLink =
        "http://localhost:3000/reset-password/" + verificationToken;

      await sendPasswordResetToken(email, verificationLink);

      set.status = 200;
      return null;
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    }
  )
  .get(
    "/reset-password/:token",
    async ({ db, set, body: { password }, params }) => {
      const verificationToken = params.token;

      const tokenHash = encodeHex(
        await sha256(new TextEncoder().encode(verificationToken))
      );

      const token = await db.db.query.passwordResetTokenTable.findFirst({
        where: eq(passwordResetTokenTable.tokenHash, tokenHash),
      });

      if (token) {
        await db.db
          .delete(passwordResetTokenTable)
          .where(eq(passwordResetTokenTable.tokenHash, tokenHash));
      }

      if (!token || !isWithinExpirationDate(token.expiresAt)) {
        set.status = 400;
        return null;
      }

      await lucia.invalidateUserSessions(token.userId);
      const hashedPassword = await new Argon2id().hash(password);

      await db.db
        .update(userTable)
        .set({ hashed_password: hashedPassword })
        .where(eq(userTable.id, token.userId));

      const session = await lucia.createSession(token.userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      set.status = 302;
      set.headers["Location"] = "/";
      set.headers["Set-Cookie"] = sessionCookie.serialize();
    },
    {
      body: t.Object({
        password: t.String({
          minLength: 8,
          maxLength: 64,
          error: "Invalid password",
        }),
      }),
    }
  );
