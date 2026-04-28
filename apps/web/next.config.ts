import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ble/core", "@ble/tenant-schema", "@ble/ui", "@ble/tenant-demo"]
};

export default nextConfig;
