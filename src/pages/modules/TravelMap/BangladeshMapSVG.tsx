import React from 'react';
import { ALL_DISTRICTS } from '../../../data/bangladeshDistricts';

interface BangladeshMapSVGProps {
  selectedDistrictIds: string[];
  themeColor: string;
  themeBg: string;
  themeText: string;
  showLabels: boolean;
  onDistrictClick: (districtId: string) => void;
  userName?: string;
  userPhoto?: string;
}

// Approximate SVG grid projection for 64 Districts in Bangladesh (Bounds: Lat 20.5-26.6, Lng 88.0-92.6)
const mapDistrictCoords: Record<string, { x: number; y: number; path?: string }> = {
  // Dhaka Division
  dhaka: { x: 230, y: 280 },
  gazipur: { x: 235, y: 250 },
  kishoreganj: { x: 285, y: 210 },
  gopalganj: { x: 190, y: 360 },
  tangail: { x: 200, y: 230 },
  narayanganj: { x: 245, y: 295 },
  narsingdi: { x: 260, y: 265 },
  faridpur: { x: 180, y: 310 },
  madaripur: { x: 210, y: 345 },
  manikganj: { x: 195, y: 275 },
  munshiganj: { x: 235, y: 315 },
  rajbari: { x: 160, y: 290 },
  shariatpur: { x: 225, y: 340 },

  // Chattogram Division
  chattogram: { x: 360, y: 390 },
  coxsbazar: { x: 385, y: 480 },
  cumilla: { x: 295, y: 310 },
  khagrachhari: { x: 380, y: 320 },
  chandpur: { x: 260, y: 345 },
  noakhali: { x: 290, y: 380 },
  feni: { x: 310, y: 355 },
  bandarban: { x: 410, y: 410 },
  brahmanbaria: { x: 285, y: 260 },
  rangamati: { x: 400, y: 350 },
  lakshmipur: { x: 265, y: 380 },

  // Sylhet Division
  sylhet: { x: 350, y: 150 },
  moulvibazar: { x: 350, y: 200 },
  sunamganj: { x: 300, y: 135 },
  habiganj: { x: 315, y: 215 },

  // Barishal Division
  barishal: { x: 210, y: 400 },
  jhalokati: { x: 195, y: 415 },
  patuakhali: { x: 215, y: 450 },
  pirojpur: { x: 175, y: 415 },
  barguna: { x: 195, y: 480 },
  bhola: { x: 245, y: 430 },

  // Khulna Division
  khulna: { x: 150, y: 400 },
  kushtia: { x: 110, y: 270 },
  chuadanga: { x: 90, y: 300 },
  jhenaidah: { x: 110, y: 315 },
  narail: { x: 140, y: 360 },
  bagerhat: { x: 180, y: 435 },
  magura: { x: 135, y: 320 },
  meherpur: { x: 75, y: 285 },
  jashore: { x: 105, y: 355 },
  satkhira: { x: 110, y: 420 },

  // Rajshahi Division
  rajshahi: { x: 80, y: 210 },
  chapainawabganj: { x: 40, y: 180 },
  jaipurhat: { x: 120, y: 110 },
  naogaon: { x: 105, y: 150 },
  natore: { x: 115, y: 210 },
  pabna: { x: 140, y: 250 },
  bogura: { x: 155, y: 155 },
  sirajganj: { x: 175, y: 200 },

  // Rangpur Division
  rangpur: { x: 125, y: 75 },
  kurigram: { x: 165, y: 70 },
  gaibandha: { x: 160, y: 115 },
  thakurgaon: { x: 60, y: 40 },
  dinajpur: { x: 80, y: 75 },
  nilphamari: { x: 90, y: 40 },
  panchagarh: { x: 45, y: 15 },
  lalmonirhat: { x: 140, y: 50 },

  // Mymensingh Division
  mymensingh: { x: 235, y: 185 },
  jamalpur: { x: 185, y: 155 },
  netrokona: { x: 270, y: 160 },
  sherpur: { x: 200, y: 135 }
};

