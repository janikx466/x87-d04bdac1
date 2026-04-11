import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Zap, QrCode, Gift } from "lucide-react";
import logoSrc from "@/assets/logo.png";

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSrc} alt="SecretGPV" className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight">
            Secret<span className="text-green-500">GPV</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="#features" className="hover:text-white transition">Features</a>
          <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
          <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
          <Link to="/terms" className="hover:text-white transition">Terms</Link>
          <Link to="/about" className="hover:text-white transition">About</Link>
          <Link to="/contact" className="hover:text-white transition">Contact</Link>
        </div>
        <Link
          to="/auth"
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center py-24 px-6 max-w-4xl mx-auto">
        <div className="mb-4 px-3 py-1 rounded-full text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20">
          🔒 End-to-End Privacy
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
          Your Photos. Your Rules.
          <br />
          <span className="text-green-500">Absolutely Private.</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mb-10">
          SecretGPV is the most secure way to share private photos. PIN-protected vaults,
          self-destructing links, view limits, and zero-knowledge architecture.
        </p>
        <Link
          to="/auth"
          className="px-8 py-4 rounded-2xl text-lg font-bold text-white animate-pulse transition hover:scale-105"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 10px 40px rgba(22,163,74,0.4)" }}
        >
          🚀 Get Started — It's Free
        </Link>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why <span className="text-green-500">SecretGPV</span>?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Lock className="w-8 h-8 text-green-500" />, title: "PIN-Protected Vaults", desc: "Every vault is secured with a unique PIN. Only those with the code can view." },
            { icon: <Eye className="w-8 h-8 text-green-500" />, title: "View Limits", desc: "Set how many times a vault can be viewed. After that, it's gone forever." },
            { icon: <Shield className="w-8 h-8 text-green-500" />, title: "Self-Destruct", desc: "Vaults can auto-delete after viewing. No traces left behind." },
            { icon: <QrCode className="w-8 h-8 text-green-500" />, title: "QR Code Sharing", desc: "Generate beautiful branded QR codes for easy, elegant sharing." },
            { icon: <Zap className="w-8 h-8 text-green-500" />, title: "Lightning Fast", desc: "Built on Cloudflare's edge network for sub-100ms response times." },
            { icon: <Gift className="w-8 h-8 text-green-500" />, title: "Referral Rewards", desc: "Invite friends and earn credits. Share the privacy revolution." },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/30 transition">
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 px-6 text-center border-t border-white/10">
        <p className="text-white/40 text-sm">
          Trusted by privacy-conscious users worldwide. Zero-knowledge. Zero compromise.
        </p>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10 text-center text-white/40 text-sm">
        <p>© {new Date().getFullYear()} SecretGPV. All rights reserved.</p>
        <p className="mt-1">Contact: secretgpv.@gmail.com</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
          <Link to="/terms" className="hover:text-white transition">Terms</Link>
          <Link to="/about" className="hover:text-white transition">About</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
