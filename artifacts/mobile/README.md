# ConnectX — SSH/VNC/RDP/SFTP Client

A mobile client app for managing remote connections, built with Expo (React Native).

---

## How to Run on Expo Go

### Step 1 — Install Expo Go on your device

| Platform | Link |
|----------|------|
| Android  | [Play Store — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) |
| iOS      | [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779) |

> **Important:** This project uses **Expo SDK 54**. Make sure the Expo Go version on your phone supports SDK 54. The latest Expo Go from the store will work.

---

### Step 2 — Open this project in Replit

Make sure the **Expo workflow** is running. You should see it listed as `artifacts/mobile: expo` in the sidebar. If it's not running, start it.

---

### Step 3 — Scan the QR code

1. Open the **Preview pane** in Replit (select **ConnectX - SSH/VNC/RDP/SFTP Client** from the dropdown).
2. You will see a QR code on screen — this is served by the Metro bundler.
3. Scan it:
   - **Android:** Open Expo Go → tap "Scan QR code"
   - **iOS:** Open the default Camera app and point it at the QR code, then tap the Expo Go banner

The app will bundle and launch on your device in about 30–60 seconds the first time.

---

### Step 4 — Using the app

Once loaded, you'll see five tabs at the bottom:

| Tab | What it does |
|-----|-------------|
| **Connections** | Add, edit, delete, and browse saved connections |
| **Terminal** | Open terminal sessions with colour schemes and a key toolbar |
| **Files** | Browse a real SFTP directory and manage remote folders/files |
| **Keys** | Manage SSH key pairs (Ed25519 / RSA / ECDSA) |
| **Settings** | Configure security, SSH, terminal, and network options |

---

## Feature Status — What Works Right Now

This section is honest about what is fully functional, what is UI-only, and what needs extra native libraries to work.

### ✅ Fully Working (no limitations)

| Feature | Detail |
|---------|--------|
| Add / Edit / Delete connections | Supports SSH, VNC, RDP, SFTP with all fields |
| Search & filter connections | By name or by protocol type |
| Connection persistence | Saved to device storage via AsyncStorage |
| Terminal UI | Multi-tab interface, 6 colour schemes, font-size control, Vim mode toggle |
| Terminal key toolbar | ESC, TAB, CTRL, ALT, arrow keys, F1–F12 |
| SSH key list | View, copy, and delete saved key pairs |
| Settings UI | All toggle switches, sliders, and option pickers |
| Sample data on first launch | 5 pre-loaded demo connections so you can explore immediately |
| Haptic feedback | Tap and long-press haptics on supported devices |
| Dark terminal themes | Green, Amber, Cyan, White, Solarized, Dracula |

---

### ⚠️ Simulated (UI works, no real network action)

These features look and feel complete but do **not** make real network connections. They use demo data or mock responses.

| Feature | What you see | What's missing |
|---------|-------------|----------------|
| **SSH terminal** | Real interactive shell over the API server's WebSocket bridge, including command input, output, resize, escape, and arrow-key controls | Requires a reachable SSH server and valid saved credentials. |
| **VNC / RDP sessions** | "Viewer launching" alert when you connect | No VNC/RDP viewer — native viewer library not yet integrated |
| **SFTP file browser** | Real remote directory listing, breadcrumbs, navigation, folder creation, and deletion | Upload/download and file preview are not implemented yet |
| **SSH key generation** | Generates real Ed25519/RSA/ECDSA key pairs through the API server and stores private keys in SecureStore | Protect the API server before public deployment |
| **Cloud storage (Drive, Dropbox, S3…)** | Lists all providers with connect prompts | No OAuth or API connection implemented |
| **SMB / Network browser** | Tab exists in Files | Not yet implemented — shows empty state |
| **Biometric lock** | Toggle exists in Settings | No real biometric auth wired up |
| **Audit log** | Toggle exists in Settings | Not yet stored or displayed |
| **Tailscale / Mosh / Proxy** | Toggles exist in Settings | No network integration |
| **Key encrypted storage** | UI says "AES-256 encrypted" | Passwords stored in plain AsyncStorage (no real encryption) |

---

## Known Limitations on Expo Go

Expo Go is a pre-built shell — it cannot load arbitrary native modules. ConnectX is currently **100% Expo Go compatible** because no real native SSH/VNC/RDP libraries are loaded yet.

