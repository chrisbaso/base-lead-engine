import { defineTenantConfig } from "@ble/tenant-schema";

export default defineTenantConfig({
  identity: {
    tenantId: "11111111-1111-4111-8111-111111111111",
    slug: "demo",
    name: "Demo Lead Engine",
    primaryDomain: "demo.localhost"
  },
  branding: {
    logoText: "Demo Lead Engine",
    primaryColor: "#14b8a6",
    accentColor: "#f59e0b"
  },
  domains: ["localhost", "demo.localhost"],
  tracking: {},
  leadCapture: {
    type: "singleForm",
    headline: "Launch a lead funnel without new code",
    subheadline: "This demo tenant proves hostname-based config and schema rendering are wired.",
    steps: [
      {
        id: "contact",
        title: "Tell us where to send the playbook",
        fields: [
          { id: "email", label: "Email", type: "email", required: true },
          { id: "company", label: "Company", type: "text", required: true }
        ]
      }
    ]
  },
  email: {
    fromAddress: "demo@example.com",
    sequences: []
  },
  scoring: {
    rules: [],
    qualifiedThreshold: 70
  },
  crm: {
    provider: "none",
    propertyMappings: {}
  },
  notifications: {
    ownerEmail: "owner@example.com",
    highScoreThreshold: 70
  }
});
