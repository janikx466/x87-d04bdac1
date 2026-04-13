import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";

const SecurityOverlay: React.FC = () => {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const show = () => setHidden(false);
    const hide = () => setHidden(true);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") show();
      else hide();
    };

    const handleBlur = () => show();
    const handleFocus = () => hide();

    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // Disable Ctrl+S, Ctrl+P, Ctrl+U, F12
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "p" || e.key === "u")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center"
      style={{ zIndex: 999999 }}
    >
      <div className="text-center animate-pulse">
        <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Security Protected</h1>
        <p className="text-white/40 text-sm">Return to continue viewing</p>
      </div>
    </div>
  );
};

export default SecurityOverlay;
