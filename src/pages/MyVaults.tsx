import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToR2, deleteFromR2, verifyVault } from "@/lib/worker";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { Eye, Clock, QrCode, EyeOff, Pause, Play, Timer, Trash2, Edit, Share2, X, Search, Copy, RefreshCw, ArrowLeft, ImagePlus, Loader2 } from "lucide-react";

// Worker URL consistent with ViewVault logic
const WORKER_URL = "https://secretgpv.janikamo465.workers.dev";

interface Vault {
  id: string;
  pin: string;
  viewCount: number;
  viewLimit: number;
  selfDestruct: boolean;
  downloadAllowed: boolean;
  status: string;
  expiry: any;
  createdAt: any;
  fileKeys: string[];
  reminderText: string;
  shortCode?: string;
  ownerId: string;
}

// Utility Helpers
function getExpiryDate(expiry: any): Date | null {
  if (!expiry) return null;
  if (expiry.toDate) return expiry.toDate();
  if (expiry.seconds) return new Date(expiry.seconds * 1000);
  if (typeof expiry === "string") return new Date(expiry);
  return null;
}

function getCreatedDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function useCountdown(target: Date | null) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!target) { setRemaining("Never"); return; }
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);
  return remaining;
}

// --- Components ---

const VaultCard: React.FC<{ vault: Vault; onEdit: (vault: Vault) => void; onImageEdit: (vault: Vault) => void }> = ({ vault, onEdit, onImageEdit }) => {
  const [showPin, setShowPin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const expiryDate = getExpiryDate(vault.expiry);
  const countdown = useCountdown(expiryDate);
  const expired = countdown === "Expired";
  const stopped = vault.status === "stopped";
  const destructed = vault.selfDestruct && vault.viewCount >= vault.viewLimit;

  const toggleStatus = async () => {
    const newStatus = vault.status === "stopped" ? "active" : "stopped";
    await updateDoc(doc(db, "vaults", vault.id), { status: newStatus });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this vault permanently?")) return;
    await updateDoc(doc(db, "vaults", vault.id), { status: "deleted" });
    toast.success("Vault deleted");
  };

  const handleShare = async () => {
    const url = `https://x87.lovable.app/v/${vault.id}`;
    const text = "Someone sent you a private vault… it may disappear after you view it 🔒";
    if (navigator.share) {
      try { await navigator.share({ title: "SecretGPV Vault", text, url }); } catch {}
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied!");
    }
  };

  const statusLabel = destructed ? "Destructed" : expired ? "Expired" : stopped ? "Stopped" : "Active";
  const statusColor = destructed || expired ? "bg-red-500/20 text-red-400" : stopped ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400";

  return (
    <>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-fade-in hover:border-white/20 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {vault.shortCode && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 flex items-center gap-1">
                {vault.shortCode}
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(vault.shortCode!); toast.success("Short code copied!"); }} className="hover:text-blue-300">
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            <span className="font-mono text-xs text-white/40">{vault.id}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/40">PIN:</span>
          <span className="font-mono text-sm">{showPin ? vault.pin : "••••"}</span>
          <button onClick={() => setShowPin(!showPin)} className="text-white/40 hover:text-white">
            {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{vault.viewCount}/{vault.viewLimit}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{vault.fileKeys?.length || 0} photos</span>
          {vault.selfDestruct && <span className="text-red-400">💣</span>}
          {!vault.downloadAllowed && <span className="text-yellow-400">🔒</span>}
        </div>

        {countdown && !destructed && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px]">
            <Timer className="w-3 h-3 text-blue-400" />
            <span className={expired ? "text-red-400" : "text-blue-400"}>{countdown}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button onClick={() => setShowQR(true)} className="inline-flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-1 rounded-lg">
            <QrCode className="w-3 h-3" /> QR
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg">
            <Share2 className="w-3 h-3" /> Share
          </button>
          {!destructed && !expired && (
            <>
              <button onClick={toggleStatus} className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white bg-white/5 px-2 py-1 rounded-lg">
                {stopped ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {stopped ? "Resume" : "Stop"}
              </button>
              <button onClick={() => onEdit(vault)} className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white bg-white/5 px-2 py-1 rounded-lg">
                <Edit className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => onImageEdit(vault)} className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded-lg">
                <ImagePlus className="w-3 h-3" /> Images
              </button>
            </>
          )}
          <button onClick={handleDelete} className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <button onClick={() => setShowQR(false)} className="absolute -top-3 -right-3 z-50 bg-white/10 rounded-full p-1">
              <X className="w-5 h-5 text-white" />
            </button>
            <QRCodeCard vaultId={vault.id} reminderText={vault.reminderText} shortCode={vault.shortCode} />
          </div>
        </div>
      )}
    </>
  );
};

