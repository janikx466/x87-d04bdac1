import React from "react";

interface OrbitalLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

const OrbitalLoader: React.FC<OrbitalLoaderProps> = ({ text = "Loading...", fullScreen = true }) => {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "fixed inset-0 z-[9999] bg-[#1a1e23]" : "w-full py-20"}`}
    >
      <div className="relative w-[200px] h-[200px] flex items-center justify-center">
        {/* Ring 1 - Green */}
        <div
          className="absolute w-[120px] h-[120px] rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "#00ffcc",
            borderTopWidth: "3px",
            animation: "orbitalRotate1 2s linear infinite",
          }}
        />
        {/* Ring 2 - Purple/Pink */}
        <div
          className="absolute w-[140px] h-[140px] rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: "#ff00ff",
            borderBottomWidth: "3px",
            animation: "orbitalRotate2 2s linear infinite",
          }}
        />
        {/* Ring 3 - Blue */}
        <div
          className="absolute w-[160px] h-[160px] rounded-full border-2 border-transparent"
          style={{
            borderRightColor: "#00ccff",
            borderRightWidth: "3px",
            animation: "orbitalRotate3 2s linear infinite",
          }}
        />
        <span
          className="text-white text-sm tracking-wider"
          style={{ animation: "orbitalPulse 1.5s infinite ease-in-out" }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

export default OrbitalLoader;
