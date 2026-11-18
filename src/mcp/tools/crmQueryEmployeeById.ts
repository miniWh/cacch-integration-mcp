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

const TOOL_NAME = "crm_query_employee_by_id";

const TOOL_DESCRIPTION = [
  "按勤策员工 ID 查询员工帐号（主要取 empCode），用于 OA 人员映射、核对员工是否存在。",
  "适用：已知勤策 employeeId（如订单 owner.id），需要 empCode 或基础员工信息。",
  "不适用：仅有 empCode/empId 而无勤策 id 时请用 crm_query_employee；批量、订单/客户等其他 CRM 数据。",
].join("\n");

const employeeIdSchema = z
  .string({ message: "employee_id 必须为字符串" })
  .min(1, "employee_id 不能为空")
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: "employee_id 不能为空" });

export function registerCrmQueryEmployeeByIdTool(
  server: McpServer,
  integration: IntegrationClient,
): void {
  server.registerTool(
    TOOL_NAME,
    {
      description: TOOL_DESCRIPTION,
      inputSchema: {
        employee_id: z
          .unknown()
          .optional()
          .describe("勤策员工 ID（与中台 CrmEmployeeByIdRequest.employeeId 一致）"),
      },
    },
    async ({ employee_id }) => {
      const argCheck = employeeIdSchema.safeParse(employee_id);
      if (!argCheck.success) {
        const message =
          argCheck.error.issues[0]?.message ?? "employee_id 参数无效";
        const body = envelopeFail("INVALID_ARGUMENT", message);
        return {
          content: [{ type: "text", text: envelopeToJsonText(body) }],
          isError: true,
        };
      }

      const employeeId = argCheck.data;
      const traceId = randomUUID();

      try {
        const platform = await integration.queryEmployeeById(employeeId, traceId);
        return toolResultFromEnvelope(
          envelopeFromEmployeePlatform(platform, traceId),
        );
      } catch (err) {
        return toolResultFromEnvelope(integrationErrorEnvelope(err, traceId));
      }
    },
  );
}