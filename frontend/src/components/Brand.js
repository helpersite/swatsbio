import React from "react";
import { Link } from "react-router-dom";

export const Brand = ({ size = 22, showIcon = false, className = "" }) => (
  <div className={`flex items-center gap-2 group select-none ${className}`} data-testid="navbar-brand-logo">
    <span className="font-display font-black text-white tracking-tight leading-none" style={{ fontSize: size }}>
      feds<span className="text-[#5B8DB8] transition-all group-hover:text-[#89B4FA]" style={{ textShadow: "0 0 14px rgba(91,141,184,0.6)" }}>.lol</span>
    </span>
  </div>
);

export default Brand;
