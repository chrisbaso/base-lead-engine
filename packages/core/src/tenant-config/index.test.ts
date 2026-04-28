import { describe, expect, it } from "vitest";
import { getTenantConfig, listTenantConfigs, resolveTenantSlug } from "./index";

describe("tenant-config", () => {
  it("lists registered tenants", () => {
    expect(listTenantConfigs().map((tenant) => tenant.identity.slug)).toEqual(["demo", "retirement"]);
    expect(getTenantConfig("demo").identity.slug).toBe("demo");
    expect(getTenantConfig("retirement").identity.slug).toBe("retirement");
  });

  it("resolves hostnames with ports", () => {
    expect(resolveTenantSlug("localhost:3000")).toBe("demo");
  });
});
