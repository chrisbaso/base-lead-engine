import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantConfig } from "@ble/tenant-schema";
import { retryFetch } from "../retry";
import { listTenantConfigs } from "../tenant-config";

export type CrmLead = {
  id: string;
  email: string | null;
  phone: string | null;
  score: number;
  data: Record<string, unknown>;
};

export type CRMAdapter = {
  createContact(lead: CrmLead): Promise<{ id: string }>;
  updateContact(contactId: string, lead: CrmLead): Promise<void>;
  createDeal(contactId: string, lead: CrmLead): Promise<{ id: string }>;
  addNote(contactId: string, note: string): Promise<void>;
  addToList(contactId: string, listId: string): Promise<void>;
};

export type CrmSyncRow = {
  id: string;
  tenant_id: string;
  lead_id: string;
  provider: string;
  operation: string;
  attempts: number;
  payload: Record<string, unknown>;
};

export async function enqueueCrmSync(options: {
  supabase: SupabaseClient;
  tenant: TenantConfig;
  leadId: string;
  payload: Record<string, unknown>;
}) {
  if (options.tenant.crm.provider === "none") {
    return;
  }

  const { error } = await options.supabase.from("crm_sync_log").insert({
    tenant_id: options.tenant.identity.tenantId,
    lead_id: options.leadId,
    provider: options.tenant.crm.provider,
    operation: "syncLead",
    status: "pending",
    attempts: 0,
    payload: options.payload
  });

  if (error) {
    throw new Error(`CRM sync enqueue failed: ${error.message}`);
  }
}

export async function runDueCrmSync(options: {
  supabase: SupabaseClient;
  now?: Date;
  batchSize?: number;
}): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = options.now ?? new Date();
  const { data, error } = await options.supabase
    .from("crm_sync_log")
    .select("id, tenant_id, lead_id, provider, operation, attempts, payload")
    .in("status", ["pending", "retry"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now.toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(options.batchSize ?? 50)
    .overrideTypes<CrmSyncRow[], { merge: false }>();

  if (error) {
    throw new Error(`CRM sync query failed: ${error.message}`);
  }

  let succeeded = 0;
  let failed = 0;

  for (const row of data) {
    const tenant = listTenantConfigs().find((config) => config.identity.tenantId === row.tenant_id);
    if (!tenant) {
      failed += 1;
      await markCrmSync(options.supabase, row, "dead_letter", "Unknown tenant for CRM sync");
      continue;
    }

    try {
      const lead = await getCrmLead(options.supabase, row.lead_id);
      const adapter = createCrmAdapter(tenant);
      const contact = await adapter.createContact(lead);
      await adapter.addNote(contact.id, `Lead score: ${String(lead.score)}`);

      if (tenant.crm.pipelineId && tenant.crm.defaultStage) {
        await adapter.createDeal(contact.id, lead);
      }

      if (tenant.crm.listId) {
        await adapter.addToList(contact.id, tenant.crm.listId);
      }

      succeeded += 1;
      await options.supabase
        .from("crm_sync_log")
        .update({ status: "succeeded", attempts: row.attempts + 1, error: null })
        .eq("id", row.id);
    } catch (errorValue) {
      failed += 1;
      await markCrmSync(options.supabase, row, nextCrmStatus(row.attempts), errorMessage(errorValue));
    }
  }

  return {
    processed: data.length,
    succeeded,
    failed
  };
}

function createCrmAdapter(tenant: TenantConfig): CRMAdapter {
  if (tenant.crm.provider === "hubspot") {
    const token = tenant.crm.apiKeyEnv ? process.env[tenant.crm.apiKeyEnv] : undefined;
    return new HubSpotAdapter(tenant, token);
  }

  return new StubCrmAdapter(tenant.crm.provider);
}

async function getCrmLead(supabase: SupabaseClient, leadId: string): Promise<CrmLead> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, email, phone, score, data")
    .eq("id", leadId)
    .single<{ id: string; email: string | null; phone: string | null; score: number; data: Record<string, unknown> }>();

  if (error) {
    throw new Error(`CRM lead query failed: ${error.message}`);
  }

  return data;
}

