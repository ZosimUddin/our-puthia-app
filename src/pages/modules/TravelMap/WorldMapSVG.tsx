import React from 'react';
import { ALL_WORLD_COUNTRIES } from '../../../data/worldCountries';

interface WorldMapSVGProps {
  selectedCountryIds: string[];
  themeColor: string;
  themeBg: string;
  themeText: string;
  showLabels: boolean;
  onCountryClick: (countryId: string) => void;
  userName?: string;
  userPhoto?: string;
}

// Projection of Lat/Lng to SVG coordinates for World Map (Width 800, Height 450)
function projectLatLng(lat: number, lng: number): { x: number; y: number } {
  const x = (lng + 180) * (800 / 360);
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = 225 - (800 * mercN) / (2 * Math.PI);
  // Clamp y to visible bounds
  const clampedY = Math.max(25, Math.min(425, y));
  return { x: Math.round(x), y: Math.round(clampedY) };
}

export const WorldMapSVG: React.FC<WorldMapSVGProps> = ({
  selectedCountryIds,
  themeColor,
  themeBg,
  themeText,
  showLabels,
  onCountryClick,
  userName,
  userPhoto
}) => {
  const selectedCount = selectedCountryIds.length;
  const percentage = Math.round((selectedCount / 194) * 100);

  return (
    <div 
      id="world-map-canvas" 
      className="relative w-full rounded-3xl p-5 border shadow-xl transition-all overflow-hidden"
      style={{ backgroundColor: themeBg, borderColor: `${themeColor}30` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 border-b pb-3" style={{ borderColor: `${themeColor}20` }}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {userPhoto ? (
            <img src={userPhoto} alt="User Avatar" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 shadow-sm shrink-0" style={{ borderColor: themeColor }} />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black text-white text-base sm:text-lg shadow-md shrink-0" style={{ backgroundColor: themeColor }}>
              {userName ? userName.charAt(0).toUpperCase() : 'আ'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-base font-black leading-snug truncate" style={{ color: themeText }}>
              {userName ? `${userName}-এর পৃথিবী` : 'আমার বিশ্ব ভ্রমণ ম্যাপ'}
            </h2>
            <p className="text-[10px] sm:text-xs font-bold opacity-75 truncate" style={{ color: themeText }}>
              আমাদের পুঠিয়া • বিশ্ব ভ্রমণ ট্র্যাকার
            </p>
          </div>
        </div>

        {/* Visited Counter Badge */}
        <div className="shrink-0 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl border shadow-xs" style={{ borderColor: `${themeColor}40` }}>
          <div className="text-right leading-none">
            <div className="text-sm sm:text-base font-black" style={{ color: themeColor }}>
              {selectedCount}<span className="text-[10px] sm:text-xs font-bold text-slate-400">/১৯৪</span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-black tracking-wide mt-0.5" style={{ color: themeText }}>
              {percentage}% ঘুরেছেন
            </div>
          </div>
        </div>
      </div>

      {/* Interactive World Map Canvas Surface */}
      <div className="relative w-full aspect-[16/9] flex items-center justify-center my-2 overflow-hidden rounded-2xl bg-white/40 border" style={{ borderColor: `${themeColor}20` }}>
        <svg 
          viewBox="0 0 800 450" 
          className="w-full h-full drop-shadow-md select-none overflow-visible"
        >
          {/* Continent Contour Guides */}
          {/* North America */}
          <path d="M 120,80 Q 200,60 280,110 L 220,200 L 150,150 Z" fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.2" />
          {/* South America */}
          <path d="M 230,220 Q 300,240 280,380 L 210,320 Z" fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.2" />
          {/* Europe */}
          <path d="M 380,80 Q 480,70 500,140 L 400,160 Z" fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.2" />
          {/* Africa */}
          <path d="M 380,170 Q 490,180 480,340 L 390,280 Z" fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.2" />
          {/* Asia */}
          <path d="M 500,80 Q 720,70 700,260 L 520,200 Z" fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.2" />
          {/* Oceania */}
          <path d="M 680,280 Q 780,290 750,380 L 670,350 Z" fill="none" stroke={themeColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.2" />

          {/* Equator & Meridian Guide Lines */}
          <line x1="0" y1="225" x2="800" y2="225" stroke={themeColor} strokeWidth="1" strokeDasharray="2 4" opacity="0.15" />
          <line x1="400" y1="0" x2="400" y2="450" stroke={themeColor} strokeWidth="1" strokeDasharray="2 4" opacity="0.15" />

          {/* Country Nodes */}
          {ALL_WORLD_COUNTRIES.map((country) => {
            const { x, y } = projectLatLng(country.lat, country.lng);
            const isSelected = selectedCountryIds.includes(country.id);

            return (
              <g 
                key={country.id}
                onClick={() => onCountryClick(country.id)}
                className="cursor-pointer group transition-all duration-200"
              >
                {/* Pulse for selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill={themeColor}
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Country Node Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "7" : "4.5"}
                  fill={isSelected ? themeColor : "#ffffff"}
                  stroke={isSelected ? "#ffffff" : themeColor}
                  strokeWidth={isSelected ? "2" : "1"}
                  className="transition-all duration-200 group-hover:scale-150"
                  style={{
                    filter: isSelected ? `drop-shadow(0px 2px 4px ${themeColor}80)` : 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))'
                  }}
                />

                {/* Label */}
                {showLabels && (
                  <text
                    x={x}
                    y={y + (isSelected ? 16 : 13)}
                    textAnchor="middle"
                    fill={isSelected ? themeColor : themeText}
                    fontSize={isSelected ? "8" : "6.5"}
                    fontWeight={isSelected ? "900" : "600"}
                    className="pointer-events-none transition-all drop-shadow-xs"
                  >
                    {country.nameBn}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Branding */}
      <div className="mt-2 pt-3 border-t flex items-center justify-between text-[11px] font-bold opacity-80" style={{ borderColor: `${themeColor}20`, color: themeText }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></span>
          <span>{selectedCount === 194 ? '🏆 অসাধারণ! সমগ্র পৃথিবী ভ্রমণ করা সম্পন্ন!' : `বিশ্ব ভ্রমণের আরও ${194 - selectedCount}টি দেশ বাকি রয়েছে`}</span>
        </div>
        <div className="font-black">
          ঘুরতে থাকুন বিশ্বস্ততার সাথে • আমাদের পুঠিয়া
        </div>
      </div>
    </div>
  );
};
