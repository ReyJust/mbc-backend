// test/index.test.ts
import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../app";

const api = treaty(app);

describe("General endpoints", () => {
  it("Be Healthy!", async () => {
    const res = await api.health.get();

    expect(res.data).toBe("Healthy!");
  });
});
