import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ble/core", "@ble/tenant-schema", "@ble/tenant-demo"]
};

export default nextConfig;
