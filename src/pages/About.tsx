import React from "react";
import { Link } from "react-router-dom";
import logoSrc from "@/assets/logo.png";

const About: React.FC = () => (
  <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
    <div className="max-w-3xl mx-auto text-center">
      <Link to="/" className="text-white/50 hover:text-white text-sm">← Home</Link>
      <img src={logoSrc} alt="SecretGPV" className="w-20 h-20 mx-auto mt-6 mb-4" />
      <h1 className="text-3xl font-bold mb-4">About Secret<span className="text-green-500">GPV</span></h1>
      <p className="text-white/60 leading-relaxed mb-8">
        SecretGPV is a privacy-first photo sharing platform built for people who value their digital privacy.
        In an era where everything is tracked and stored forever, we believe you should have control
        over who sees your photos, when, and for how long.
      </p>
      <div className="grid md:grid-cols-3 gap-6 text-left">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">🔒 Zero Knowledge</h3>
          <p className="text-sm text-white/50">We can't see your photos. PINs are verified through secure endpoints.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">⚡ Edge-Powered</h3>
          <p className="text-sm text-white/50">Built on Cloudflare's global edge network for maximum speed.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">💣 Self-Destruct</h3>
          <p className="text-sm text-white/50">Vaults disappear after set conditions. No data lingers.</p>
        </div>
      </div>
    </div>
  </div>
);

export default About;
