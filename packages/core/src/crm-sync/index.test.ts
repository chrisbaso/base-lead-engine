import { describe, expect, it } from "vitest";
import demoTenant from "@ble/tenant-demo";
import { enqueueCrmSync } from "./index";

function createSupabaseStub() {
  let inserted: unknown;

  return {
    get inserted() {
      return inserted;
    },
    client: {
      from() {
        return {
          insert(row: unknown) {
            inserted = row;
            return Promise.resolve({ error: null });
          }
        };
      }
    }
  };
}

describe("enqueueCrmSync", () => {
  it("creates a pending CRM sync job for HubSpot tenants", async () => {
    const supabase = createSupabaseStub();

    await enqueueCrmSync({
      supabase: supabase.client as never,
      tenant: demoTenant,
      leadId: "lead-1",
      payload: { email: "lead@example.com" }
    });

    expect(supabase.inserted).toMatchObject({
      provider: "hubspot",
      operation: "syncLead",
      status: "pending"
    });
  });
});
