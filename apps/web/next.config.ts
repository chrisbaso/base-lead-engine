import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@ble/core",
    "@ble/tenant-schema",
    "@ble/ui",
    "@ble/tenant-demo",
    "@ble/tenant-hvac-ops-pro",
    "@ble/tenant-retire-ready-mn",
    "@ble/tenant-retirement",
    "@ble/tenant-smart-retirement-mn"
  ]
};

export default nextConfig;
