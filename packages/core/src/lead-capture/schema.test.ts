import { describe, expect, it } from "vitest";
import demoTenant from "@ble/tenant-demo";
import { validateLeadFields } from "./schema";

describe("validateLeadFields", () => {
  it("validates demo quiz fields", () => {
    const result = validateLeadFields(demoTenant, {
      launch_goal: "Quiz funnel",
      monthly_leads: "50",
      email: "person@example.com",
      company: "Acme"
    });

    expect(result.monthly_leads).toBe(50);
  });

  it("rejects invalid email values", () => {
    expect(() =>
      validateLeadFields(demoTenant, {
        launch_goal: "Quiz funnel",
        monthly_leads: "50",
        email: "not-email",
        company: "Acme"
      })
    ).toThrow();
  });
});
