import * as z from "zod";
import type { CrmOpenApiResponse, PlatformResult } from "./types.js";

const crmOpenApiResponseSchema = z
  .object({
    return_code: z.string().optional(),
    return_msg: z.string().optional(),
    msg_id: z.string().optional(),
    response_data: z.unknown().optional(),
  })
  .passthrough();

const platformResultSchema: z.ZodType<PlatformResult<CrmOpenApiResponse>> =
  z.object({
    code: z.number(),
    message: z.string(),
    data: z.union([crmOpenApiResponseSchema, z.null()]),
  });

/** 将中台 JSON 窄化为 PlatformResult，结构不符时抛出含 issues 的 Error */
export function parsePlatformResult(
  body: unknown,
): PlatformResult<CrmOpenApiResponse> {
  const result = platformResultSchema.safeParse(body);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(`中台返回结构不符合约定: ${detail}`);
  }
  return result.data;
}