When real connection features are added in the future, a **custom development build** (EAS Build) will be required for:

- Real SSH (e.g. `react-native-ssh-sftp`)
- VNC / RDP viewers (native C++ libraries)
- Biometric authentication (`expo-local-authentication`)
- Secure key storage (`expo-secure-store`)
- Real cryptographic key generation (`expo-crypto`)

Until then, everything in the current app loads fine in stock Expo Go.

---

## Troubleshooting

### App won't scan / QR code not showing

- Make sure the `artifacts/mobile: expo` workflow is **running** in Replit.
- Refresh the preview pane.
- Make sure your phone and your computer are on the same network (or use Replit's tunnelled URL — the Metro URL shown in the workflow logs starting with `exp://...replit.dev`).

### "Something went wrong" on launch

- Force-close Expo Go and re-scan.
- In the Replit workflow logs, look for a red error — it usually points to a missing package.
- Try shaking the device in Expo Go to open the dev menu → **Reload**.

### Fonts not loading / icons showing as boxes

- This happens if the bundle is loaded before fonts finish downloading.
- Shake the device → **Reload** to retry.

### `react-native-keyboard-controller` warning

You may see a yellow warning about `KeyboardProvider`. This is harmless — the keyboard-aware scroll view falls back gracefully on web or if the native module version doesn't match. The app still works fully.

### Android back button closes the app

This is normal Expo Go behaviour. Use the tab bar to navigate between screens instead.

---

## Development Notes

```bash
# Install dependencies
pnpm install

# Start the dev server (Replit workflow does this automatically)
pnpm --filter @workspace/mobile run dev

# The Metro bundler URL will appear in the workflow logs:
# exp://<your-replit-dev-domain>
```

### Project structure

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx          # Root layout, fonts, providers
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar setup
│       ├── index.tsx        # Connections screen
│       ├── terminal.tsx     # Terminal screen
│       ├── files.tsx        # File browser screen
│       ├── keys.tsx         # SSH keys screen
│       └── settings.tsx     # Settings screen
├── components/
│   ├── ConnectionCard.tsx   # Connection list item
│   ├── ConnectionForm.tsx   # Add/edit connection modal
│   ├── TerminalView.tsx     # Terminal emulator component
│   ├── FileItem.tsx         # File browser row
│   └── EmptyState.tsx       # Empty list placeholder
├── context/
│   ├── ConnectionsContext.tsx  # Global connections + keys state
│   └── TerminalContext.tsx     # Active terminal sessions state
├── constants/
│   └── colors.ts            # Colour palette (dark GitHub-inspired theme)
└── hooks/
    └── useColors.ts         # Theme colour hook
```

---

## Colour Scheme

The app uses a dark developer-focused palette inspired by GitHub's dark mode:

| Token | Colour | Used for |
|-------|--------|---------|
| Background | `#0d1117` | Screen backgrounds |
| Card | `#161b22` | Connection cards, panels |
| Border | `#30363d` | Dividers, input borders |
| Tint | `#58a6ff` | Active tabs, buttons, SSH accent |
| SSH | `#58a6ff` | SSH connection type |
| VNC | `#f78166` | VNC connection type |
| RDP | `#d2a8ff` | RDP connection type |
| SFTP | `#3fb950` | SFTP connection type |
| Text | `#e6edf3` | Primary text |

---

## Roadmap (features not yet implemented)

- [ ] Real SSH connection via `react-native-ssh-sftp`
- [ ] Real SFTP file transfer and upload/download
- [ ] VNC viewer (via native WebView + noVNC or native module)
- [ ] RDP viewer (native module, Android only initially)
- [ ] Actual cryptographic SSH key generation (`expo-crypto`)
- [ ] Encrypted key storage (`expo-secure-store`)
- [ ] Biometric app lock (`expo-local-authentication`)
- [ ] Cloud provider OAuth (Google Drive, Dropbox, OneDrive, S3)
- [ ] SMB / CIFS network browser
- [ ] Port forwarding UI
- [ ] Known hosts management
- [ ] Audit log viewer
- [ ] Tailscale integration

---

*Built with Expo SDK 54, React Native, Expo Router, and AsyncStorage.*
