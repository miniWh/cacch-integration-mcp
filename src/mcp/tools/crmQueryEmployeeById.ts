import { randomUUID } from "node:crypto";
import * as z from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IntegrationClient } from "../../integration/client.js";
import { IntegrationHttpError } from "../../integration/client.js";
import {
  isCrmBusinessSuccess,
  toEmployeeSummary,
} from "../../integration/employeeParse.js";
import {
  envelopeFail,
  envelopeOk,
  envelopeToJsonText,
} from "../envelope.js";

const PLATFORM_SUCCESS = 0;

const TOOL_NAME = "crm_query_employee_by_id";

const TOOL_DESCRIPTION = [
  "按勤策员工 ID 查询员工帐号（主要取 emp_code），用于 OA 人员映射、核对员工是否存在。",
  "适用：已知勤策 employeeId，需要 emp_code 或基础员工信息。",
  "不适用：批量员工列表、按姓名模糊查询、订单/客户等其他 CRM 数据（本期未提供对应 Tool）。",
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

        if (platform.code !== PLATFORM_SUCCESS) {
          const body = envelopeFail(
            `PLATFORM_${platform.code}`,
            platform.message || "集成中台返回失败",
          );
          return {
            content: [{ type: "text", text: envelopeToJsonText(body) }],
            isError: true,
          };
        }

        const crm = platform.data;
        if (!crm) {
          const body = envelopeFail(
            "PLATFORM_EMPTY",
            "中台成功但未返回勤策数据",
          );
          return {
            content: [{ type: "text", text: envelopeToJsonText(body) }],
            isError: true,
          };
        }

        if (!isCrmBusinessSuccess(crm.return_code)) {
          const body = envelopeFail(
            "CRM_BUSINESS_ERROR",
            crm.return_msg?.trim() || "勤策接口业务失败",
            { return_code: crm.return_code ?? null, trace_id: traceId },
          );
          return {
            content: [{ type: "text", text: envelopeToJsonText(body) }],
            isError: true,
          };
        }

        const summary = toEmployeeSummary(employeeId, crm.response_data);
        if (!summary) {
          const body = envelopeFail(
            "CRM_NO_EMPLOYEE",
            "勤策未返回可解析的员工记录",
            { trace_id: traceId, msg_id: crm.msg_id ?? null },
          );
          return {
            content: [{ type: "text", text: envelopeToJsonText(body) }],
            isError: true,
          };
        }

        const body = envelopeOk("查询成功", {
          ...summary,
          trace_id: traceId,
          msg_id: crm.msg_id ?? null,
        });
        return {
          content: [{ type: "text", text: envelopeToJsonText(body) }],
        };
      } catch (err) {
        const trace =
          err instanceof IntegrationHttpError ? err.traceId : traceId;
        const message =
          err instanceof Error ? err.message : "调用集成中台时发生未知错误";
        const body = envelopeFail("INTEGRATION_ERROR", message, {
          trace_id: trace,
        });
        return {
          content: [{ type: "text", text: envelopeToJsonText(body) }],
          isError: true,
        };
      }
    },
  );
}