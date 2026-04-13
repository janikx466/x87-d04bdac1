import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Megaphone, X, ExternalLink } from "lucide-react";

const AnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<{ enabled: boolean; text: string; url?: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "announcement"), (snap) => {
      if (snap.exists()) {
        setAnnouncement(snap.data() as any);
        setDismissed(false);
      } else {
        setAnnouncement(null);
      }
    });
    return () => unsub();
  }, []);

  if (!announcement?.enabled || !announcement.text || dismissed) return null;

  return (
    <div className="mx-4 mt-4 p-4 rounded-2xl border border-green-500/30 bg-green-500/5 backdrop-blur-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <Megaphone className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90">{announcement.text}</p>
          {announcement.url && (
            <a
              href={announcement.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-400 hover:text-green-300 transition"
            >
              Visit Now <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <button onClick={() => setDismissed(true)} className="text-white/30 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
