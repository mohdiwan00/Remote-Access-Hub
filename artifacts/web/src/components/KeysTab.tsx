import React, { useState } from "react";
import { CheckCircle2, Copy, Cpu, Key, Plus, Shield, Trash2, X } from "lucide-react";
import { useConnections, type SSHKey } from "@/context/ConnectionsContext";

const KEY_TYPES: SSHKey["type"][] = ["ed25519", "rsa", "ecdsa"];

const KEY_TYPE_INFO: Record<SSHKey["type"], { label: string; desc: string; color: string }> = {
  ed25519: { label: "Ed25519", desc: "Fastest & most secure. Recommended.", color: "#3fb950" },
  rsa: { label: "RSA 4096", desc: "Widely compatible. Good for older servers.", color: "#58a6ff" },
  ecdsa: { label: "ECDSA", desc: "Elliptic curve. Compact and fast.", color: "#a371f7" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

interface Props {
  onNotify: (msg: string) => void;
}

export function KeysTab({ onNotify }: Props) {
  const { keys, addKey, deleteKey } = useConnections();
  const [showGenerate, setShowGenerate] = useState(false);
  const [keyType, setKeyType] = useState<SSHKey["type"]>("ed25519");
  const [keyName, setKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [viewingKey, setViewingKey] = useState<SSHKey | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SSHKey | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setGenError("Please enter a name for this key.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const response = await fetch("/api/keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: keyType, comment: keyName.trim() }),
      });
      const data = (await response.json()) as {
        publicKey?: string;
        privateKey?: string;
        error?: string;
      };
      if (!response.ok || !data.publicKey || !data.privateKey) {
        throw new Error(data.error ?? "Key generation failed");
      }
      addKey({
        name: keyName.trim(),
        type: keyType,
        publicKey: data.publicKey,
        privateKey: data.privateKey,
      });
      setShowGenerate(false);
      setKeyName("");
      onNotify(`Generated ${KEY_TYPE_INFO[keyType].label} key "${keyName.trim()}"`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Unable to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (key: SSHKey) => {
    try {
      await navigator.clipboard.writeText(key.publicKey);
      onNotify("Public key copied to clipboard");
    } catch {
      setViewingKey(key);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-[#30363d] px-4 py-4 flex items-center justify-between bg-[#0d1117]">
        <h1 className="text-[26px] font-bold tracking-tight text-[#e6edf3]">SSH Keys</h1>
        <button
          type="button"
          onClick={() => {
            setGenError(null);
            setShowGenerate(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#58a6ff] text-white text-sm font-semibold hover:bg-[#4c96eb]"
        >
          <Plus className="w-4 h-4" />
          <span>Generate</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl border border-[#30363d] bg-[#161b22] p-3.5">
          <Shield className="w-4 h-4 text-[#58a6ff] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#8b949e] leading-relaxed">
            Keys are generated server-side via Node.js crypto and stored locally in browser storage. FIDO2 hardware keys (NFC/USB) supported on compatible devices.
          </p>
        </div>

        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mb-4">
              <Key className="w-7 h-7 text-[#8b949e]" />
            </div>
            <p className="text-base font-semibold text-[#e6edf3] mb-1">No SSH keys</p>
            <p className="text-sm text-[#8b949e] max-w-xs">
              Generate an Ed25519 key pair to authenticate without passwords
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {keys.map((item) => {
              const info = KEY_TYPE_INFO[item.type];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-[#30363d] bg-[#161b22] p-3.5"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${info.color}18` }}
                  >
                    <Key className="w-5 h-5" style={{ color: info.color }} />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setViewingKey(item)}
                  >
                    <p className="text-[15px] font-semibold text-[#e6edf3] truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        style={{
                          backgroundColor: `${info.color}18`,
                          borderColor: `${info.color}44`,
                          color: info.color,
                        }}
                        className="px-2 py-0.5 rounded border text-[11px] font-bold"
                      >
                        {info.label}
                      </span>
                      <span className="text-xs text-[#8b949e]">{timeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#8b949e] truncate mt-1">
                      {item.publicKey.replace(/\n/g, " ").substring(0, 48)}...
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleCopy(item)}
                      className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
                      title="Copy public key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(item)}
                      className="p-1.5 rounded-lg text-[#f85149] hover:bg-[#f85149]/15"
                      title="Delete key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={handleGenerate}
            className="w-full max-w-md rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#30363d]">
              <button
                type="button"
                onClick={() => setShowGenerate(false)}
                className="p-1 rounded-lg text-[#8b949e] hover:text-[#e6edf3]"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-[17px] font-semibold text-[#e6edf3]">Generate Key Pair</h2>
              <div className="w-7" />
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#8b949e] mb-2">KEY TYPE</p>
                <div className="space-y-2">
                  {KEY_TYPES.map((t) => {
                    const info = KEY_TYPE_INFO[t];
                    const active = keyType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setKeyType(t)}
                        style={{
                          backgroundColor: active ? `${info.color}18` : "#161b22",
                          borderColor: active ? info.color : "#30363d",
                        }}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl border-[1.5px] text-left transition-colors"
                      >
                        <Key
                          className="w-[18px] h-[18px] shrink-0"
                          style={{ color: active ? info.color : "#8b949e" }}
                        />
                        <div className="flex-1">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: active ? info.color : "#e6edf3" }}
                          >
                            {info.label}
                          </p>
                          <p className="text-xs text-[#8b949e]">{info.desc}</p>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: info.color }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-[#8b949e] mb-2">
                  KEY NAME
                </label>
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Work Laptop, Production"
                  className="w-full rounded-xl border border-[#30363d] bg-[#21262d] px-3.5 py-2.5 text-sm text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              {genError && <p className="text-xs text-[#f85149]">{genError}</p>}

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#58a6ff] text-white font-bold text-[15px] hover:bg-[#4c96eb] disabled:opacity-60"
              >
                <Cpu className="w-4 h-4" />
                <span>{generating ? "Generating..." : "Generate Key Pair"}</span>
              </button>

              <p className="text-xs text-center text-[#8b949e]">
                Private key is stored locally in your browser. Never shared publicly.
              </p>
            </div>
          </form>
        </div>
      )}

      {viewingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#e6edf3]">
                Public Key — {viewingKey.name}
              </h3>
              <button onClick={() => setViewingKey(null)} className="text-[#8b949e]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="rounded-lg border border-[#30363d] bg-[#0d1117] p-3 text-xs font-mono text-[#e6edf3] whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
              {viewingKey.publicKey}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => void handleCopy(viewingKey)}
                className="px-4 py-2 rounded-lg bg-[#58a6ff] text-white text-sm font-semibold"
              >
                Copy Key
              </button>
              <button
                onClick={() => setViewingKey(null)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#e6edf3]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#e6edf3]">Delete Key</h3>
            <p className="text-sm text-[#8b949e]">
              Remove <span className="text-[#e6edf3] font-medium">"{confirmDelete.name}"</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#e6edf3]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteKey(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#f85149] text-white text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