export const BangladeshMapSVG: React.FC<BangladeshMapSVGProps> = ({
  selectedDistrictIds,
  themeColor,
  themeBg,
  themeText,
  showLabels,
  onDistrictClick,
  userName,
  userPhoto
}) => {
  const selectedCount = selectedDistrictIds.length;
  const percentage = Math.round((selectedCount / 64) * 100);

  return (
    <div 
      id="bangladesh-map-canvas" 
      className="relative w-full rounded-3xl p-5 border shadow-xl transition-all overflow-hidden"
      style={{ backgroundColor: themeBg, borderColor: `${themeColor}30` }}
    >
      {/* Map Card Header */}
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
              {userName ? `${userName}-এর ভ্রমণ ম্যাপ` : 'আমার বাংলাদেশ ভ্রমণ ম্যাপ'}
            </h2>
            <p className="text-[10px] sm:text-xs font-bold opacity-75 truncate" style={{ color: themeText }}>
              আমাদের পুঠিয়া • বাংলাদেশ ভ্রমণ ট্র্যাকার
            </p>
          </div>
        </div>

        {/* Visited Counter Badge */}
        <div className="shrink-0 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl border shadow-xs" style={{ borderColor: `${themeColor}40` }}>
          <div className="text-right leading-none">
            <div className="text-sm sm:text-base font-black" style={{ color: themeColor }}>
              {selectedCount}<span className="text-[10px] sm:text-xs font-bold text-slate-400">/৬৪</span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-black tracking-wide mt-0.5" style={{ color: themeText }}>
              {percentage}% ঘুরেছেন
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Visual Surface */}
      <div className="relative w-full aspect-[4/5] flex items-center justify-center my-2">
        <svg 
          viewBox="0 0 460 520" 
          className="w-full h-full max-h-[460px] drop-shadow-md select-none overflow-visible"
        >
          {/* Outer Bangladesh Geographic Contour Outline */}
          <path
            d="M 45,15 Q 120,10 170,55 Q 260,110 380,130 Q 420,300 410,420 Q 380,500 240,490 Q 150,450 100,420 Q 40,280 40,180 Z"
            fill="none"
            stroke={themeColor}
            strokeWidth="3"
            strokeDasharray="4 4"
            opacity="0.25"
          />

          {/* Division Connecting Lines for Visual Aesthetic */}
          <g stroke={themeColor} strokeWidth="1" strokeOpacity="0.15">
            <line x1="230" y1="280" x2="360" y2="390" />
            <line x1="230" y1="280" x2="350" y2="150" />
            <line x1="230" y1="280" x2="210" y2="400" />
            <line x1="230" y1="280" x2="150" y2="400" />
            <line x1="230" y1="280" x2="80" y2="210" />
            <line x1="125" y1="75" x2="80" y2="210" />
            <line x1="235" y1="185" x2="230" y2="280" />
          </g>

          {/* District Nodes */}
          {ALL_DISTRICTS.map((dist) => {
            const coords = mapDistrictCoords[dist.id] || { x: 230, y: 260 };
            const isSelected = selectedDistrictIds.includes(dist.id);

            return (
              <g 
                key={dist.id} 
                onClick={() => onDistrictClick(dist.id)} 
                className="cursor-pointer group transition-all duration-300"
              >
                {/* Pulse Ring for Selected Districts */}
                {isSelected && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="18"
                    fill={themeColor}
                    opacity="0.2"
                    className="animate-ping"
                  />
                )}

                {/* Main Interactive Circle */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? "14" : "10"}
                  fill={isSelected ? themeColor : "#ffffff"}
                  stroke={isSelected ? "#ffffff" : themeColor}
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                  className="transition-all duration-200 group-hover:scale-125"
                  style={{
                    filter: isSelected ? `drop-shadow(0px 3px 6px ${themeColor}80)` : 'drop-shadow(0px 1px 3px rgba(0,0,0,0.1))'
                  }}
                />

                {/* Inner Icon check for selected */}
                {isSelected && (
                  <text
                    x={coords.x}
                    y={coords.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    ✓
                  </text>
                )}

                {/* District Label Tag */}
                {showLabels && (
                  <text
                    x={coords.x}
                    y={coords.y + (isSelected ? 26 : 22)}
                    textAnchor="middle"
                    fill={isSelected ? themeColor : themeText}
                    fontSize={isSelected ? "10" : "8.5"}
                    fontWeight={isSelected ? "900" : "600"}
                    className="pointer-events-none transition-all drop-shadow-xs"
                  >
                    {dist.nameBn}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Map Card Footer Branding */}
      <div className="mt-2 pt-3 border-t flex items-center justify-between text-[11px] font-bold opacity-80" style={{ borderColor: `${themeColor}20`, color: themeText }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></span>
          <span>{selectedCount === 64 ? '🏆 অভিনন্দন! পুরো বাংলাদেশ ভ্রমণ করা সম্পন্ন!' : `আপনার আরও ${64 - selectedCount}টি জেলা ভ্রমণ বাকি রয়েছে`}</span>
        </div>
        <div className="font-black">
          ঘুরতে থাকুন বাংলাদেশ • আমাদের পুঠিয়া
        </div>
      </div>
    </div>
  );
};
