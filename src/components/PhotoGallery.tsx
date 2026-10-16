
import { Image as ImageIcon, ChevronRight } from 'lucide-react';

const PHOTOS = [
  '/logo.svg', 
  '/logo.svg', 
  '/logo.svg', 
  '/logo.svg', 
];

export default function PhotoGallery() {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <ImageIcon size={16} className="text-green-700" /> ফটো গ্যালারি
        </h3>
        <a href="#" className="text-[11px] text-green-700 font-semibold flex items-center gap-1">
          সব দেখুন <ChevronRight size={12} />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PHOTOS.map((photo, i) => (
          <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <img src={photo} alt="Gallery" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
