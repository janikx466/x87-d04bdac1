import React from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const Contact: React.FC = () => (
  <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
    <div className="max-w-lg mx-auto text-center">
      <Link to="/" className="text-white/50 hover:text-white text-sm">← Home</Link>
      <h1 className="text-3xl font-bold mt-6 mb-4">Contact Us</h1>
      <p className="text-white/50 mb-8">Have questions or need support? Reach out to us.</p>
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
        <Mail className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Email Us</h2>
        <a href="mailto:secretgpv.@gmail.com" className="text-green-400 hover:text-green-300 transition">
          secretgpv.@gmail.com
        </a>
        <p className="text-xs text-white/40 mt-4">We typically respond within 24 hours</p>
      </div>
    </div>
  </div>
);

export default Contact;
