import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { backendGet, errorResult, textResult } from "../backend";

interface LiveStatus {
  status?: string;
  lastChecked?: string;
  errorMessage?: string;
  queryData?: Record<string, unknown>;
  infoData?: Record<string, unknown>;
  onlinePlayers?: Array<{ name?: string; uid?: string; ping?: number; platform?: string }>;
}

export default defineTool({
  name: "get_server_status",
  title: "Get live server status",
  description:
    "Get the live status of a publicly listed Rising World server: online/offline, player count and the current online player list.",
  inputSchema: {
    serverId: z.string().describe("Manager id of the server (from list_servers)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
  handler: async ({ serverId }) => {
    try {
      const live = await backendGet<LiveStatus>(
        `/api/storage/server/${encodeURIComponent(serverId)}/live`,
      );
      return textResult({
        status: live.status,
        lastChecked: live.lastChecked,
        errorMessage: live.errorMessage,
        name: (live.queryData as { name?: string } | undefined)?.name,
        players: (live.queryData as { playercount?: number } | undefined)?.playercount,
        maxPlayers: (live.queryData as { maxplayers?: number } | undefined)?.maxplayers,
        onlinePlayers: (live.onlinePlayers ?? []).map((p) => ({
          name: p.name,
          platform: p.platform,
          ping: p.ping,
        })),
        info: live.infoData,
      });
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : "Failed to load live status");
    }
  },
});
