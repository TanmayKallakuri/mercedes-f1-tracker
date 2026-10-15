import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  // The tracker is a single static page in public/; the eve agent is mounted at /eve/v1/* by withEve.
  async rewrites() {
    return [{ source: "/", destination: "/tracker.html" }];
  },
};

export default withEve(nextConfig);
