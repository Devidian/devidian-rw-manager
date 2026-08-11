import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { backendGet, errorResult, textResult } from "../backend";

interface Bucket {
  serverId: string;
  hourStart: string;
  averagePlayers: number;
  maxPlayers: number;
  availability: number;
}

export default defineTool({
  name: "get_global_statistics",
  title: "Get network statistics",
  description:
    "Get aggregated hourly statistics across all publicly listed Rising World servers tracked by the manager.",
  inputSchema: {
    from: z.string().optional().describe("ISO 8601 start timestamp of the range."),
    to: z.string().optional().describe("ISO 8601 end timestamp of the range."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ from, to }) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const query = params.toString();
      const payload = await backendGet<{ buckets?: Bucket[]; players?: Array<{ uid: string; name?: string }> }>(
        `/api/storage/statistics${query ? `?${query}` : ""}`,
      );
      const buckets = payload.buckets ?? [];
      return textResult({
        bucketCount: buckets.length,
        trackedPlayers: (payload.players ?? []).length,
        buckets,
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : "Failed to load statistics");
    }
  },
});
