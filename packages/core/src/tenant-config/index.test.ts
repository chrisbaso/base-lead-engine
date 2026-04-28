import { describe, expect, it } from "vitest";
import { getTenantConfig, listTenantConfigs, resolveTenantSlug } from "./index";

describe("tenant-config", () => {
  it("lists the demo tenant", () => {
    expect(listTenantConfigs()).toHaveLength(1);
    expect(getTenantConfig("demo").identity.slug).toBe("demo");
  });

  it("resolves hostnames with ports", () => {
    expect(resolveTenantSlug("localhost:3000")).toBe("demo");
  });
});
