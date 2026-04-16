import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { uploadToR2 } from "@/lib/worker";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { Upload, X, Copy, Eye, Check, AlertTriangle, Loader2 } from "lucide-react";

function generateShortCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SG-${code}`;
}

interface ImageUploadState {
  file: File;
  status: "uploading" | "success" | "failed";
  key: string;
  retries: number;
  preview: string;
}

async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob && blob.size < file.size) {
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        } else {
          resolve(file);
        }
      }, "image/jpeg", quality);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

const MAX_RETRIES = 3;

const CreateVault: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageUploadState[]>([]);
  const [pin, setPin] = useState("");
  const [viewLimit, setViewLimit] = useState(5);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [neverExpire, setNeverExpire] = useState(false);
  const [expiryValue, setExpiryValue] = useState(24);
  const [expiryUnit, setExpiryUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [reminderText, setReminderText] = useState("Scan this to unlock your private vault photos");
  const [creating, setCreating] = useState(false);
  const [createdVaultId, setCreatedVaultId] = useState<string | null>(null);
  const [createdReminderText, setCreatedReminderText] = useState("");
  const [createdShortCode, setCreatedShortCode] = useState<string | undefined>(undefined);

  if (!userData) return <OrbitalLoader />;

  const uploadSingleImage = async (img: ImageUploadState, idx: number, vaultId: string): Promise<ImageUploadState> => {
    const key = `vaults/${vaultId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${img.file.name}`;
    let compressed: File;
    try { compressed = await compressImage(img.file); } catch { compressed = img.file; }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await uploadToR2(compressed, key);
        return { ...img, status: "success", key };
      } catch {
        if (attempt === MAX_RETRIES) return { ...img, status: "failed", key, retries: attempt };
      }
    }
    return { ...img, status: "failed", key, retries: MAX_RETRIES };
  };

  const handleFilesSelect = (selectedFiles: File[]) => {
    const maxSelectable = userData.credits || 0;
    if (selectedFiles.length + images.length > maxSelectable) {
      toast.error(`You can select max ${maxSelectable} images (your credits)`);
      selectedFiles = selectedFiles.slice(0, maxSelectable - images.length);
    }
    const newImages: ImageUploadState[] = selectedFiles.map((f) => ({
      file: f,
      status: "uploading" as const,
      key: "",
      retries: 0,
      preview: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...newImages]);

    // Start background uploads immediately
    const vaultId = sessionStorage.getItem("_pendingVaultId") || crypto.randomUUID().slice(0, 12);
    sessionStorage.setItem("_pendingVaultId", vaultId);

    newImages.forEach((img, i) => {
      const globalIdx = images.length + i;
      uploadSingleImage(img, globalIdx, vaultId).then((result) => {
        setImages((prev) => prev.map((p, j) => j === globalIdx ? result : p));
      });
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const allUploaded = images.length > 0 && images.every((i) => i.status === "success");
  const hasFailed = images.some((i) => i.status === "failed");
  const uploading = images.some((i) => i.status === "uploading");
  const requiredCredits = images.filter((i) => i.status === "success").length;
  const hasEnoughCredits = (userData.credits || 0) >= requiredCredits;

  if (createdVaultId) {
    const vaultUrl = `https://x87.lovable.app/v/${createdVaultId}`;
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Vault Created! 🎉</h2>
        <p className="text-white/50 text-sm mb-4">Share the QR code to give access</p>
        <QRCodeCard vaultId={createdVaultId} reminderText={createdReminderText} shortCode={createdShortCode} />
        <div className="flex gap-3 mt-6 animate-fade-in">
          <button onClick={() => navigate(`/v/${createdVaultId}`)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            <Eye className="w-4 h-4" /> View Vault
          </button>
          <button onClick={() => { navigator.clipboard.writeText(vaultUrl); toast.success("Vault link copied!"); }} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 transition hover:scale-[1.02]">
            <Copy className="w-4 h-4" /> Copy URL
          </button>
        </div>
        <button onClick={() => navigate("/dashboard")} className="mt-4 px-6 py-3 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 transition text-sm">Back to Dashboard</button>
      </div>
    );
  }

  const getExpiryMs = () => {
    switch (expiryUnit) {
      case "minutes": return expiryValue * 60 * 1000;
      case "hours": return expiryValue * 60 * 60 * 1000;
      case "days": return expiryValue * 24 * 60 * 60 * 1000;
    }
  };

  const handleCreate = async () => {
    if (!pin || pin.length < 4) return toast.error("PIN must be at least 4 digits");
    if (!allUploaded) return toast.error("Wait for all images to upload");
    if (!hasEnoughCredits) return toast.error(`Not enough credits. Need ${requiredCredits}, have ${userData.credits}`);

    setCreating(true);
    try {
      const vaultId = sessionStorage.getItem("_pendingVaultId") || crypto.randomUUID().slice(0, 12);
      const shortCode = generateShortCode();
      const fileKeys = images.filter((i) => i.status === "success").map((i) => i.key);
      const expiry = neverExpire ? null : new Date(Date.now() + getExpiryMs());

      await setDoc(doc(db, "vaults", vaultId), {
        ownerId: userData.uid,
        pin: String(pin),
        fileKeys,
        viewLimit,
        viewCount: 0,
        selfDestruct,
        downloadAllowed,
        reminderText: reminderText.trim() || "Scan this to unlock your private vault photos",
        status: "active",
        shortCode,
        expiry,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", userData.uid), {
        credits: increment(-requiredCredits),
        vaultsCreated: increment(1),
      });

      sessionStorage.removeItem("_pendingVaultId");
      setCreatedReminderText(reminderText.trim() || "Scan this to unlock your private vault photos");
      setCreatedShortCode(shortCode);
      setCreatedVaultId(vaultId);
      toast.success("Vault created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create vault");
    } finally {
      setCreating(false);
    }
  };

  if (creating) return <OrbitalLoader text="Creating vault..." />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate("/dashboard")} className="text-white/50 hover:text-white text-sm mb-6">← Back to Dashboard</button>
        <h1 className="text-2xl font-bold mb-6">Create New Vault</h1>

        {/* Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Photos</label>
          <label className="flex flex-col items-center gap-2 p-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-green-500/50 cursor-pointer transition">
            <Upload className="w-8 h-8 text-white/40" />
            <span className="text-sm text-white/50">Click to upload photos</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              if (selected.length > 0) handleFilesSelect(selected);
              e.target.value = "";
            }} />
          </label>

          {images.length > 0 && (
            <>
              {/* Upload status */}
              <div className="mt-3 flex items-center gap-2">
                {allUploaded && <span className="flex items-center gap-1 text-green-400 text-xs"><Check className="w-3.5 h-3.5" /> All {images.length} images uploaded successfully</span>}
                {hasFailed && <span className="flex items-center gap-1 text-red-400 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Some images failed</span>}
                {uploading && <span className="flex items-center gap-1 text-blue-400 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</span>}
              </div>

              {/* Image grid preview */}
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {img.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {img.status === "success" && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-4 h-4 text-green-400 bg-black/50 rounded-full p-0.5" />
                      </div>
                    )}
                    {img.status === "failed" && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                    <button onClick={() => removeImage(i)} className="absolute top-1 left-1 bg-black/50 rounded-full p-0.5 hover:bg-black/80">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-1">Total: {images.length} images • Cost: {requiredCredits} credit{requiredCredits > 1 ? "s" : ""}</p>
            </>
          )}
        </div>

        {/* PIN */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Vault PIN</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter 4+ digit PIN" maxLength={8} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none" />
        </div>

        {/* View Limit */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">View Limit: {viewLimit}</label>
          <input type="range" min={1} max={50} value={viewLimit} onChange={(e) => setViewLimit(Number(e.target.value))} className="w-full accent-green-500" />
        </div>

        {/* Never Expire */}
        <div className="flex items-center gap-3 mb-4 bg-white/5 p-4 rounded-xl">
          <input type="checkbox" checked={neverExpire} onChange={(e) => setNeverExpire(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Never expire</label>
        </div>

        {/* Expiry */}
        {!neverExpire && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Expiry: {expiryValue} {expiryUnit}</label>
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

        {/* Reminder Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">QR Reminder Text</label>
          <input type="text" value={reminderText} onChange={(e) => setReminderText(e.target.value)} placeholder="Custom reminder text for QR card" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none text-sm" maxLength={100} />
        </div>

        {/* Self Destruct */}
        <div className="flex items-center gap-3 mb-4 bg-white/5 p-4 rounded-xl">
          <input type="checkbox" checked={selfDestruct} onChange={(e) => setSelfDestruct(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Self-destruct after view limit reached</label>
        </div>

        {/* Download Toggle */}
        <div className="flex items-center gap-3 mb-8 bg-white/5 p-4 rounded-xl">
          <input type="checkbox" checked={downloadAllowed} onChange={(e) => setDownloadAllowed(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Allow photo downloads</label>
        </div>

        {(userData.credits || 0) === 0 ? (
          <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm font-medium">No credits left. Please upgrade.</p>
            <button onClick={() => navigate("/pricing")} className="mt-2 text-xs text-green-400 hover:underline">View Plans →</button>
          </div>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!allUploaded || !hasEnoughCredits || images.length === 0}
            className="w-full py-3.5 rounded-xl font-bold text-white transition hover:scale-[1.01] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 10px 30px rgba(22,163,74,0.3)" }}
          >
            Create Vault ({requiredCredits || 0} Credit{requiredCredits > 1 ? "s" : ""})
          </button>
        )}
        <p className="text-center text-xs text-white/30 mt-3">Available: {userData.credits} credits</p>
      </div>
    </div>
  );
};

export default CreateVault;
