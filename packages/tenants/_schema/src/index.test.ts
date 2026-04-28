import { describe, expect, it } from "vitest";
import { tenantConfigSchema } from "./index";

describe("tenantConfigSchema", () => {
  it("rejects invalid tenant slugs", () => {
    const result = tenantConfigSchema.shape.identity.safeParse({
      tenantId: "11111111-1111-4111-8111-111111111111",
      slug: "Bad Slug",
      name: "Bad",
      primaryDomain: "example.test"
    });

    expect(result.success).toBe(false);
  });
});
