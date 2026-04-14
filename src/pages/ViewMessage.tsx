import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";
import { Lock, MessageSquare } from "lucide-react";
import logoSrc from "@/assets/logo.png";

function getExpiryDate(expiry: any): Date | null {
  if (!expiry) return null;
  if (expiry.toDate) return expiry.toDate();
  if (expiry.seconds) return new Date(expiry.seconds * 1000);
  if (typeof expiry === "string") return new Date(expiry);
  return null;
}

const ViewMessage: React.FC = () => {
  const { messageId } = useParams<{ messageId: string }>();
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [revealedMessage, setRevealedMessage] = useState<string | null>(null);
  const [copyAllowed, setCopyAllowed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!revealed && !verifying && !statusMessage && pinInputRef.current) {
      setTimeout(() => pinInputRef.current?.focus(), 300);
    }
  }, [revealed, verifying, statusMessage]);

  // Prevent copy if not allowed
  useEffect(() => {
    if (revealed && !copyAllowed) {
      const prevent = (e: Event) => e.preventDefault();
      document.addEventListener("copy", prevent);
      document.addEventListener("cut", prevent);
      document.addEventListener("selectstart", prevent);
      return () => {
        document.removeEventListener("copy", prevent);
        document.removeEventListener("cut", prevent);
        document.removeEventListener("selectstart", prevent);
      };
    }
  }, [revealed, copyAllowed]);

  const handleVerify = async () => {
    if (!pin || !messageId) return toast.error("Enter a valid PIN");
    setVerifying(true);
    try {
      const msgRef = doc(db, "messages", messageId);
      const snap = await getDoc(msgRef);

      if (!snap.exists()) {
        setStatusMessage("Message was Deleted");
        return;
      }

      const data = snap.data();

      // Check isDeleted flag
      if (data.isDeleted) {
        setStatusMessage("Message was Deleted");
        return;
      }

      // Check status
      if (data.status === "stopped") {
        setStatusMessage("Message Temporarily Blocked");
        return;
      }

      // Check expiry
      const expiry = getExpiryDate(data.expiry);
      if (expiry && new Date() > expiry) {
        setStatusMessage("Message Expired");
        return;
      }

      // Check view limit
      if (data.viewCount >= data.viewLimit) {
        setStatusMessage(data.selfDestruct ? "Message Destroyed 💣" : "View limit reached");
        return;
      }

      // Check PIN
      if (String(data.pin) !== String(pin)) {
        toast.error("Wrong PIN");
        return;
      }

      // Increment view count
      await updateDoc(msgRef, { viewCount: increment(1) });

      setCopyAllowed(data.copyAllowed !== false ? true : false);
      setRevealedMessage(data.message);
      setRevealed(true);
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (statusMessage) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
        <div className="text-center">
          <img src={logoSrc} alt="SecretGPV" className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-white mb-2">{statusMessage}</h1>
          <p className="text-white/40 text-sm">This message is no longer accessible.</p>
        </div>
      </div>
    );
  }

  if (verifying) return <OrbitalLoader text="Verifying PIN..." />;

  if (revealed && revealedMessage) {
    return (
      <div
        className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4"
        onContextMenu={!copyAllowed ? (e) => e.preventDefault() : undefined}
      >
        <div
          className="w-full max-w-md p-8 rounded-3xl text-center text-white animate-fade-in"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <MessageSquare className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-4">🔓 Secret Message</h2>
          <div
            className="p-4 rounded-xl bg-white/5 border border-white/10 text-left text-white/90 text-sm leading-relaxed whitespace-pre-wrap break-all mb-4"
            style={!copyAllowed ? { userSelect: "none", WebkitUserSelect: "none" } : {}}
          >
            {revealedMessage}
          </div>
          <p className="text-xs text-red-400/70 animate-pulse">
            ⚠️ This message will disappear after you read it
          </p>
          <p className="text-xs text-white/20 mt-4">Powered by SecretGPV</p>
        </div>
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
        <h1 className="text-xl font-bold mb-1">Secret Message</h1>
        <p className="text-white/50 text-sm mb-2">Someone sent you a private message… it may disappear after you read it 🔒</p>
        <p className="text-white/40 text-xs mb-6">Enter PIN to reveal</p>
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
          Reveal Message
        </button>
      </div>
    </div>
  );
};

export default ViewMessage;