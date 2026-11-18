import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function mcpBearerAuth(expectedToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({
        error: "unauthorized",
        message: "缺少或无效的 Authorization Bearer Token",
      });
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    const valid =
      token.length === expectedToken.length &&
      timingSafeEqualUtf8(token, expectedToken);

    if (!valid) {
      res.status(401).json({
        error: "unauthorized",
        message: "MCP 访问 Token 无效",
      });
      return;
    }

    next();
  };
}

function timingSafeEqualUtf8(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}