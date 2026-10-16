import React from "react";
import FooterSection from "../common/FooterSection";

const Footer: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <footer className={`w-full max-w-lg mx-auto px-3.5 py-4 ${className}`}>
      <FooterSection />
    </footer>
  );
};

export default Footer;
