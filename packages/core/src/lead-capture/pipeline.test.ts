import { afterEach, describe, expect, it, vi } from "vitest";
import demoTenant from "@ble/tenant-demo";
import { submitLead } from "./pipeline";

afterEach(() => {
  vi.unstubAllGlobals();
});

function createSupabaseStub() {
  const insertedTables: string[] = [];

  return {
    insertedTables,
    client: {
      from(table: string) {
        insertedTables.push(table);

        if (table === "leads") {
          return {
            upsert() {
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({ data: { id: "lead-1" }, error: null });
                    }
                  };
                }
              };
            }
          };
        }

        return {
          insert() {
            return Promise.resolve({ error: null });
          }
        };
      }
    }
  };
}

describe("submitLead", () => {
  it("writes a lead, records an event, and returns the generated event id", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "event-1" });
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(null, { status: 204 })));
    const supabase = createSupabaseStub();

    const result = await submitLead({
      supabase: supabase.client as never,
      tenant: demoTenant,
      submission: {
        tenantId: demoTenant.identity.tenantId,
        fields: {
          launch_goal: "Quiz funnel",
          monthly_leads: 50,
          email: "lead@example.com",
          company: "Acme"
        },
        isPartial: false
      }
    });

    expect(result).toEqual({ leadId: "lead-1", eventId: "event-1", isPartial: false });
    expect(supabase.insertedTables).toEqual(["leads", "lead_events"]);
  });
});