const EditVaultModal: React.FC<{ vault: Vault; onClose: () => void }> = ({ vault, onClose }) => {
  const [pin, setPin] = useState(vault.pin);
  const [viewLimit, setViewLimit] = useState(vault.viewLimit);
  const [reminderText, setReminderText] = useState(vault.reminderText || "");
  const [downloadAllowed, setDownloadAllowed] = useState(vault.downloadAllowed);
  const [neverExpire, setNeverExpire] = useState(!vault.expiry);
  const [expiryValue, setExpiryValue] = useState(24);
  const [expiryUnit, setExpiryUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [saving, setSaving] = useState(false);

  const getExpiryMs = () => {
    switch (expiryUnit) {
      case "minutes": return expiryValue * 60 * 1000;
      case "hours": return expiryValue * 60 * 60 * 1000;
      case "days": return expiryValue * 24 * 60 * 60 * 1000;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = { pin: String(pin), viewLimit, reminderText, downloadAllowed };
      if (neverExpire) { updates.expiry = null; } else { updates.expiry = new Date(Date.now() + getExpiryMs()); }
      await updateDoc(doc(db, "vaults", vault.id), updates);
      toast.success("Vault updated!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md p-6 rounded-2xl bg-[#1e293b] border border-white/10 text-white max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-lg font-bold mb-4">Edit Vault: {vault.id}</h3>
        <div className="mb-3">
          <label className="text-xs text-white/50 mb-1 block">PIN</label>
          <input type="text" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500/50" />
        </div>
        <div className="mb-3">
          <label className="text-xs text-white/50 mb-1 block">View Limit: {viewLimit}</label>
          <input type="range" min={1} max={50} value={viewLimit} onChange={(e) => setViewLimit(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
        <div className="mb-3">
          <label className="text-xs text-white/50 mb-1 block">Reminder Text</label>
          <input type="text" value={reminderText} onChange={(e) => setReminderText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" maxLength={100} />
        </div>
        <div className="flex items-center gap-3 mb-3 bg-white/5 p-3 rounded-xl">
          <input type="checkbox" checked={downloadAllowed} onChange={(e) => setDownloadAllowed(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Allow downloads</label>
        </div>
        <div className="flex items-center gap-3 mb-3 bg-white/5 p-3 rounded-xl">
          <input type="checkbox" checked={neverExpire} onChange={(e) => setNeverExpire(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Never expire</label>
        </div>
        {!neverExpire && (
          <div className="mb-4">
            <label className="text-xs text-white/50 mb-1 block">New Expiry (from now): {expiryValue} {expiryUnit}</label>
            <div className="flex gap-2">
              <input type="range" min={1} max={expiryUnit === "minutes" ? 60 : expiryUnit === "hours" ? 168 : 30} value={expiryValue} onChange={(e) => setExpiryValue(Number(e.target.value))} className="flex-1 accent-green-500" />
              <select value={expiryUnit} onChange={(e) => setExpiryUnit(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-sm text-white outline-none">
                <option value="minutes">Min</option>
                <option value="hours">Hrs</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm hover:bg-white/10">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl font-semibold text-white text-sm" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PinVerifyModal: React.FC<{ vault: Vault; onSuccess: (pin: string) => void; onClose: () => void }> = ({ vault, onClose, onSuccess }) => {
  const [pin, setPin] = useState("");
  const verify = () => {
    if (pin === vault.pin) { onSuccess(pin); } else { toast.error("Wrong PIN"); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs p-6 rounded-2xl bg-[#1e293b] border border-white/10 text-white text-center shadow-2xl">
        <h3 className="text-lg font-bold mb-4">Enter Vault PIN</h3>
        <input type="number" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" maxLength={8}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-center text-lg tracking-[0.3em] outline-none mb-4"
          onKeyDown={(e) => e.key === "Enter" && verify()} autoFocus />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm">Cancel</button>
          <button onClick={verify} className="flex-1 py-2 rounded-xl font-semibold text-white text-sm" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>Verify</button>
        </div>
      </div>
    </div>
  );
};

// --- Image Edit Mode (Fixed Logic) ---

const ImageEditMode: React.FC<{ vault: Vault; pin: string; onClose: () => void }> = ({ vault, pin, onClose }) => {
  const [fileKeys, setFileKeys] = useState<string[]>(vault.fileKeys || []);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch resolved image URLs through the same worker endpoint as ViewVault
  // This guarantees identical data source and rendering behavior.
  const refreshImages = useCallback(async () => {
    try {
      const res: any = await verifyVault(vault.id, pin);
      const urls: string[] = res?.images || [];
      setImageUrls(urls);
      console.log("Edit Mode Images:", urls.length, urls);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [vault.id, pin]);

  useEffect(() => {
    refreshImages();
  }, [refreshImages]);

  const displayKeys = showAll ? fileKeys : fileKeys.slice(0, 4);
  const displayUrls = showAll ? imageUrls : imageUrls.slice(0, 4);

  const imageRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            setLoadedImages((prev) => new Set(prev).add(idx));
          }
        });
      }, { rootMargin: "200px" });
    }
    observerRef.current.observe(node);
  }, []);

  const handleReplace = async (idx: number, file: File) => {
    setReplacingIdx(idx);
    try {
      const oldKey = fileKeys[idx];
      const newKey = `vaults/${vault.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      await uploadToR2(file, newKey);
      try { await deleteFromR2(oldKey); } catch {}
      const newKeys = [...fileKeys];
      newKeys[idx] = newKey;
      await updateDoc(doc(db, "vaults", vault.id), { fileKeys: newKeys });
      setFileKeys(newKeys);
      await refreshImages();
      toast.success("Image replaced!");
    } catch (err: any) {
      toast.error(err.message || "Replace failed");
    } finally { setReplacingIdx(null); }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm("Delete this image permanently?")) return;
    setDeletingIdx(idx);
    try {
      const key = fileKeys[idx];
      try { await deleteFromR2(key); } catch {}
      const newKeys = fileKeys.filter((_, i) => i !== idx);
      await updateDoc(doc(db, "vaults", vault.id), { fileKeys: newKeys });
      setFileKeys(newKeys);
      await refreshImages();
      toast.success("Image deleted!");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally { setDeletingIdx(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-[#0f172a]">
        <button onClick={onClose} className="text-white/50 hover:text-white flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <span className="text-white font-bold text-sm">{fileKeys.length} Photos</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#0f172a]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
            <p className="text-white/40 text-sm">Loading images...</p>
          </div>
        ) : displayUrls.length === 0 ? (
          <div className="text-center text-white/40 py-20 text-sm">No images in this vault.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayUrls.map((url, idx) => (
              <div key={(displayKeys[idx] || idx) + "-" + idx} ref={imageRef} data-idx={idx} className="relative group rounded-2xl overflow-hidden bg-white/5 aspect-square border border-white/5">
                {(loadedImages.has(idx) || idx < 4) ? (
                  <img
                    src={url}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setFullscreenIdx(idx)}
                    loading="lazy"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white/10 animate-spin" />
                  </div>
                )}

                {replacingIdx === idx && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  </div>
                )}
                {deletingIdx === idx && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-gradient-to-t from-black/90 to-transparent">
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.setAttribute("data-replace-idx", String(idx)); fileInputRef.current?.click(); }}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] py-2 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 backdrop-blur-md"
                  >
                    <RefreshCw className="w-3 h-3" /> Replace
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/40 backdrop-blur-md"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !showAll && fileKeys.length > 4 && (
          <button onClick={() => setShowAll(true)} className="w-full mt-6 py-4 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 text-sm font-semibold transition-all border border-white/10">
            Show All ({fileKeys.length}) Images
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        const idx = Number(fileInputRef.current?.getAttribute("data-replace-idx") || 0);
        if (file) handleReplace(idx, file);
        e.target.value = "";
      }} />

      {fullscreenIdx !== null && imageUrls[fullscreenIdx] && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-fade-in" onClick={() => setFullscreenIdx(null)}>
          <button onClick={() => setFullscreenIdx(null)} className="absolute top-6 left-6 z-50 text-white/50 hover:text-white flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <img src={imageUrls[fullscreenIdx]} alt="" className="max-w-[95vw] max-h-[90vh] object-contain shadow-2xl" crossOrigin="anonymous" />
          <div className="absolute bottom-6 bg-black/40 px-4 py-2 rounded-full text-white/60 text-xs backdrop-blur-md">{fullscreenIdx + 1} / {imageUrls.length}</div>
        </div>
      )}
    </div>
  );
};

// --- Main Page ---

const MyVaults: React.FC = () => {
  const { userData } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recent" | "all">("recent");
  const [editVault, setEditVault] = useState<Vault | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pinVerifyVault, setPinVerifyVault] = useState<Vault | null>(null);
  const [imageEditVault, setImageEditVault] = useState<Vault | null>(null);
  const [editPin, setEditPin] = useState<string>("");

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "vaults"), where("ownerId", "==", userData.uid));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Vault))
        .filter((v) => v.status !== "deleted");
      setVaults(all);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [userData?.uid]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sorted = useMemo(() =>
    [...vaults].sort((a, b) => {
      const aDate = getCreatedDate(a.createdAt)?.getTime() || 0;
      const bDate = getCreatedDate(b.createdAt)?.getTime() || 0;
      return bDate - aDate;
    }), [vaults]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return sorted;
    const q = debouncedSearch.toUpperCase();
    return sorted.filter((v) => v.shortCode?.toUpperCase().includes(`SG-${q}`) || v.shortCode?.toUpperCase().includes(q) || v.id.includes(debouncedSearch));
  }, [sorted, debouncedSearch]);

  const recentVaults = filtered.slice(0, 1);
  const displayVaults = tab === "recent" ? recentVaults : filtered;

  if (loading) return <OrbitalLoader />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-white/50 hover:text-white text-sm transition-colors">← Back Dashboard</Link>
        <h1 className="text-3xl font-bold mt-4 mb-4 tracking-tight">My Vaults</h1>

        <div className="mb-6">
          <p className="text-[10px] text-white/30 mb-2 uppercase tracking-widest font-semibold">Find Vault Instantly</p>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-green-500/50 transition-all">
            <Search className="w-5 h-5 text-white/30" />
            <span className="text-sm text-white/30 font-mono">SG-</span>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="e.g. 7K2X" className="flex-1 bg-transparent text-white text-sm outline-none font-mono placeholder:text-white/10" maxLength={4} />
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
          <button onClick={() => setTab("recent")} className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "recent" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-white/50 hover:text-white"}`}>Recent</button>
          <button onClick={() => setTab("all")} className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "all" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-white/50 hover:text-white"}`}>All ({vaults.length})</button>
        </div>

        {displayVaults.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-white/40 mb-4">{debouncedSearch ? "No vault found for this code" : "Your vault collection is empty."}</p>
            {!debouncedSearch && <Link to="/create-vault" className="inline-block px-6 py-2 rounded-xl bg-green-500 text-white text-sm font-bold">Create New Vault</Link>}
          </div>
        ) : (
          <div className="space-y-4">
            {displayVaults.map((v) => (
              <VaultCard key={v.id} vault={v} onEdit={setEditVault} onImageEdit={(v) => setPinVerifyVault(v)} />
            ))}
          </div>
        )}

        {editVault && <EditVaultModal vault={editVault} onClose={() => setEditVault(null)} />}
        {pinVerifyVault && <PinVerifyModal vault={pinVerifyVault} onClose={() => setPinVerifyVault(null)} onSuccess={(pin) => { setEditPin(pin); setImageEditVault(pinVerifyVault); setPinVerifyVault(null); }} />}
        {imageEditVault && <ImageEditMode vault={imageEditVault} pin={editPin} onClose={() => { setImageEditVault(null); setEditPin(""); }} />}
      </div>
    </div>
  );
};

export default MyVaults;
