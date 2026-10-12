import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Share2, Sparkles, Image as ImageIcon, 
  RefreshCw, Type, Calendar, User, Newspaper, Check, Tag,
  Zap, Save, Eye, FileText, Layers, Palette, Share
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/home/Header';
import Footer from '../../components/home/Footer';
import BottomNavigation from '../../components/home/BottomNavigation';
import { Sidebar } from '../../components/Sidebar';
import { toast } from 'sonner';

// Convert numbers to Bengali digits
const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
};

// Bengali date formatter
const getBengaliFormattedDate = (dateObj: Date = new Date()) => {
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const day = toBengaliNumber(dateObj.getDate());
  const month = months[dateObj.getMonth()];
  const year = toBengaliNumber(dateObj.getFullYear());
  const hours = dateObj.getHours();
  const minutes = toBengaliNumber(dateObj.getMinutes().toString().padStart(2, '0'));
  const ampm = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  const hour12 = toBengaliNumber(hours % 12 || 12);

  return `${day} ${month} ${year} | ${hour12}:${minutes} ${ampm}`;
};

type CardTemplate = 'red_corner' | 'classic_news' | 'breaking_red' | 'puthia_branded' | 'modern_dark' | 'paper_poster';

export const NewsCardGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form states
  const [template, setTemplate] = useState<CardTemplate>('red_corner');
  const [category, setCategory] = useState('বিশেষ সংবাদ');
  const [headline, setHeadline] = useState('আমাদের পুঠিয়ায় শুভ উদ্বোধন হতে যাচ্ছে বিশেষ নিউজ কার্ড জেনারেটর সিস্টেম');
  const [subHeadline, setSubHeadline] = useState('এখন থেকে যে কোনো সংবাদের প্রফেশনাল মিডিয়া ফটোকার্ড এক ক্লিকেই তৈরি ও এইচডি ডাউনলোড করা যাবে।');
  const [reporter, setReporter] = useState('আমাদের পুঠিয়া ডেস্ক');
  const [dateText, setDateText] = useState(getBengaliFormattedDate());
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop');
  const [watermark, setWatermark] = useState('আমাদের পুঠিয়া • সত্য প্রকাশে আপসহীন');
  const [showWatermark, setShowWatermark] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9'>('1:1');

  // App Notices / News list for import
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState('');

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Load recent notices for 1-click import
  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoadingNotices(true);
      try {
        const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(10));
        const snap = await getDocs(q);
        const docsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentNotices(docsData);
      } catch (err) {
        console.error('Failed to load notices for news card:', err);
      } finally {
        setIsLoadingNotices(false);
      }
    };
    fetchNotices();
  }, []);

  // Handle notice import selection
  const handleImportNotice = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedNoticeId(id);
    if (!id) return;
    
    const item = recentNotices.find(n => n.id === id);
    if (item) {
      if (item.title || item.text) setHeadline(item.title || item.text);
      if (item.content || item.description) setSubHeadline(item.content || item.description);
      if (item.category) setCategory(item.category);
      if (item.image && item.image.startsWith('http')) setImageUrl(item.image);
      if (item.publisher || item.author) setReporter(item.publisher || item.author);
      toast.success('নোটিশের তথ্য নিউজ কার্ডে ইমপোর্ট হয়েছে!');
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error('ছবি ফাইল ৮ MB-এর কম হতে হবে।');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          toast.success('ছবি আপলোড সম্পন্ন হয়েছে');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw HD canvas news card
  const renderCanvasCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = aspectRatio === '16:9' ? 675 : 1200;

    canvas.width = width;
    canvas.height = height;

    setIsRendering(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    const drawContent = () => {
      // 1. Draw Background
      if (template === 'modern_dark') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      } else if (template === 'paper_poster') {
        ctx.fillStyle = '#fbf9f5';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Main Image Area Layout
      let imgY = 0;
      let imgH = height * 0.55;

      if (template === 'red_corner' || template === 'breaking_red') {
        imgY = 80;
        imgH = height * 0.52;
      } else if (template === 'puthia_branded') {
        imgY = 120;
        imgH = height * 0.50;
      } else if (template === 'classic_news') {
        imgY = 140;
        imgH = height * 0.48;
      }

      // Draw Main Image
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        if (template === 'paper_poster') {
          ctx.rect(40, imgY, width - 80, imgH);
        } else {
          ctx.rect(0, imgY, width, imgH);
        }
        ctx.clip();

        // Object cover draw logic
        const scale = Math.max(width / img.naturalWidth, imgH / img.naturalHeight);
        const x = (width - img.naturalWidth * scale) / 2;
        const y = imgY + (imgH - img.naturalHeight * scale) / 2;
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
        ctx.restore();
      } else {
        // Fallback image gradient pattern
        const grad = ctx.createLinearGradient(0, imgY, width, imgY + imgH);
        grad.addColorStop(0, '#01412F');
        grad.addColorStop(1, '#009664');
        ctx.fillStyle = grad;
        ctx.fillRect(0, imgY, width, imgH);
      }

      // Dark Overlay on bottom of image for contrast
      const imgGradient = ctx.createLinearGradient(0, imgY + imgH - 180, 0, imgY + imgH);
      imgGradient.addColorStop(0, 'rgba(0,0,0,0)');
      imgGradient.addColorStop(1, template === 'modern_dark' ? 'rgba(15,23,42,0.95)' : 'rgba(0,0,0,0.7)');
      ctx.fillStyle = imgGradient;
      ctx.fillRect(0, imgY + imgH - 180, width, 180);

      // 3. Header Styling based on Template
      if (template === 'red_corner') {
        // Top Red Header Bar
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, width, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Hind Siliguri", "SolaimanLipi", sans-serif';
        ctx.fillText('আমাদের পুঠিয়া • ফটোকার্ড', 40, 52);

        // Date text on top right
        ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 52);
        ctx.textAlign = 'left';

      } else if (template === 'breaking_red') {
        // Breaking News Top Bar
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(0, 0, width, 80);

        ctx.fillStyle = '#fef08a';
        ctx.font = '900 38px "Hind Siliguri", sans-serif';
        ctx.fillText('🚨 ব্রেকিং নিউজ', 40, 54);

        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 52);
        ctx.textAlign = 'left';

      } else if (template === 'puthia_branded') {
        // Puthia Branded Header
        const headerGrad = ctx.createLinearGradient(0, 0, width, 0);
        headerGrad.addColorStop(0, '#01412F');
        headerGrad.addColorStop(1, '#009664');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, width, 120);

        // App Logo Circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(80, 60, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#009664';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('P', 80, 75);
        ctx.textAlign = 'left';

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 40px "Hind Siliguri", sans-serif';
        ctx.fillText('আমাদের পুঠিয়া', 145, 62);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
        ctx.fillText('উপজেলার প্রথম ডিজিটাল তথ্য ও সংবাদ নেটওয়ার্ক', 145, 92);

        // Date Right
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 68);
        ctx.textAlign = 'left';

      } else if (template === 'classic_news') {
        // Newspaper Masthead
        ctx.fillStyle = '#1e293b';
        ctx.font = '900 48px "SolaimanLipi", "Hind Siliguri", serif';
        ctx.textAlign = 'center';
        ctx.fillText('দৈনিক আমাদের পুঠিয়া', width / 2, 65);

        ctx.fillStyle = '#64748b';
        ctx.font = '22px "Hind Siliguri", sans-serif';
        ctx.fillText(`স্মার্ট রাজশাহী ও পুঠিয়ার মুখপত্র | ${dateText}`, width / 2, 105);
        ctx.textAlign = 'left';

        // Double lines below masthead
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(40, 120);
        ctx.lineTo(width - 40, 120);
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 126);
        ctx.lineTo(width - 40, 126);
        ctx.stroke();

      } else if (template === 'modern_dark') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 36px "Hind Siliguri", sans-serif';
        ctx.fillText('OUR PUTHIA MEDIA', 40, 50);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '22px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 50);
        ctx.textAlign = 'left';
      }

      // 4. Category Badge Floating over image or card
      const badgeY = imgY + imgH - 30;
      ctx.save();
      ctx.fillStyle = template === 'breaking_red' ? '#dc2626' : '#009664';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 10;
      
      // Rounded rect for category badge
      const badgeWidth = ctx.measureText(category).width + 50;
      const bx = 40;
      const by = badgeY - 25;
      const bw = Math.max(160, badgeWidth);
      const bh = 50;
      const br = 12;

      ctx.beginPath();
      ctx.moveTo(bx + br, by);
      ctx.lineTo(bx + bw - br, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br);
      ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Category Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
      ctx.fillText(category, 65, badgeY + 8);

      // Reporter tag on right side of image
      if (reporter) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`— ${reporter}`, width - 40, imgY + imgH - 15);
        ctx.textAlign = 'left';
      }

      // 5. Headline Section
      const contentStartY = imgY + imgH + 50;
      let textColor = '#0f172a';
      if (template === 'modern_dark') textColor = '#f8fafc';
      if (template === 'paper_poster') textColor = '#1a1a1a';

      ctx.fillStyle = textColor;
      ctx.font = '900 48px "Hind Siliguri", "SolaimanLipi", sans-serif';

      // Wrap headline text logic
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
      };

      const nextY = wrapText(headline, 40, contentStartY, width - 80, 62);

      // 6. Sub-headline / Detail Text
      if (subHeadline) {
        ctx.fillStyle = template === 'modern_dark' ? '#cbd5e1' : '#475569';
        ctx.font = '28px "Hind Siliguri", sans-serif';
        wrapText(subHeadline, 40, nextY + 15, width - 80, 42);
      }

      // 7. Bottom Branding / Watermark Bar
      if (showWatermark) {
        const footerY = height - 70;
        ctx.strokeStyle = template === 'modern_dark' ? '#334155' : '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, footerY - 20);
        ctx.lineTo(width - 40, footerY - 20);
        ctx.stroke();

        ctx.fillStyle = '#009664';
        ctx.font = '900 28px "Hind Siliguri", sans-serif';
        ctx.fillText('আমাদের পুঠিয়া', 40, footerY + 20);

        ctx.fillStyle = template === 'modern_dark' ? '#94a3b8' : '#64748b';
        ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(watermark, width - 40, footerY + 20);
        ctx.textAlign = 'left';
      }

      setIsRendering(false);
    };

    img.onload = drawContent;
    img.onerror = () => {
      drawContent();
    };

    if (img.complete) {
      drawContent();
    }
  };

  // Re-render canvas whenever relevant controls change
  useEffect(() => {
    const timer = setTimeout(() => {
      renderCanvasCard();
    }, 150);
    return () => clearTimeout(timer);
  }, [template, category, headline, subHeadline, reporter, dateText, imageUrl, watermark, showWatermark, aspectRatio]);

  // Download HD PNG Image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `Puthia_NewsCard_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('নিউজ কার্ড এইচডি ইমেজ হিসেবে ডাউনলোড হয়েছে!');
    } catch (err) {
      toast.error('ডাউনলোড করতে সমস্যা হয়েছে।');
      console.error(err);
    }
  };

  // Share Card
  const handleShareCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'puthia-news-card.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: headline,
            text: `${headline}\n— আমাদের পুঠিয়া ফটোকার্ড`,
          });
          toast.success('ফটোকার্ড শেয়ার করা হয়েছে!');
        } else {
          handleDownloadImage();
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      handleDownloadImage();
    }
  };

  // Save Card to Firestore Gallery
  const handleSaveToGallery = async () => {
    if (!user) {
      toast.error('ফটোকার্ড সেভ করতে প্রথমে লগইন করুন');
      navigate('/login');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png', 0.85);
      await addDoc(collection(db, 'photo_cards'), {
        userId: user.uid,
        userName: user.displayName || 'ব্যবহারকারী',
        headline,
        category,
        template,
        imageUrl: dataUrl.length < 950000 ? dataUrl : imageUrl,
        createdAt: serverTimestamp(),
      });
      toast.success('ফটোকার্ড গ্যালারিতে সেভ হয়েছে!');
    } catch (err) {
      console.error(err);
      toast.error('সেভ করতে ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafcfb] flex flex-col font-sans">
      <Header 
        user={user} 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onSearch={() => {}} 
      />

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(path) => {
          setIsSidebarOpen(false);
          navigate(path.startsWith('/') ? path : `/${path}`);
        }} 
      />

      <main className="flex-1 pb-24">
        {/* Top Header Navigation */}
        <div className="bg-white border-b border-slate-100 shadow-xs px-4 py-4 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-800 leading-tight">নিউজ কার্ড মেকার</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 flex items-center gap-1">
                    <Sparkles size={12} /> ফটোকার্ড বিডি
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500">মিডিয়া ও সংবাদের জন্য মুহূর্তেই প্রফেশনাল ফটোকার্ড জেনারেটর</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareCard}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-all"
              >
                <Share2 size={15} /> শেয়ার
              </button>
              <button
                onClick={handleDownloadImage}
                className="px-4 py-2 rounded-xl bg-[#009664] text-white font-black text-xs flex items-center gap-1.5 hover:bg-[#007a52] shadow-md shadow-emerald-600/20 transition-all"
              >
                <Download size={15} /> ডাউনলোড এইচডি
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Main Grid Layout: Controls Left, Live Canvas Preview Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Controls Column (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Notice Quick Import */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 rounded-2xl border border-emerald-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#01412F] flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500 fill-amber-500" /> অ্যাপের সাম্প্রতিক নোটিশ থেকে অটো-ফিল
                  </span>
                </div>
                <select
                  value={selectedNoticeId}
                  onChange={handleImportNotice}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                >
                  <option value="">-- নোটিশ ইমপোর্ট সিলেক্ট করুন --</option>
                  {recentNotices.map((notice) => (
                    <option key={notice.id} value={notice.id}>
                      {notice.title || notice.text || 'শিরোনামহীন নোটিশ'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Style Switcher */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <label className="text-xs font-black text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <Palette size={15} className="text-[#009664]" /> টেমপ্লেট ডিজাইন নির্বাচন করুন
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'red_corner', name: 'রেড কর্নার', color: 'bg-red-500' },
                    { id: 'breaking_red', name: 'ব্রেকিং নিউজ', color: 'bg-rose-700' },
                    { id: 'puthia_branded', name: 'আমাদের পুঠিয়া', color: 'bg-[#009664]' },
                    { id: 'classic_news', name: 'ক্লাসিক নিউজ', color: 'bg-slate-800' },
                    { id: 'modern_dark', name: 'মডার্ন ডার্ক', color: 'bg-slate-900' },
                    { id: 'paper_poster', name: 'পেপার পোস্টার', color: 'bg-amber-100 text-amber-900' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id as CardTemplate)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        template === t.id 
                          ? 'border-[#009664] bg-emerald-50/50 shadow-xs' 
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-full h-3 rounded-md mb-1.5 ${t.color}`}></div>
                      <span className="text-[11px] font-black text-slate-800 block truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Fields */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
                <div>
                  <label className="text-xs font-black text-slate-700 mb-1 block">
                    ক্যাটাগরি বা ব্যাজ
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="যেমন: বিশেষ সংবাদ, খেলাধুলা, স্থানীয় খবর"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 mb-1 block">
                    প্রধান শিরোনাম (Headline)
                  </label>
                  <textarea
                    rows={2}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="সংবাদের আকর্ষণীয় শিরোনাম লিখুন"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 mb-1 block">
                    উপ-শিরোনাম / বার্তা (Sub-headline)
                  </label>
                  <textarea
                    rows={2}
                    value={subHeadline}
                    onChange={(e) => setSubHeadline(e.target.value)}
                    placeholder="সংবাদের মূল অংশ বা বিস্তারিত সংক্ষেপ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-700 mb-1 block">
                      প্রতিবেদক / উৎস
                    </label>
                    <input
                      type="text"
                      value={reporter}
                      onChange={(e) => setReporter(e.target.value)}
                      placeholder="যেমন: পুঠিয়া প্রতিনিধি"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 mb-1 block">
                      প্রকাশের তারিখ ও সময়
                    </label>
                    <input
                      type="text"
                      value={dateText}
                      onChange={(e) => setDateText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                    />
                  </div>
                </div>
              </div>

              {/* Image & Watermark Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
                <div>
                  <label className="text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>ছবি নির্বাচন / আপলোড</span>
                    <span className="text-[10px] text-slate-400">গ্যালারি থেকে আপলোড করুন</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-[#009664] hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 mb-1 block">
                    ওয়াটারমার্ক / ব্র্যান্ড ট্যাগলাইন
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={watermark}
                      onChange={(e) => setWatermark(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWatermark(!showWatermark)}
                      className={`px-3 py-2 rounded-xl text-xs font-black border transition-colors ${
                        showWatermark ? 'bg-emerald-50 border-emerald-200 text-[#009664]' : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                    >
                      {showWatermark ? 'অন' : 'অফ'}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleSaveToGallery}
                    className="w-full py-3 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                  >
                    <Save size={15} /> মাই গ্যালারিতে সেভ করুন
                  </button>
                </div>
              </div>

            </div>

            {/* Right Canvas Live Preview Column (7 cols on lg) */}
            <div className="lg:col-span-7 sticky top-24">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-sm font-black text-slate-800">লাইভ প্রাকদর্শন (HD Canvas Preview)</h3>
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-black">
                    <button
                      onClick={() => setAspectRatio('1:1')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        aspectRatio === '1:1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      ১:১ স্কয়ার
                    </button>
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        aspectRatio === '16:9' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      ১৬:৯ ল্যান্ডস্কেপ
                    </button>
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner flex items-center justify-center min-h-[380px]">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-auto max-h-[620px] object-contain rounded-xl shadow-md"
                  />
                  {isRendering && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs font-black text-[#009664]">
                        <RefreshCw size={18} className="animate-spin" /> জেনারেট হচ্ছে...
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDownloadImage}
                    className="py-3.5 rounded-2xl bg-[#009664] text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-[#007a52] shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Download size={18} /> হাই-ডেফিনিশন PNG ডাউনলোড
                  </button>
                  <button
                    onClick={handleShareCard}
                    className="py-3.5 rounded-2xl bg-emerald-50 text-[#009664] border border-emerald-200/80 font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                  >
                    <Share2 size={18} /> সোশ্যাল মিডিয়ায় শেয়ার
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
      <BottomNavigation />
    </div>
  );
};

export default NewsCardGeneratorPage;
