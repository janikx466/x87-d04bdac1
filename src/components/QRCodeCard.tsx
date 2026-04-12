import React, { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";
import logoSrc from "@/assets/logo.png";

interface QRCodeCardProps {
  vaultId: string;
  reminderText?: string;
}

const QRCodeCard: React.FC<QRCodeCardProps> = ({ vaultId, reminderText }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const qrReady = useRef(false);

  const reminder = reminderText || "Scan this to unlock your private vault photos";

  useEffect(() => {
    if (!qrRef.current) return;
    qrRef.current.innerHTML = "";

    const qr = new QRCodeStyling({
      width: 300,
      height: 300,
      type: "canvas",
      data: `https://x87.lovable.app/v/${vaultId}`,
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
    qrReady.current = true;

    // Fire confetti immediately
    setTimeout(() => {
      const end = Date.now() + 1000;
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.5 }, colors: ["#22c55e", "#2563eb", "#9333ea"] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.5 }, colors: ["#22c55e", "#2563eb", "#9333ea"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 }, colors: ["#ffffff", "#22c55e", "#ffd700"] });
    }, 200);
  }, [vaultId]);

  const downloadQR = async () => {
    if (!exportRef.current) return;
    // Wait a tick for canvas to render
    await new Promise((r) => setTimeout(r, 100));
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `SecretGPV-Vault-${vaultId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback: try again
      const canvas = await html2canvas(exportRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `SecretGPV-Vault-${vaultId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div
        className="p-8 rounded-[35px] text-center text-white"
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 25px 70px rgba(0,0,0,0.5)",
          animation: "cardPop 0.5s ease-out forwards",
        }}
      >
        <div id="qrExportBox" ref={exportRef} style={{ background: "#ffffff", padding: "20px", borderRadius: "20px" }}>
          <div
            ref={qrRef}
            className="mb-4 inline-block"
            style={{ borderRadius: "20px" }}
          />
          <div className="mb-3 px-2">
            <span style={{ fontSize: "14px", color: "#555", fontStyle: "italic", fontWeight: 300, display: "block", maxWidth: "280px", margin: "0 auto", lineHeight: 1.4 }}>
              "{reminder}"
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase" as const }}>
            <span style={{ color: "#a3a3a3", marginRight: "6px" }}>POWERED BY</span>
            <span style={{ color: "#22c55e" }}>SECRETGPV VAULT</span>
          </div>
        </div>

        <button
          onClick={downloadQR}
          className="mt-6 px-8 py-3.5 border-none rounded-[15px] font-bold text-white cursor-pointer transition-all duration-300 hover:-translate-y-1"
          style={{
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            boxShadow: "0 10px 25px rgba(22, 163, 74, 0.3)",
          }}
        >
          Download QR
        </button>
      </div>
    </div>
  );
};

export default QRCodeCard;
