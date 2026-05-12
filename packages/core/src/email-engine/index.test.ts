import { afterEach, describe, expect, it } from "vitest";
import demoTenant from "@ble/tenant-demo";
import {
  buildUnsubscribeUrl,
  renderEmailHtml,
  scheduleEmailSequence,
  verifyUnsubscribeToken
} from "./index";

function createSupabaseStub() {
  let insertedRows = 0;
  let rowsPayload: unknown[] = [];

  return {
    get insertedRows() {
      return insertedRows;
    },
    get rowsPayload() {
      return rowsPayload;
    },
    client: {
      from() {
        return {
          insert(rows: unknown[]) {
            insertedRows = rows.length;
            rowsPayload = rows;
            return Promise.resolve({ error: null });
          }
        };
      }
    }
  };
}

describe("email-engine", () => {
  afterEach(() => {
    delete process.env.UNSUBSCRIBE_SIGNING_SECRET;
  });

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

  it("renders text templates with lead placeholders and affiliate click links", () => {
    const html = renderEmailHtml(
      "Hi {firstName},\n\nStart with {recommendedSoftware}: {affiliateUrl}",
      demoTenant,
      {
        id: "lead-1",
        email: "lead@example.com",
        score: 0,
        data: {
          firstName: "Sam",
          recommendedPlatformId: "jobber",
          recommendedSoftware: "Jobber"
        }
      },
      "https://demo.test/unsubscribe",
      "https://demo.test"
    );

    expect(html).toContain("Hi Sam");
    expect(html).toContain("Jobber");
    expect(html).toContain("/api/affiliate/jobber");
  });

  it("signs unsubscribe links when a signing secret is configured", () => {
    process.env.UNSUBSCRIBE_SIGNING_SECRET = "test-secret";
    const unsubscribeUrl = buildUnsubscribeUrl("https://demo.test", demoTenant, "Lead@Example.com");
    const url = new URL(unsubscribeUrl);
    const token = url.searchParams.get("token") ?? undefined;

    expect(token).toBeTruthy();
    expect(verifyUnsubscribeToken(demoTenant.identity.tenantId, "lead@example.com", token)).toBe(true);
    expect(verifyUnsubscribeToken(demoTenant.identity.tenantId, "other@example.com", token)).toBe(false);
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

  it("uses a configured email variant when lead data requests it", async () => {
    const supabase = createSupabaseStub();
    const count = await scheduleEmailSequence({
      supabase: supabase.client as never,
      tenant: {
        ...demoTenant,
        email: {
          ...demoTenant.email,
          sequences: [
            {
              id: "recommendation",
              subject: "Control subject",
              delayHours: 0,
              template: "Control body",
              condition: "always",
              variants: [
                {
                  id: "variant-a",
                  subject: "Variant subject",
                  template: "Variant body"
                }
              ]
            }
          ]
        }
      },
      lead: {
        id: "lead-1",
        email: "lead@example.com",
        score: 90,
        data: { emailVariant: "variant-a" }
      }
    });

    expect(count).toBe(1);
    expect(supabase.rowsPayload).toMatchObject([
      {
        subject: "Variant subject",
        template: "Variant body",
        variant_id: "variant-a"
      }
    ]);
  });
});
