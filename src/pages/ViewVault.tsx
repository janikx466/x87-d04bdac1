import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { verifyVault } from "@/lib/worker";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";
import { Lock, X, ChevronLeft, ChevronRight, Download, CheckSquare, Square } from "lucide-react";
import logoSrc from "@/assets/logo.png";

interface VaultData {
  images: string[];
  downloadAllowed?: boolean;
}

const ViewVault: React.FC = () => {
  const { vaultId } = useParams<{ vaultId: string }>();
  const [pin, setPin] = useState("");
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!unlocked && !verifying && !statusMessage && pinInputRef.current) {
      setTimeout(() => pinInputRef.current?.focus(), 300);
    }
  }, [unlocked, verifying, statusMessage]);

  const handleVerify = async () => {
    if (!pin || !vaultId) return toast.error("Enter a valid PIN");
    setVerifying(true);
    try {
      const res = await verifyVault(vaultId, pin);

      if (res.blocked) {
        setStatusMessage(res.reason || "Access denied");
        return;
      }

      if (res.deleted) {
        setStatusMessage("Vault was Deleted");
        return;
      }

      setVaultData({
        images: res.images || [],
        downloadAllowed: res.downloadAllowed !== false,
      });
      setUnlocked(true);
    } catch (err: any) {
      const msg = err.message || "Verification failed";
      if (msg.includes("Self Destruct") || msg.includes("Expired") || msg.includes("disabled") || msg.includes("stopped") || msg.includes("Deleted")) {
        setStatusMessage(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setVerifying(false);
    }
  };

  const preventContext = (e: React.MouseEvent) => {
    if (!vaultData?.downloadAllowed) e.preventDefault();
  };

  const openViewer = (idx: number) => {
    setViewerIndex(idx);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const nextImage = () => {
    if (!vaultData) return;
    setViewerIndex((i) => (i + 1) % vaultData.images.length);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const prevImage = () => {
    if (!vaultData) return;
    setViewerIndex((i) => (i - 1 + vaultData.images.length) % vaultData.images.length);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist.current > 0) {
        const ratio = dist / lastTouchDist.current;
        setScale((s) => Math.max(1, Math.min(5, s * ratio)));
      }
      lastTouchDist.current = dist;
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setDragging(true);
      setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && scale > 1) {
      setTranslate({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setDragging(false);

  const swipeStart = useRef(0);
  const handleSwipeStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale <= 1) swipeStart.current = e.touches[0].clientX;
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (scale > 1) return;
    const diff = swipeStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) diff > 0 ? nextImage() : prevImage();
    swipeStart.current = 0;
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const resp = await fetch(url, { mode: "cors" });
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Download failed");
    }
  };

  const downloadAll = async () => {
    if (!vaultData) return;
    for (let i = 0; i < vaultData.images.length; i++) {
      await downloadImage(vaultData.images[i], `vault-photo-${i + 1}.jpg`);
    }
    toast.success("All images downloaded!");
  };

  const downloadSelected = async () => {
    if (!vaultData) return;
    for (const idx of Array.from(selected)) {
      await downloadImage(vaultData.images[idx], `vault-photo-${idx + 1}.jpg`);
    }
    toast.success(`${selected.size} images downloaded!`);
    setSelectMode(false);
    setSelected(new Set());
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  if (statusMessage) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
        <div className="text-center">
          <img src={logoSrc} alt="SecretGPV" className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-white mb-2">{statusMessage}</h1>
          <p className="text-white/40 text-sm">This vault is no longer accessible.</p>
        </div>
      </div>
    );
  }

  if (verifying) return <OrbitalLoader text="Verifying PIN..." />;

  if (unlocked && vaultData) {
    const canDownload = vaultData.downloadAllowed;

    return (
      <div
        className="min-h-screen bg-[#0f172a] text-white px-4 py-8"
        onContextMenu={canDownload ? undefined : (e) => e.preventDefault()}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2 text-center">🔓 Vault Unlocked</h1>
          <p className="text-white/40 text-sm text-center mb-6">{vaultData.images.length} photos</p>

          {canDownload && vaultData.images.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <button onClick={downloadAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition">
                <Download className="w-4 h-4" /> Download All
              </button>
              <button
                onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/20 transition"
              >
                <CheckSquare className="w-4 h-4" /> {selectMode ? "Cancel" : "Select"}
              </button>
              {selectMode && selected.size > 0 && (
                <button onClick={downloadSelected} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition">
                  <Download className="w-4 h-4" /> Download {selected.size}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {vaultData.images.map((src, i) => (
              <div key={i} className="relative group cursor-pointer" onClick={() => selectMode ? toggleSelect(i) : openViewer(i)}>
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-2xl shadow-lg"
                  crossOrigin="anonymous"
                  onContextMenu={preventContext}
                  draggable={false}
                  style={!canDownload ? { WebkitUserSelect: "none", userSelect: "none" } : {}}
                />
                {selectMode && (
                  <div className="absolute top-2 right-2">
                    {selected.has(i) ? <CheckSquare className="w-6 h-6 text-green-500" /> : <Square className="w-6 h-6 text-white/50" />}
                  </div>
                )}
                {!canDownload && <div className="absolute inset-0 rounded-2xl" style={{ WebkitTouchCallout: "none" }} />}
              </div>
            ))}
          </div>

          {vaultData.images.length === 0 && <p className="text-center text-white/50 mt-8">No photos found.</p>}
        </div>

        {viewerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onTouchStart={(e) => { handleTouchStart(e); handleSwipeStart(e); }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleSwipeEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={canDownload ? undefined : (e) => e.preventDefault()}
          >
            <button onClick={closeViewer} className="absolute top-4 right-4 z-50 text-white/70 hover:text-white"><X className="w-8 h-8" /></button>
            <button onClick={prevImage} className="absolute left-2 z-50 text-white/50 hover:text-white p-2"><ChevronLeft className="w-8 h-8" /></button>
            <button onClick={nextImage} className="absolute right-2 z-50 text-white/50 hover:text-white p-2"><ChevronRight className="w-8 h-8" /></button>

            <img
              src={vaultData.images[viewerIndex]}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)` }}
              crossOrigin="anonymous"
              draggable={false}
              onContextMenu={preventContext}
            />

            {canDownload && (
              <button
                onClick={() => downloadImage(vaultData.images[viewerIndex], `vault-photo-${viewerIndex + 1}.jpg`)}
                className="absolute bottom-6 px-6 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            )}

            <div className="absolute bottom-6 left-6 text-white/40 text-xs">{viewerIndex + 1} / {vaultData.images.length}</div>
          </div>
        )}
      </div>
    );
  }

  // PIN entry
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm p-8 rounded-3xl text-center text-white"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <img src={logoSrc} alt="SecretGPV" className="w-14 h-14 mx-auto mb-3" />
        <Lock className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h1 className="text-xl font-bold mb-1">Private Vault</h1>
        <p className="text-white/50 text-sm mb-2">Someone sent you a private vault… it may disappear after you view it 🔒</p>
        <p className="text-white/40 text-xs mb-6">Enter PIN to unlock photos</p>
        <input
          ref={pinInputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          maxLength={8}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-center text-lg tracking-[0.3em] outline-none mb-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          autoFocus
        />
        <button onClick={handleVerify} className="w-full py-3 rounded-xl font-bold text-white transition" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
          Unlock Vault
        </button>
      </div>
    </div>
  );
};

export default ViewVault;
