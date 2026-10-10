import React from "react";

export interface FacebookBadgeIconProps {
  size?: number;
  className?: string;
  colorScheme?: "emerald" | "blue" | "gold";
}

export const FacebookBadgeIcon: React.FC<FacebookBadgeIconProps> = ({
  size = 15,
  className = "",
  colorScheme = "emerald"
}) => {
  const fillColor = colorScheme === "blue" ? "#1877F2" : colorScheme === "gold" ? "#D97706" : "#006A4E";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle select-none ${className}`}
    >
      <path
        d="M10.29 2.3a1.93 1.93 0 0 1 3.42 0l.61 1.06a1.93 1.93 0 0 0 1.91.95l1.22-.16a1.93 1.93 0 0 1 2.15 2.15l-.16 1.22a1.93 1.93 0 0 0 .95 1.91l1.06.61a1.93 1.93 0 0 1 0 3.42l-1.06.61a1.93 1.93 0 0 0-.95 1.91l.16 1.22a1.93 1.93 0 0 1-2.15 2.15l-1.22-.16a1.93 1.93 0 0 0-1.91.95l-.61 1.06a1.93 1.93 0 0 1-3.42 0l-.61-1.06a1.93 1.93 0 0 0-1.91-.95l-1.22.16a1.93 1.93 0 0 1-2.15-2.15l.16-1.22a1.93 1.93 0 0 0-.95-1.91l-1.06-.61a1.93 1.93 0 0 1 0-3.42l1.06-.61a1.93 1.93 0 0 0 .95-1.91l-.16-1.22a1.93 1.93 0 0 1 2.15-2.15l1.22.16a1.93 1.93 0 0 0 1.91-.95l.61-1.06z"
        fill={fillColor}
      />
      <path
        d="M8.5 12.2l2.3 2.3 4.8-4.8"
        stroke="#FFFFFF"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default FacebookBadgeIcon;
