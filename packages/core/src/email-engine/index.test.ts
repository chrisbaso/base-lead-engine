import { describe, expect, it } from "vitest";
import demoTenant from "@ble/tenant-demo";
import { buildUnsubscribeUrl, renderEmailHtml, scheduleEmailSequence } from "./index";

function createSupabaseStub() {
  let insertedRows = 0;

  return {
    get insertedRows() {
      return insertedRows;
    },
    client: {
      from() {
        return {
          insert(rows: unknown[]) {
            insertedRows = rows.length;
            return Promise.resolve({ error: null });
          }
        };
      }
    }
  };
}

describe("email-engine", () => {
  it("renders email html with unsubscribe link", () => {
    const unsubscribeUrl = buildUnsubscribeUrl("https://demo.test", demoTenant, "lead@example.com");
    const html = renderEmailHtml(
      "demoWelcome",
      demoTenant,
      { id: "lead-1", email: "lead@example.com", score: 0, data: { company: "Acme" } },
      unsubscribeUrl
    );

    expect(html).toContain("Acme");
    expect(html).toContain("Unsubscribe");
  });

  it("schedules the demo five-email sequence", async () => {
    const supabase = createSupabaseStub();
    const count = await scheduleEmailSequence({
      supabase: supabase.client as never,
      tenant: demoTenant,
      lead: { id: "lead-1", email: "lead@example.com", score: 90, data: {} }
    });

    expect(count).toBe(5);
    expect(supabase.insertedRows).toBe(5);
  });
});
