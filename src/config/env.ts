import "dotenv/config";

export interface AppConfig {
  /** MCP HTTP 监听端口 */
  port: number;
  /** 绑定地址，远程部署使用 0.0.0.0 */
  host: string;
  /** Streamable HTTP 路径 */
  mcpPath: string;
  /** 远程 MCP Client 访问本服务时的 Bearer Token */
  mcpAuthToken: string;
  /** 集成中台 base URL，无尾斜杠 */
  integrationBaseUrl: string;
  /** 调用中台时携带的 API Key（中台 ApiKey 过滤器落地后生效） */
  integrationApiKey: string;
  /** 绑定 0.0.0.0 时允许的 Host 头，未配置则不限制 */
  mcpAllowedHosts?: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少必需环境变量: ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  const port = Number.parseInt(process.env.MCP_PORT ?? "3100", 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("MCP_PORT 必须是 1–65535 之间的整数");
  }

  const allowedHosts = process.env.MCP_ALLOWED_HOSTS?.split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  return {
    port,
    host: process.env.MCP_HOST?.trim() || "0.0.0.0",
    mcpPath: process.env.MCP_PATH?.trim() || "/mcp",
    mcpAuthToken: requireEnv("MCP_AUTH_TOKEN"),
    integrationBaseUrl: requireEnv("INTEGRATION_BASE_URL").replace(/\/+$/, ""),
    integrationApiKey: requireEnv("INTEGRATION_API_KEY"),
    ...(allowedHosts && allowedHosts.length > 0
      ? { mcpAllowedHosts: allowedHosts }
      : {}),
  };
}