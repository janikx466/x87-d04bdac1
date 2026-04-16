import React from "react";
import { Link } from "react-router-dom";

const Terms: React.FC = () => (
  <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
    <div className="max-w-3xl mx-auto">
      <Link to="/dashboard" className="text-white/50 hover:text-white text-sm">← Back Dashboard</Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">Terms & Conditions</h1>
      <div className="space-y-4 text-white/70 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
        <p>By using SecretGPV, you agree to these terms. If you disagree, do not use our service.</p>
        <h2 className="text-lg font-semibold text-white">2. Service Description</h2>
        <p>SecretGPV provides a private photo sharing platform where users can create PIN-protected vaults with view limits and expiry settings.</p>
        <h2 className="text-lg font-semibold text-white">3. User Responsibilities</h2>
        <p>You are responsible for all content uploaded to your vaults. You must not upload illegal, harmful, or unauthorized content. Abuse of the free trial system will result in account suspension.</p>
        <h2 className="text-lg font-semibold text-white">4. Credits & Payments</h2>
        <p>Credits are non-refundable. Free trial credits are limited to one per device. Redeem codes are subject to usage limits and expiration dates.</p>
        <h2 className="text-lg font-semibold text-white">5. Limitation of Liability</h2>
        <p>SecretGPV is provided "as is" without warranties. We are not liable for data loss due to vault expiry or self-destruction features working as intended.</p>
        <h2 className="text-lg font-semibold text-white">6. Contact</h2>
        <p>Questions? Contact us at secretgpv@gmail.com</p>
      </div>
    </div>
  </div>
);

export default Terms;
