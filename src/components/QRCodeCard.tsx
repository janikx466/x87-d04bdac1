import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";
import logoSrc from "@/assets/logo.png";

interface QRCodeCardProps {
  vaultId: string;
  reminderText?: string;
  type?: "vault" | "message";
  shortCode?: string;
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({ vaultId, reminderText, type = "vault", shortCode }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [qrReady, setQrReady] = useState(false);

  const reminder = reminderText || (type === "message"
    ? "This message will disappear after you read it 🔒"
    : "Scan this to unlock your private vault photos");

  const qrUrl = type === "message"
    ? `https://x87.lovable.app/m/${vaultId}`
    : `https://x87.lovable.app/v/${vaultId}`;

  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.innerHTML = "";
    setQrReady(false);

    const qr = new QRCodeStyling({
      width: 300,
      height: 300,
      type: "canvas",
      data: qrUrl,
      image: logoSrc,
      dotsOptions: {
        type: "dots",
        gradient: {
          type: "radial",
          colorStops: [
            { offset: 0, color: "#2563eb" },
            { offset: 0.5, color: "#9333ea" },
            { offset: 1, color: "#22c55e" },
          ],
        },
      },
      cornersSquareOptions: { type: "extra-rounded", color: "#16a34a" },
      cornersDotOptions: { type: "dot", color: "#16a34a" },
      backgroundOptions: { color: "#ffffff" },
      imageOptions: { crossOrigin: "anonymous", margin: 10, imageSize: 0.3 },
    });

    qr.append(qrRef.current);

    // Wait for QR to render then mark ready
    setTimeout(() => {
      setQrReady(true);
      const end = Date.now() + 1000;
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.5 }, colors: ["#22c55e", "#2563eb", "#9333ea"] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.5 }, colors: ["#22c55e", "#2563eb", "#9333ea"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 }, colors: ["#ffffff", "#22c55e", "#ffd700"] });
    }, 300);
  }, [vaultId, qrUrl]);

  const downloadQR = async () => {
    if (!exportRef.current) return;
    await new Promise((r) => setTimeout(r, 200));
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        logging: false,
        height: exportRef.current.scrollHeight,
        windowHeight: exportRef.current.scrollHeight,
      });
      const link = document.createElement("a");
      link.download = `SecretGPV-${type === "message" ? "Message" : "Vault"}-${vaultId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      const canvas = await html2canvas(exportRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `SecretGPV-${type === "message" ? "Message" : "Vault"}-${vaultId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handleShare = async () => {
    const hookText = type === "message"
      ? "Someone sent you a secret message… it may disappear after you read it 🔒"
      : "Someone sent you a private vault… it may disappear after you view it 🔒";
    if (navigator.share) {
      try { await navigator.share({ title: "SecretGPV", text: hookText, url: qrUrl }); } catch {}
    } else {
      navigator.clipboard.writeText(`${hookText}\n${qrUrl}`);
    }
  };

  if (!qrReady) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div ref={qrRef} className="opacity-0 absolute" />
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Generating QR Code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8 animate-fade-in">
      <div
        className="p-8 rounded-[35px] text-center text-white"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 25px 70px rgba(0,0,0,0.5)",
        }}
      >
        <div
          id="qrExportBox"
          ref={exportRef}
          style={{
            background: "#ffffff",
            padding: "20px",
            paddingBottom: "50px",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflow: "visible",
          }}
        >
          {/* Type badge */}
          {type === "message" && (
            <div style={{ marginBottom: "8px" }}>
              <span style={{ background: "#22c55e", color: "#fff", padding: "2px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" as const }}>SECRET MESSAGE</span>
            </div>
          )}

          {/* QR Code */}
          <div ref={qrRef} className="mb-4 inline-block" style={{ borderRadius: "20px" }} />

          {/* Reminder */}
          <div className="mb-3 px-2">
            <span style={{ fontSize: "14px", color: "#555", fontStyle: "italic", fontWeight: 300, display: "block", maxWidth: "280px", margin: "0 auto", lineHeight: 1.4 }}>
              "{reminder}"
            </span>
          </div>

          {/* Branding */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: "12px" }}>
            <span style={{ color: "#a3a3a3", marginRight: "6px" }}>POWERED BY</span>
            <span style={{ color: "#22c55e" }}>SECRETGPV {type === "message" ? "MESSAGE" : "VAULT"}</span>
          </div>

          {/* Short Code badge - always at bottom, inside export container */}
          {shortCode && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span style={{
                background: "linear-gradient(135deg, #2563eb, #9333ea)",
                color: "#fff",
                padding: "4px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "2px",
                fontFamily: "monospace",
                boxShadow: "0 4px 15px rgba(37,99,235,0.3)",
              }}>
                {shortCode}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 justify-center">
          <button
            onClick={downloadQR}
            className="px-8 py-3.5 border-none rounded-[15px] font-bold text-white cursor-pointer transition-all duration-300 hover:-translate-y-1"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 10px 25px rgba(22, 163, 74, 0.3)" }}
          >
            Download QR
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-3.5 border-none rounded-[15px] font-bold text-white cursor-pointer transition-all duration-300 hover:-translate-y-1"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeCard;
