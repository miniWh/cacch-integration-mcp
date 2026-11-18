/** MCP Tool 统一返回结构，便于 Agent 解析且不塞满上下文 */
export interface McpToolEnvelope<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
}

export function envelopeOk<T>(message: string, data: T): McpToolEnvelope<T> {
  return { success: true, code: "OK", message, data };
}

export function envelopeFail(
  code: string,
  message: string,
  data: unknown = null,
): McpToolEnvelope {
  return { success: false, code, message, data };
}

export function envelopeToJsonText(envelope: McpToolEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}