import { randomUUID } from "node:crypto";
import * as z from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IntegrationClient } from "../../integration/client.js";
import {
  envelopeFail,
  envelopeToJsonText,
} from "../envelope.js";
import {
  envelopeFromEmployeePlatform,
  integrationErrorEnvelope,
  toolResultFromEnvelope,
} from "../crmEmployeePlatform.js";

const TOOL_NAME = "crm_query_employee";

const TOOL_DESCRIPTION = [
  "按勤策 id、第三方 empId 或登录帐号 empCode 之一或组合查询员工信息（返回首条）。",
  "适用：已知 empCode 做 OA 映射、或仅有 empId/empCode 需反查员工。",
  "不适用：仅有勤策 employeeId 且确定唯一时，优先 crm_query_employee_by_id；批量列表、非员工类 CRM 数据。",
].join("\n");

const optionalQueryField = z
  .string()
  .optional()
  .transform((v) => (v === undefined ? undefined : v.trim()))
  .transform((v) => (v === "" ? undefined : v));

const employeeQuerySchema = z
  .object({
    id: optionalQueryField,
    emp_id: optionalQueryField,
    emp_code: optionalQueryField,
  })
  .refine(
    (data) =>
      Boolean(data.id?.length) ||
      Boolean(data.emp_id?.length) ||
      Boolean(data.emp_code?.length),
    { message: "id、emp_id、emp_code 至少一项非空" },
  );

export function registerCrmQueryEmployeeTool(
  server: McpServer,
  integration: IntegrationClient,
): void {
  server.registerTool(
    TOOL_NAME,
    {
      description: TOOL_DESCRIPTION,
      inputSchema: {
        id: z
          .unknown()
          .optional()
          .describe("勤策员工唯一标识（与中台 CrmEmployeeQueryApiRequest.id 一致）"),
        emp_id: z
          .unknown()
          .optional()
          .describe("第三方员工 ID（与中台 empId 一致）"),
        emp_code: z
          .unknown()
          .optional()
          .describe("员工登录帐号 empCode（与中台 empCode 一致）"),
      },
    },
    async (args) => {
      const coerced = {
        id: typeof args.id === "string" ? args.id : undefined,
        emp_id: typeof args.emp_id === "string" ? args.emp_id : undefined,
        emp_code: typeof args.emp_code === "string" ? args.emp_code : undefined,
      };
      const argCheck = employeeQuerySchema.safeParse(coerced);
      if (!argCheck.success) {
        const message =
          argCheck.error.issues[0]?.message ?? "查询条件无效";
        const body = envelopeFail("INVALID_ARGUMENT", message);
        return {
          content: [{ type: "text", text: envelopeToJsonText(body) }],
          isError: true,
        };
      }

      const { id, emp_id, emp_code } = argCheck.data;
      const traceId = randomUUID();

      try {
        const platform = await integration.queryEmployee(
          {
            ...(id ? { id } : {}),
            ...(emp_id ? { empId: emp_id } : {}),
            ...(emp_code ? { empCode: emp_code } : {}),
          },
          traceId,
        );
        return toolResultFromEnvelope(
          envelopeFromEmployeePlatform(platform, traceId),
        );
      } catch (err) {
        return toolResultFromEnvelope(integrationErrorEnvelope(err, traceId));
      }
    },
  );
}