// Intercom webhook signature verification

import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export function verifySignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientSecret = process.env.INTERCOM_CLIENT_SECRET;

  // Skip verification if no secret is configured (development mode)
  if (!clientSecret) {
    next();
    return;
  }

  const signature = req.headers["x-body-signature"] as string | undefined;
  if (!signature) {
    res.status(401).json({ error: "Missing X-Body-Signature header" });
    return;
  }

  const rawBody = (req as Request & { rawBody?: string }).rawBody;
  if (!rawBody) {
    res.status(400).json({ error: "Unable to verify request body" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", clientSecret)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  next();
}
