// test/index.test.ts
import { describe, expect, it } from "bun:test";
import { app } from "../app";

describe("General endpoints", () => {
  it("Be Healthy!", async () => {
    const response = await app
      .handle(new Request("http://localhost:3000/health"))
      .then((res) => res.text());

    expect(response).toBe("Healthy!");
  });
});
