import demoConfig from "@ble/tenant-demo";
import { tenantConfigSchema, type TenantConfig } from "@ble/tenant-schema";

const tenantConfigs: Record<string, TenantConfig> = {
  demo: demoConfig
};

const domainToSlug = new Map<string, string>(
  Object.values(tenantConfigs).flatMap((config) =>
    config.domains.map((domain) => [domain, config.identity.slug])
  )
);

const cache = new Map<string, TenantConfig>();

export function listTenantConfigs(): TenantConfig[] {
  return Object.values(tenantConfigs);
}

export function resolveTenantSlug(hostname: string, fallback = "demo"): string {
  const normalized = hostname.split(":")[0]?.toLowerCase() ?? fallback;
  return domainToSlug.get(normalized) ?? fallback;
}

export function getTenantConfig(slug: string): TenantConfig {
  const cached = cache.get(slug);
  if (cached) {
    return cached;
  }

  const config = tenantConfigs[slug as TenantSlug];
  if (!config) {
    throw new Error(`Unknown tenant config: ${slug}`);
  }

  const parsed = tenantConfigSchema.parse(config);
  cache.set(slug, parsed);
  return parsed;
}
