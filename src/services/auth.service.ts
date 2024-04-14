import { eq } from "drizzle-orm";

import { isWithinExpirationDate, TimeSpan, createDate } from "oslo";
import { generateRandomString, alphabet, sha256 } from "oslo/crypto";
import { Argon2id } from "oslo/password";
import { encodeHex } from "oslo/encoding";

import { lucia } from "../lucia.ts";
import { type User, generateId } from "lucia";
import {
  userTable,
  passwordResetTokenTable,
  emailVerificationCodeTable,
} from "../db/schema.js";

import type { IDatabase } from "../types";

export class AuthService {
  private db: IDatabase;

  constructor(db: IDatabase) {
    this.db = db;
  }

  public signup = async (email: string, password: string) => {
    const hashedPassword = await Bun.password.hash(password);
    const userId = generateId(15);

    await this.db.db.insert(userTable).values({
      id: userId,
      email,
      hashed_password: hashedPassword,
      email_verified: false,
    });

    const verificationCode = await this._generateEmailVerificationCode(
      userId,
      email
    );

    await this._sendVerificationCode(email, verificationCode);

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return sessionCookie;
  };

  public login = async (
    password: string,
    user: {
      email: string;
      id: string;
      hashed_password: string;
      email_verified: boolean | null;
    }
  ) => {
    const validPassword = Bun.password.verify(password, user.hashed_password);

    if (!validPassword) {
      throw Error("Invalid email or password");
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return sessionCookie;
  };

  public verifyEmail = async (cookie: string, code: string) => {
    const sessionId = lucia.readSessionCookie(cookie ?? ""); // ? get the correct value from the cookies string
    if (!sessionId) {
      return null;
    }
    const { user } = await lucia.validateSession(sessionId);
    if (!user) {
      return null;
    }

    const validCode = await this._verifyVerificationCode(user, code);
    if (!validCode) {
      throw Error("Invalid Code");
    }

    await lucia.invalidateUserSessions(user.id);
    await this.db.db
      .update(userTable)
      .set({ email_verified: true })
      .where(eq(userTable.id, user.id));

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return sessionCookie;
  };

  public resetPasswordRequest = async (
    user: {
      email: string;
      id: string;
      hashed_password: string;
      email_verified: boolean | null;
    },
    email: string
  ) => {
    const verificationToken = await this._createPasswordResetToken(user.id);
    // TODO: hostname must be dynamic
    const verificationLink =
      "http://localhost:3000/reset-password/" + verificationToken;

    await this._sendPasswordResetToken(email, verificationLink);
  };

  public resetPassword = async (
    verificationToken: string,
    password: string
  ) => {
    const tokenHash = encodeHex(
      await sha256(new TextEncoder().encode(verificationToken))
    );

    const token = await this.db.db.query.passwordResetTokenTable.findFirst({
      where: eq(passwordResetTokenTable.tokenHash, tokenHash),
    });

    if (token) {
      await this.db.db
        .delete(passwordResetTokenTable)
        .where(eq(passwordResetTokenTable.tokenHash, tokenHash));
    }

    if (!token || !isWithinExpirationDate(token.expiresAt)) {
      throw Error("Token invalid or expired");
    }

    await lucia.invalidateUserSessions(token.userId);
    const hashedPassword = await new Argon2id().hash(password);

    await this.db.db
      .update(userTable)
      .set({ hashed_password: hashedPassword })
      .where(eq(userTable.id, token.userId));

    const session = await lucia.createSession(token.userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return sessionCookie;
  };

  private _createPasswordResetToken = async (
    userId: string
  ): Promise<string> => {
    // Optionally invalidate all existing tokens
    await this.db.db
      .delete(passwordResetTokenTable)
      .where(eq(passwordResetTokenTable.userId, userId));

    const tokenId = generateId(40);
    const tokenHash = encodeHex(
      await sha256(new TextEncoder().encode(tokenId))
    );

    await this.db.db.insert(passwordResetTokenTable).values({
      tokenHash: tokenHash,
      userId: userId,
      expiresAt: createDate(new TimeSpan(2, "h")),
    });

    return tokenId;
  };

  private _generateEmailVerificationCode = async (
    userId: string,
    email: string
  ): Promise<string> => {
    await this.db.db
      .delete(emailVerificationCodeTable)
      .where(eq(emailVerificationCodeTable.userId, userId));

    const code = generateRandomString(8, alphabet("0-9"));
    await this.db.db.insert(emailVerificationCodeTable).values({
      userId,
      email,
      code,
      expiresAt: createDate(new TimeSpan(15, "m")), // 15 minutes
    });
    return code;
  };

  private _sendVerificationCode = async (
    email: string,
    verificationCode: string
  ) => {
    // TODO: send email.
    console.log("Code is: ", verificationCode);
  };

  private _verifyVerificationCode = async (
    user: User,
    code: string
  ): Promise<boolean> => {
    const databaseCode =
      await this.db.db.query.emailVerificationCodeTable.findFirst({
        where: eq(emailVerificationCodeTable.userId, user.id),
      });

    if (!databaseCode || databaseCode.code !== code) {
      return false;
    }

    await this.db.db
      .delete(emailVerificationCodeTable)
      .where(eq(emailVerificationCodeTable.id, databaseCode.id));

    if (!isWithinExpirationDate(databaseCode.expiresAt)) {
      return false;
    }
    if (databaseCode.email !== user.email) {
      return false;
    }
    return true;
  };

  private _sendPasswordResetToken = async (
    email: string,
    verificationLink: string
  ) => {
    // TODO: send email.
  };
}
