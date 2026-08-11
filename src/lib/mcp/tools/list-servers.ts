import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { backendGet, errorResult, textResult } from "../backend";

interface ServerSummary {
  id: string;
  label?: string;
  name?: string;
  version?: string;
  region?: string;
  status?: string;
  lastSeen?: string;
  queryData?: { playercount?: number; maxplayers?: number; name?: string; map?: string };
}

export default defineTool({
  name: "list_servers",
  title: "List Rising World servers",
  description:
    "List the publicly listed Rising World servers tracked by the manager, with name, version, region and last known player counts.",
  inputSchema: {
    search: z
      .string()
      .optional()
      .describe("Optional case-insensitive filter matched against server name or label."),
    limit: z.number().int().optional().describe("Maximum number of servers to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ search, limit }) => {
    try {
      const json = await backendGet<{ servers?: ServerSummary[] }>("/api/storage/server");
      const all = json.servers ?? [];
      const needle = search?.trim().toLowerCase();
      const filtered = needle
        ? all.filter((s) =>
            [s.label, s.name, s.queryData?.name].some((v) => v?.toLowerCase().includes(needle)),
          )
        : all;
      const max = Math.max(1, Math.min(limit ?? 25, 100));
      const servers = filtered.slice(0, max).map((s) => ({
        id: s.id,
        name: s.queryData?.name ?? s.name ?? s.label,
        version: s.version,
        region: s.region,
        status: s.status,
        players: s.queryData?.playercount,
        maxPlayers: s.queryData?.maxplayers,
        map: s.queryData?.map,
        lastSeen: s.lastSeen,
      }));
      return textResult({ total: filtered.length, returned: servers.length, servers });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : "Failed to list servers");
    }
  },
});