function nextCrmStatus(attempts: number): "retry" | "dead_letter" {
  return attempts >= 4 ? "dead_letter" : "retry";
}

async function markCrmSync(supabase: SupabaseClient, row: CrmSyncRow, status: "retry" | "dead_letter", error: string) {
  const retryDelayMinutes = Math.min(60, 2 ** row.attempts * 5);
  const nextRetryAt = status === "retry" ? new Date(Date.now() + retryDelayMinutes * 60 * 1000).toISOString() : null;

  await supabase
    .from("crm_sync_log")
    .update({ status, attempts: row.attempts + 1, next_retry_at: nextRetryAt, error })
    .eq("id", row.id);
}

function errorMessage(errorValue: unknown): string {
  return errorValue instanceof Error ? errorValue.message : "Unknown CRM sync error";
}

class StubCrmAdapter implements CRMAdapter {
  constructor(private readonly provider: string) {}

  createContact(): Promise<{ id: string }> {
    return Promise.reject(new Error(`${this.provider} CRM adapter is not implemented`));
  }

  updateContact(): Promise<void> {
    return Promise.reject(new Error(`${this.provider} CRM adapter is not implemented`));
  }

  createDeal(): Promise<{ id: string }> {
    return Promise.reject(new Error(`${this.provider} CRM adapter is not implemented`));
  }

  addNote(): Promise<void> {
    return Promise.reject(new Error(`${this.provider} CRM adapter is not implemented`));
  }

  addToList(): Promise<void> {
    return Promise.reject(new Error(`${this.provider} CRM adapter is not implemented`));
  }
}

class HubSpotAdapter implements CRMAdapter {
  constructor(
    private readonly tenant: TenantConfig,
    private readonly token: string | undefined
  ) {}

  async createContact(lead: CrmLead): Promise<{ id: string }> {
    const properties = this.mapLeadProperties(lead);
    const response = await this.request<{ id: string }>("/crm/v3/objects/contacts", {
      method: "POST",
      body: JSON.stringify({ properties })
    });
    return { id: response.id };
  }

  async updateContact(contactId: string, lead: CrmLead): Promise<void> {
    await this.request(`/crm/v3/objects/contacts/${contactId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties: this.mapLeadProperties(lead) })
    });
  }

  async createDeal(contactId: string, lead: CrmLead): Promise<{ id: string }> {
    const response = await this.request<{ id: string }>("/crm/v3/objects/deals", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          dealname: `Lead: ${lead.email ?? lead.id}`,
          pipeline: this.tenant.crm.pipelineId,
          dealstage: this.tenant.crm.defaultStage
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }]
          }
        ]
      })
    });
    return { id: response.id };
  }

  async addNote(contactId: string, note: string): Promise<void> {
    await this.request("/crm/v3/objects/notes", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          hs_note_body: note,
          hs_timestamp: new Date().toISOString()
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }]
          }
        ]
      })
    });
  }

  async addToList(contactId: string, listId: string): Promise<void> {
    await this.request(`/crm/v3/lists/${listId}/memberships/add`, {
      method: "PUT",
      body: JSON.stringify({ recordIds: [contactId] })
    });
  }

  private mapLeadProperties(lead: CrmLead): Record<string, string> {
    const properties: Record<string, string> = {};

    for (const [field, hubspotProperty] of Object.entries(this.tenant.crm.propertyMappings)) {
      const value = field === "email" ? lead.email : field === "phone" ? lead.phone : lead.data[field];
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        properties[hubspotProperty] = String(value);
      }
    }

    return properties;
  }

  private async request<T = unknown>(path: string, init: RequestInit): Promise<T> {
    if (!this.token) {
      throw new Error(`${this.tenant.crm.apiKeyEnv ?? "HubSpot token"} is not configured`);
    }

    const response = await retryFetch(`https://api.hubapi.com${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json"
      }
    });

    if (response.status === 429 || response.status >= 500) {
      throw new Error(`HubSpot retryable error ${String(response.status)}`);
    }

    if (!response.ok) {
      throw new Error(`HubSpot permanent error ${String(response.status)}`);
    }

    return (await response.json()) as T;
  }
}
