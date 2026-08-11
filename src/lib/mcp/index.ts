import { defineMcp } from "@lovable.dev/mcp-js";
import listServers from "./tools/list-servers";
import getServer from "./tools/get-server";
import getServerStatus from "./tools/get-server-status";
import getServerStatistics from "./tools/get-server-statistics";
import getGlobalStatistics from "./tools/get-global-statistics";

export default defineMcp({
  name: "rising-world-manager",
  title: "Rising World Manager",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Rising World Manager. Use `list_servers` to discover publicly listed Rising World servers, `get_server` for stored details, `get_server_status` for live status and online players, and the statistics tools for hourly player-count and availability history. All data is public; no user-specific data is exposed.",
  tools: [listServers, getServer, getServerStatus, getServerStatistics, getGlobalStatistics],
});
