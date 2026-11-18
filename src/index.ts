import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { loadConfig } from "./config/env.js";
import { IntegrationClient } from "./integration/client.js";
import { createMcpServer } from "./mcp/server.js";
import { mcpBearerAuth } from "./http/mcpAuth.js";

const config = loadConfig();
const integration = new IntegrationClient(config);

const app = createMcpExpressApp({
  host: config.host,
  allowedHosts: config.mcpAllowedHosts,
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "cacch-integration-mcp-crm" });
});

app.use(config.mcpPath, mcpBearerAuth(config.mcpAuthToken));

app.post(config.mcpPath, async (req, res) => {
  const server = createMcpServer(integration);
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error(
      `【MCP】处理请求失败 traceId=${req.header("X-Trace-Id") ?? randomUUID()}`,
      error,
    );
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get(config.mcpPath, (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.delete(config.mcpPath, (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.listen(config.port, config.host, () => {
  console.log(
    `【MCP】CRM Streamable HTTP 已启动 http://${config.host}:${config.port}${config.mcpPath}`,
  );
});

process.on("SIGINT", () => {
  console.log("【MCP】正在退出…");
  process.exit(0);
});