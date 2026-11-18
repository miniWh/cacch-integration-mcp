import * as z from "zod";
import type { CrmEmployeeVO, PlatformResult } from "./types.js";

const crmEmployeeVoSchema = z.object({
  id: z.string(),
  empId: z.string().nullish(),
  empCode: z.string().nullish(),
  empName: z.string().nullish(),
  mobile: z.string().nullish(),
  status: z.string().nullish(),
});

const platformEmployeeResultSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.union([crmEmployeeVoSchema, z.null()]),
});

function normalizeEmployeeVo(
  raw: z.infer<typeof crmEmployeeVoSchema>,
): CrmEmployeeVO {
  return {
    id: raw.id,
    empId: raw.empId ?? null,
    empCode: raw.empCode ?? null,
    empName: raw.empName ?? null,
    mobile: raw.mobile ?? null,
    status: raw.status ?? null,
  };
}

/** 将中台 JSON 窄化为员工查询 Result，结构不符时抛出 Error */
export function parsePlatformEmployeeResult(
  body: unknown,
): PlatformResult<CrmEmployeeVO | null> {
  const result = platformEmployeeResultSchema.safeParse(body);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(`中台返回结构不符合约定: ${detail}`);
  }
  const { code, message, data } = result.data;
  return {
    code,
    message,
    data: data === null ? null : normalizeEmployeeVo(data),
  };
}