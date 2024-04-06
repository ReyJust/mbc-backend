import { Elysia, t } from "elysia";

export const authDTO = new Elysia().model({
  auth: t.Object({
    email: t.String({
      format: "email",
      error: "Invalid email",
    }),
    password: t.String({
      minLength: 8,
      maxLength: 64,
      error: "Invalid password",
    }),
  }),
});
