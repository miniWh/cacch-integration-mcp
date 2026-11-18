import { IntegrationHttpError } from "../integration/client.js";
import type { CrmEmployeeVO, PlatformResult } from "../integration/types.js";
import {
  envelopeFail,
  envelopeOk,
  envelopeToJsonText,
  type McpToolEnvelope,
} from "./envelope.js";

const PLATFORM_SUCCESS = 0;

export function envelopeFromEmployeePlatform(
  platform: PlatformResult<CrmEmployeeVO | null>,
  traceId: string,
): McpToolEnvelope {
  if (platform.code !== PLATFORM_SUCCESS) {
    return envelopeFail(
      `PLATFORM_${platform.code}`,
      platform.message || "集成中台返回失败",
    );
  }
  if (platform.data === null) {
    return envelopeOk("查无匹配员工", null);
  }
  return envelopeOk("查询成功", { ...platform.data, trace_id: traceId });
}

export function toolResultFromEnvelope(body: McpToolEnvelope) {
  return {
    content: [{ type: "text" as const, text: envelopeToJsonText(body) }],
    ...(body.success ? {} : { isError: true as const }),
  };
}

export function integrationErrorEnvelope(
  err: unknown,
  traceId: string,
): McpToolEnvelope {
  const trace = err instanceof IntegrationHttpError ? err.traceId : traceId;
  const message =
    err instanceof Error ? err.message : "调用集成中台时发生未知错误";
  return envelopeFail("INTEGRATION_ERROR", message, { trace_id: trace });
}