import { Router } from "express";
import { generateKeyPairSync } from "node:crypto";
import { logger } from "../lib/logger.js";

const router = Router();

// POST /api/keys/generate  body: { type: "ed25519" | "rsa" | "ecdsa" }
// Returns { publicKey, privateKey } in OpenSSH / PEM format
router.post("/keys/generate", (req, res) => {
  const { type } = req.body as { type: string };

  try {
    if (type === "ed25519") {
      const pair = generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      res.json({ publicKey: pair.publicKey, privateKey: pair.privateKey });

    } else if (type === "rsa") {
      const pair = generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      res.json({ publicKey: pair.publicKey, privateKey: pair.privateKey });

    } else if (type === "ecdsa") {
      const pair = generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
      res.json({ publicKey: pair.publicKey, privateKey: pair.privateKey });

    } else {
      res.status(400).json({ error: "Unsupported key type" });
    }
  } catch (err: any) {
    logger.error({ err }, "Key generation failed");
    res.status(500).json({ error: err.message });
  }
});

export default router;
