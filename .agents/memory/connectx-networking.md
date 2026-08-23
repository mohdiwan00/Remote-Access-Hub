---
name: ConnectX networking boundary
description: Durable constraints for the mobile-to-backend SSH and SFTP architecture.
---

Expo Go is capable of using a WebSocket transport for interactive SSH because the mobile client does not need a native SSH library for the terminal bridge. SFTP can similarly be exposed through REST endpoints backed by the server-side SSH client.

**Why:** This keeps the current Expo Go development path viable while native viewer libraries remain unavailable.

**How to apply:** Keep SSH/SFTP protocol handling on the API server, but do not expose those proxy endpoints publicly until client authentication, authorization, rate limiting, credential handling, and server host-key verification are implemented.