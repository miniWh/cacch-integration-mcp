import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IntegrationClient } from "../integration/client.js";
import { registerCrmQueryEmployeeByIdTool } from "./tools/crmQueryEmployeeById.js";

export function createMcpServer(integration: IntegrationClient): McpServer {
  const server = new McpServer(
    {
      name: "cacch-integration-mcp-crm",
      version: "1.0.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  registerCrmQueryEmployeeByIdTool(server, integration);
  return server;
}