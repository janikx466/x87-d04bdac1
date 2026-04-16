import React from "react";
import { Link } from "react-router-dom";

const Privacy: React.FC = () => (
  <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
    <div className="max-w-3xl mx-auto">
      <Link to="/dashboard" className="text-white/50 hover:text-white text-sm">← Back Dashboard</Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-white/70 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
        <p>We collect minimal information necessary to provide our services: your Google account email, display name, and profile photo when you sign in. We also collect device fingerprints for abuse prevention.</p>
        <h2 className="text-lg font-semibold text-white">2. How We Use Your Information</h2>
        <p>Your information is used solely to provide the SecretGPV service, prevent abuse, and improve user experience. We do not sell your data to third parties.</p>
        <h2 className="text-lg font-semibold text-white">3. Data Storage</h2>
        <p>Photos uploaded to vaults are stored on Cloudflare R2 infrastructure with encryption. Vault data is stored in Firebase Firestore with strict security rules.</p>
        <h2 className="text-lg font-semibold text-white">4. Data Deletion</h2>
        <p>Vaults are automatically deleted upon expiry or when self-destruct conditions are met. You can request complete account deletion by contacting us.</p>
        <h2 className="text-lg font-semibold text-white">5. Contact</h2>
        <p>For privacy inquiries, contact us at secretgpv@gmail.com</p>
      </div>
    </div>
  </div>
);

export default Privacy;
