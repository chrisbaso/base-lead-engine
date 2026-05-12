import { afterEach, describe, expect, it, vi } from "vitest";
import demoTenant from "@ble/tenant-demo";
import retireReadyMnTenant from "@ble/tenant-retire-ready-mn";
import { submitLead } from "./pipeline";

afterEach(() => {
  vi.unstubAllGlobals();
});

function createSupabaseStub() {
  const insertedTables: string[] = [];
  const upserts: Array<Record<string, unknown>> = [];

  return {
    insertedTables,
    upserts,
    client: {
      from(table: string) {
        insertedTables.push(table);

        if (table === "leads") {
          return {
            upsert(payload: Record<string, unknown>) {
              upserts.push(payload);
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
    expect(supabase.insertedTables).toEqual(["leads", "lead_events", "events", "email_sends", "crm_sync_log"]);
  });

  it("projects RetireReadyMN score fields into lead columns for admin sorting and handoff", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "event-1" });
    vi.stubGlobal("fetch", () => Promise.resolve(new Response(null, { status: 204 })));
    const supabase = createSupabaseStub();

    await submitLead({
      supabase: supabase.client as never,
      tenant: retireReadyMnTenant,
      submission: {
        tenantId: retireReadyMnTenant.identity.tenantId,
        fields: {
          firstName: "Ada",
          lastName: "North",
          email: "ada@example.com",
          phone: "6125550100",
          currentAge: 60,
          currentSavingsBucket: "1000000-2000000",
          currentSavings: 1500000,
          targetRetirementAge: 67,
          monthlySocialSecurity: 3200,
          desiredMonthlyIncome: 7000,
          retirementScore: 88,
          scoreBand: "Green",
          primaryConcern: "taxes",
          tcpaConsent: true
        },
        isPartial: false,
        source: {
          utmSource: "meta",
          utmCampaign: "fall-checkup"
        }
      }
    });

    expect(supabase.upserts[0]).toMatchObject({
      first_name: "Ada",
      last_name: "North",
      age: 60,
      current_savings: 1500000,
      target_retirement_age: 67,
      monthly_social_security: 3200,
      desired_monthly_income: 7000,
      retirement_score: 88,
      score_band: "Green",
      utm_source: "meta",
      utm_campaign: "fall-checkup"
    });
  });
});
