import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { backendGet, errorResult, textResult } from "../backend";

interface ServerRecord {
  id: string;
  label?: string;
  name?: string;
  [key: string]: unknown;
}

export default defineTool({
  name: "get_server",
  title: "Get server details",
  description:
    "Get the stored details of one publicly listed Rising World server by its manager id, or by a name/label match.",
  inputSchema: {
    server: z.string().describe("Server id, or part of the server name/label."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ server }) => {
    try {
      const json = await backendGet<{ servers?: ServerRecord[] }>("/api/storage/server");
      const all = json.servers ?? [];
      const needle = server.trim().toLowerCase();
      const match =
        all.find((s) => s.id?.toLowerCase() === needle) ??
        all.find((s) =>
          [s.label, s.name, (s.queryData as { name?: string } | undefined)?.name].some((v) =>
            v?.toLowerCase().includes(needle),
          ),
        );
      if (!match) return errorResult(`No public server found matching "${server}".`);
      return textResult(match);
    } catch (error) {
      return errorResult(error instanceof Error ? error.message : "Failed to load server");
    }
  },
});
