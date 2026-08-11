import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { backendGet, errorResult, textResult } from "../backend";

interface Bucket {
  hourStart: string;
  averagePlayers: number;
  maxPlayers: number;
  availability: number;
  sampleCount: number;
}

function range(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default defineTool({
  name: "get_server_statistics",
  title: "Get server statistics",
  description:
    "Get hourly player-count and availability statistics for one publicly listed Rising World server.",
  inputSchema: {
    serverId: z.string().describe("Manager id of the server (from list_servers)."),
    from: z.string().optional().describe("ISO 8601 start timestamp of the range."),
    to: z.string().optional().describe("ISO 8601 end timestamp of the range."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ serverId, from, to }) => {
    try {
      const payload = await backendGet<{ buckets?: Bucket[] }>(
        `/api/storage/server/${encodeURIComponent(serverId)}/statistics${range(from, to)}`,
      );
      const buckets = payload.buckets ?? [];
      return textResult({
        serverId,
        bucketCount: buckets.length,
        buckets: buckets.map((b) => ({
          hourStart: b.hourStart,
          averagePlayers: b.averagePlayers,
          maxPlayers: b.maxPlayers,
          availability: b.availability,
        })),
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : "Failed to load statistics");
    }
  },
});
