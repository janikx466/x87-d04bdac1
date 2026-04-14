import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import logoSrc from "@/assets/logo.png";

const CustomPlanOrder: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(userData?.displayName || "");
  const [company, setCompany] = useState("");
  const [credits, setCredits] = useState("");
  const [email, setEmail] = useState(userData?.email || "");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleOrder = () => {
    const subject = encodeURIComponent(`Custom Plan Application - ${name}`);
    const body = encodeURIComponent(
      `*Custom Plan Application*\n\nFull Name: ${name}\nCompany: ${company}\nCredits Required: ${credits}\nGmail: ${email}\nUser UID: ${userData?.numericUid || "N/A"}\nDescription: ${description}\n\nPowered by SecretGPV`
    );
    window.open(`mailto:secretgpv@gmail.com?subject=${subject}&body=${body}`, "_self");

    // Show success after delay
    setTimeout(() => {
      setSubmitted(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    }, 18000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
          <p className="text-white/50 text-sm">Our team will contact you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate("/pricing")} className="text-white/50 hover:text-white text-sm mb-6">← Back to Plans</button>

        <div className="flex items-center gap-3 mb-6">
          <img src={logoSrc} alt="" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">Custom Plan</h1>
        </div>

        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-200">Kindly enable Gmail notifications to receive response from SecretGPV</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Company Name</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Credits Required</label>
            <input type="number" value={credits} onChange={(e) => setCredits(e.target.value)} placeholder="e.g. 5000" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Gmail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@gmail.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about your needs..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none text-sm resize-none" />
          </div>
        </div>

        <button
          onClick={handleOrder}
          disabled={!name || !credits || !email}
          className="w-full mt-6 py-3.5 rounded-xl font-bold text-white transition hover:scale-[1.01] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 10px 30px rgba(22,163,74,0.3)" }}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Order Now
        </button>
      </div>
    </div>
  );
};

export default CustomPlanOrder;