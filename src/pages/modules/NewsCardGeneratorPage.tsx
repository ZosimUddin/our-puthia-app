import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Share2, Sparkles, Image as ImageIcon, 
  RefreshCw, Type, Calendar, User, Newspaper, Check, Tag,
  Zap, Save, Eye, FileText, Layers, Palette, Share, Highlighter,
  Sliders, Building, Award, Search, HelpCircle, CheckCircle2
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

// Quick Preset News Items
const NEWS_PRESETS = [
  {
    label: '🚨 হারানো বিজ্ঞপ্তি',
    category: 'হারানো বিজ্ঞপ্তি',
    headline: '*একটি হারানো বিজ্ঞপ্তি*: পুঠিয়া উপজেলার বিলমাড়িয়া গ্রামের মোঃ হাসান আলী নিখোঁজ',
    subHeadline: 'পুঠিয়া উপজেলার, জিউপাড়া ইউনিয়নের, বিলমাড়িয়া-নগরপাড়া গ্রামের মোঃ আব্দুল এর ছেলে মোঃ হাসান আলী আজ এশার নামাজের পর থেকে নিখোঁজ। সন্ধানে কল করুন: 01799041821',
    badgeColor: '#dc2626',
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop'
  },
  {
    label: '📢 বিশেষ সংবাদ',
    category: 'বিশেষ সংবাদ',
    headline: 'আমাদের পুঠিয়ায় চালু হলো *ডিজিটাল ফটোকার্ড* জেনারেটর সিস্টেম',
    subHeadline: 'এখন থেকে যে কোনো সংবাদের প্রফেশনাল মিডিয়া ফটোকার্ড এক ক্লিকেই তৈরি ও এইচডি ডাউনলোড করা যাবে।',
    badgeColor: '#009664',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop'
  },
  {
    label: '🏆 খেলাধুলা',
    category: 'খেলাধুলা',
    headline: 'পুঠিয়া স্টেডিয়ামে অনুষ্ঠিত হলো *বার্ষিক ফুটবল টুর্নামেন্ট* ফাইনালে চ্যাম্পিয়ন টিম',
    subHeadline: 'জাঁকজমকপূর্ণ আয়োজনে শত শত দর্শকের উপস্থিতিতে বিজয়ী দলের হাতে ট্রফি তুলে দেন স্থানীয় অতিথিবৃন্দ।',
    badgeColor: '#2563eb',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop'
  },
  {
    label: '💐 অভিনন্দন',
    category: 'অভিনন্দন',
    headline: 'পুঠিয়া উপজেলার কৃতি সন্তানকে *উষ্ণ শুভেচ্ছা ও রিমঝিম অভিনন্দন*',
    subHeadline: 'মেধা ও সাফল্যের মাধ্যমে পুঠিয়াকে দেশের দরবারে সম্মানিত করায় সর্বস্তরের জনগণের পক্ষ থেকে রইল রক্তিম শুভেচ্ছা।',
    badgeColor: '#d97706',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop'
  },
  {
    label: '🌹 শোক সংবাদ',
    category: 'শোক সংবাদ',
    headline: 'গভীর শোক ও বিনম্র শ্রদ্ধায় *চিরবিদায় নিলেন শ্রদ্ধেয় ব্যক্তিত্ব*',
    subHeadline: 'তাঁর বিদেহী আত্মার মাগফিরাত কামনা করছি এবং শোকসন্তপ্ত পরিবারের প্রতি গভীর সমবেদনা জ্ঞাপন করছি।',
    badgeColor: '#1e293b',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop'
  }
];

export const NewsCardGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Workflow Active Step (1: Template & Style, 2: Content & Text, 3: Photo & Branding, 4: Export)
  const [activeTab, setActiveTab] = useState<number>(1);

  // Form states
  const [template, setTemplate] = useState<CardTemplate>('red_corner');
  const [category, setCategory] = useState('বিশেষ সংবাদ');
  const [headline, setHeadline] = useState('আমাদের পুঠিয়ায় শুভ উদ্বোধন হতে যাচ্ছে *বিশেষ নিউজ কার্ড জেনারেটর* সিস্টেম');
  const [subHeadline, setSubHeadline] = useState('এখন থেকে যে কোনো সংবাদের প্রফেশনাল মিডিয়া ফটোকার্ড এক ক্লিকেই তৈরি ও এইচডি ডাউনলোড করা যাবে।');
  const [reporter, setReporter] = useState('আমাদের পুঠিয়া ডেস্ক');
  const [dateText, setDateText] = useState(getBengaliFormattedDate());
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop');
  const [watermark, setWatermark] = useState('আমাদের পুঠিয়া • সত্য প্রকাশে আপসহীন');
  const [showWatermark, setShowWatermark] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:5'>('1:1');

  // New customization controls requested by user & screenshot
  const [fontFamily, setFontFamily] = useState<'Hind Siliguri' | 'SolaimanLipi' | 'Kalpurush' | 'Tiro Bangla'>('Hind Siliguri');
  const [badgeBgColor, setBadgeBgColor] = useState('#009664');
  const [highlightColor, setHighlightColor] = useState('#fef08a'); // Yellow fill highlight
  const [headlineFontSize, setHeadlineFontSize] = useState<number>(46);
  const [subHeadlineFontSize, setSubHeadlineFontSize] = useState<number>(28);
  const [institutionName, setInstitutionName] = useState('দৈনিক আমাদের পুঠিয়া');
  const [showInstitution, setShowInstitution] = useState(false);

  // App Notices / News list for import
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState('');

  // Canvas ref & image cache
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [isRendering, setIsRendering] = useState(false);

  // Map font selections to loaded Google/local fonts
  const getCanvasFontFamily = (f: string) => {
    switch (f) {
      case 'SolaimanLipi':
        return "'Noto Serif Bengali', 'SolaimanLipi', serif";
      case 'Kalpurush':
        return "'Anek Bangla', 'Kalpurush', sans-serif";
      case 'Tiro Bangla':
        return "'Tiro Bangla', serif";
      case 'Hind Siliguri':
      default:
        return "'Hind Siliguri', sans-serif";
    }
  };

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

  // Apply Quick News Preset
  const applyPreset = (preset: typeof NEWS_PRESETS[0]) => {
    setCategory(preset.category);
    setHeadline(preset.headline);
    setSubHeadline(preset.subHeadline);
    setBadgeBgColor(preset.badgeColor);
    if (preset.image) setImageUrl(preset.image);
    toast.success(`"${preset.category}" ফরম্যাট লোড হয়েছে!`);
  };

  // Handle notice import selection
  const handleImportNotice = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedNoticeId(id);
    if (!id) return;
    
    const item = recentNotices.find(n => n.id === id);
    if (item) {
      if (item.title || item.text) setHeadline(`*${item.title || item.text}*`);
      if (item.content || item.description) setSubHeadline(item.content || item.description);
      if (item.category) setCategory(item.category);
      if (item.image && item.image.startsWith('http')) setImageUrl(item.image);
      if (item.publisher || item.author) setReporter(item.publisher || item.author);
      toast.success('নোটিশের তথ্য সফলভাবে ইমপোর্ট করা হয়েছে!');
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
    let height = 1200;
    if (aspectRatio === '16:9') height = 675;
    if (aspectRatio === '4:5') height = 1500;

    canvas.width = width;
    canvas.height = height;

    setIsRendering(true);

    const activeFont = getCanvasFontFamily(fontFamily);

    const drawContent = (loadedImg: HTMLImageElement | null) => {
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
      let imgH = height * 0.52;

      if (template === 'red_corner' || template === 'breaking_red') {
        imgY = 85;
        imgH = height * 0.50;
      } else if (template === 'puthia_branded') {
        imgY = 125;
        imgH = height * 0.48;
      } else if (template === 'classic_news') {
        imgY = 145;
        imgH = height * 0.46;
      }

      // Draw Main Image
      if (loadedImg && loadedImg.complete && loadedImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        if (template === 'paper_poster') {
          ctx.rect(40, imgY, width - 80, imgH);
        } else {
          ctx.rect(0, imgY, width, imgH);
        }
        ctx.clip();

        // Object cover draw logic
        const scale = Math.max(width / loadedImg.naturalWidth, imgH / loadedImg.naturalHeight);
        const x = (width - loadedImg.naturalWidth * scale) / 2;
        const y = imgY + (imgH - loadedImg.naturalHeight * scale) / 2;
        ctx.drawImage(loadedImg, x, y, loadedImg.naturalWidth * scale, loadedImg.naturalHeight * scale);
        ctx.restore();
      } else {
        // Fallback image gradient pattern
        const grad = ctx.createLinearGradient(0, imgY, width, imgY + imgH);
        grad.addColorStop(0, '#01412F');
        grad.addColorStop(1, badgeBgColor || '#009664');
        ctx.fillStyle = grad;
        ctx.fillRect(0, imgY, width, imgH);
      }

      // Dark Overlay on bottom of image for text readability
      const imgGradient = ctx.createLinearGradient(0, imgY + imgH - 180, 0, imgY + imgH);
      imgGradient.addColorStop(0, 'rgba(0,0,0,0)');
      imgGradient.addColorStop(1, template === 'modern_dark' ? 'rgba(15,23,42,0.95)' : 'rgba(0,0,0,0.7)');
      ctx.fillStyle = imgGradient;
      ctx.fillRect(0, imgY + imgH - 180, width, 180);

      // Institution Banner overlay if enabled
      if (showInstitution && institutionName) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, imgY, width, 45);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 22px ${activeFont}`;
        ctx.textAlign = 'center';
        ctx.fillText(`🏛️ ${institutionName}`, width / 2, imgY + 30);
        ctx.textAlign = 'left';
      }

      // 3. Header Styling based on Template
      if (template === 'red_corner') {
        ctx.fillStyle = badgeBgColor || '#dc2626';
        ctx.fillRect(0, 0, width, 85);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 36px ${activeFont}`;
        ctx.fillText('আমাদের পুঠিয়া • ফটোকার্ড', 40, 54);

        ctx.font = `bold 24px ${activeFont}`;
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 54);
        ctx.textAlign = 'left';

      } else if (template === 'breaking_red') {
        ctx.fillStyle = badgeBgColor || '#991b1b';
        ctx.fillRect(0, 0, width, 85);

        ctx.fillStyle = highlightColor || '#fef08a';
        ctx.font = `900 38px ${activeFont}`;
        ctx.fillText('🚨 ব্রেকিং নিউজ', 40, 56);

        ctx.fillStyle = '#ffffff';
        ctx.font = `24px ${activeFont}`;
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 54);
        ctx.textAlign = 'left';

      } else if (template === 'puthia_branded') {
        const headerGrad = ctx.createLinearGradient(0, 0, width, 0);
        headerGrad.addColorStop(0, '#01412F');
        headerGrad.addColorStop(1, badgeBgColor || '#009664');
        ctx.fillStyle = headerGrad;
        ctx.fillRect(0, 0, width, 125);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(80, 62, 42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = badgeBgColor || '#009664';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('P', 80, 78);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#ffffff';
        ctx.font = `900 42px ${activeFont}`;
        ctx.fillText('আমাদের পুঠিয়া', 145, 65);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = `bold 22px ${activeFont}`;
        ctx.fillText('উপজেলার প্রথম ডিজিটাল তথ্য ও সংবাদ নেটওয়ার্ক', 145, 96);

        ctx.fillStyle = '#ffffff';
        ctx.font = `22px ${activeFont}`;
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 70);
        ctx.textAlign = 'left';

      } else if (template === 'classic_news') {
        ctx.fillStyle = '#1e293b';
        ctx.font = `900 48px ${activeFont}`;
        ctx.textAlign = 'center';
        ctx.fillText(institutionName || 'দৈনিক আমাদের পুঠিয়া', width / 2, 68);

        ctx.fillStyle = '#64748b';
        ctx.font = `22px ${activeFont}`;
        ctx.fillText(`স্মার্ট রাজশাহী ও পুঠিয়ার মুখপত্র | ${dateText}`, width / 2, 110);
        ctx.textAlign = 'left';

        ctx.strokeStyle = badgeBgColor || '#0f172a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(40, 128);
        ctx.lineTo(width - 40, 128);
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, 134);
        ctx.lineTo(width - 40, 134);
        ctx.stroke();

      } else if (template === 'modern_dark') {
        ctx.fillStyle = badgeBgColor || '#38bdf8';
        ctx.font = `900 36px ${activeFont}`;
        ctx.fillText('OUR PUTHIA MEDIA', 40, 52);

        ctx.fillStyle = '#94a3b8';
        ctx.font = `22px ${activeFont}`;
        ctx.textAlign = 'right';
        ctx.fillText(dateText, width - 40, 52);
        ctx.textAlign = 'left';
      }

      // 4. Category Badge Floating over image or card
      const badgeY = imgY + imgH - 30;
      ctx.save();
      ctx.fillStyle = badgeBgColor || (template === 'breaking_red' ? '#dc2626' : '#009664');
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 12;
      
      const badgeText = category || 'বিশেষ সংবাদ';
      ctx.font = `bold 26px ${activeFont}`;
      const badgeWidth = ctx.measureText(badgeText).width + 50;
      const bx = 40;
      const by = badgeY - 26;
      const bw = Math.max(160, badgeWidth);
      const bh = 52;
      const br = 14;

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

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 26px ${activeFont}`;
      ctx.fillText(badgeText, 65, badgeY + 8);

      if (reporter) {
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = `bold 22px ${activeFont}`;
        ctx.textAlign = 'right';
        ctx.fillText(`— ${reporter}`, width - 40, imgY + imgH - 15);
        ctx.textAlign = 'left';
      }

      // 5. Headline Section with Smart Highlight Support (`*text*`)
      const contentStartY = imgY + imgH + 55;
      let textColor = '#0f172a';
      if (template === 'modern_dark') textColor = '#f8fafc';
      if (template === 'paper_poster') textColor = '#1a1a1a';

      // Advanced Headline Text Drawing with Word Wrapping & Yellow/Color Highlights
      const renderFormattedHeadline = (
        text: string, 
        startX: number, 
        startY: number, 
        maxWidth: number, 
        lineHeight: number
      ) => {
        ctx.font = `900 ${headlineFontSize}px ${activeFont}`;
        
        // Parse words and flags for asterisks *highlight*
        const parts = text.split('*');
        const formattedWords: { word: string; isHighlighted: boolean }[] = [];

        parts.forEach((part, index) => {
          const isHighlighted = index % 2 === 1; // odd segments were wrapped in *...*
          const words = part.split(' ');
          words.forEach((w, wIdx) => {
            if (w.length > 0) {
              formattedWords.push({
                word: w + (wIdx < words.length - 1 ? ' ' : ''),
                isHighlighted
              });
            }
          });
        });

        let currentX = startX;
        let currentY = startY;

        for (let i = 0; i < formattedWords.length; i++) {
          const item = formattedWords[i];
          const metrics = ctx.measureText(item.word);
          const wordWidth = metrics.width;

          // Wrap to next line if exceeds boundary
          if (currentX + wordWidth > startX + maxWidth && currentX > startX) {
            currentX = startX;
            currentY += lineHeight;
          }

          // Draw highlight background box if flagged
          if (item.isHighlighted) {
            ctx.save();
            ctx.fillStyle = highlightColor || '#fef08a';
            const hPadding = 6;
            const hHeight = headlineFontSize * 1.18;
            ctx.beginPath();
            ctx.roundRect 
              ? ctx.roundRect(currentX - hPadding, currentY - headlineFontSize * 0.84, wordWidth + (hPadding * 2), hHeight, 6)
              : ctx.rect(currentX - hPadding, currentY - headlineFontSize * 0.84, wordWidth + (hPadding * 2), hHeight);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#0f172a'; // dark readable text on highlighted bg
          } else {
            ctx.fillStyle = textColor;
          }

          ctx.fillText(item.word, currentX, currentY);
          currentX += wordWidth;
        }

        return currentY + lineHeight;
      };

      const nextY = renderFormattedHeadline(headline, 40, contentStartY, width - 80, headlineFontSize * 1.3);

      // 6. Sub-headline / Detail Text
      if (subHeadline) {
        ctx.fillStyle = template === 'modern_dark' ? '#cbd5e1' : '#475569';
        ctx.font = `${subHeadlineFontSize}px ${activeFont}`;

        const wrapSimpleText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let curY = y;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctx.fillText(line, x, curY);
              line = words[n] + ' ';
              curY += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, curY);
          return curY + lineHeight;
        };

        wrapSimpleText(subHeadline, 40, nextY + 10, width - 80, subHeadlineFontSize * 1.4);
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

        ctx.fillStyle = badgeBgColor || '#009664';
        ctx.font = `900 28px ${activeFont}`;
        ctx.fillText('আমাদের পুঠিয়া', 40, footerY + 20);

        ctx.fillStyle = template === 'modern_dark' ? '#94a3b8' : '#64748b';
        ctx.font = `bold 22px ${activeFont}`;
        ctx.textAlign = 'right';
        ctx.fillText(watermark, width - 40, footerY + 20);
        ctx.textAlign = 'left';
      }

      setIsRendering(false);
    };

    // Use cached image for immediate synchronous rendering if already loaded
    const cached = imageCacheRef.current.get(imageUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      drawContent(cached);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageCacheRef.current.set(imageUrl, img);
      drawContent(img);
    };
    img.onerror = () => {
      drawContent(null);
    };
    if (img.complete && img.naturalWidth > 0) {
      imageCacheRef.current.set(imageUrl, img);
      drawContent(img);
    }
  };

  // Re-render canvas whenever relevant controls change
  useEffect(() => {
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        renderCanvasCard();
      });
    } else {
      renderCanvasCard();
    }
  }, [
    template, category, headline, subHeadline, reporter, dateText, imageUrl, 
    watermark, showWatermark, aspectRatio, fontFamily, badgeBgColor, highlightColor,
    headlineFontSize, subHeadlineFontSize, institutionName, showInstitution
  ]);

  // Download HD PNG Image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `Puthia_NewsCard_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('প্রফেশনাল নিউজ কার্ড এইচডি ইমেজ হিসেবে ডাউনলোড হয়েছে!');
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
        const cleanHeadline = headline.replace(/\*/g, '');
        const file = new File([blob], 'puthia-news-card.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: cleanHeadline,
            text: `${cleanHeadline}\n— আমাদের পুঠিয়া ফটোকার্ড`,
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
        headline: headline.replace(/\*/g, ''),
        category,
        template,
        imageUrl: dataUrl.length < 950000 ? dataUrl : imageUrl,
        createdAt: serverTimestamp(),
      });
      toast.success('ফটোকার্ড মাই গ্যালারিতে সফলভাবে সেভ হয়েছে!');
    } catch (err) {
      console.error(err);
      toast.error('সেভ করতে ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col font-sans">
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
        <div className="bg-white border-b border-slate-100 shadow-xs px-3 sm:px-4 py-3 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">নিউজ কার্ড জেনারেটর</h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-[#009664] flex items-center gap-1 shrink-0">
                    <Sparkles size={11} /> ফটোকার্ড বিডি
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 truncate">মিডিয়া ও সংবাদের জন্য প্রফেশনাল ফটোকার্ড সিস্টেম</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleShareCard}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition-all shrink-0"
              >
                <Share2 size={14} /> শেয়ার
              </button>
              <button
                onClick={handleDownloadImage}
                className="px-3.5 py-1.5 rounded-xl bg-[#009664] text-white font-black text-xs flex items-center gap-1.5 hover:bg-[#007a52] shadow-md shadow-emerald-600/20 transition-all shrink-0"
              >
                <Download size={14} /> ডাউনলোড এইচডি
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          
          {/* Quick Preset Badges Bar */}
          <div className="mb-5 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Zap size={15} className="text-amber-500 fill-amber-500" /> ১-ক্লিক কুইক টেমপ্লেট ও সংবাদের ফরম্যাট
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shrink-0">
                ক্লিক করলে অটো-ফিল হবে ➔
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x touch-pan-x">
              {NEWS_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="shrink-0 min-w-max px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 hover:text-[#009664] text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs snap-start active:scale-95 cursor-pointer"
                >
                  <span className="leading-none">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Quick Preview Jump Anchor */}
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('news-card-canvas-preview-container');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#009664] text-xs font-black flex items-center justify-between shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                কার্ডের লাইভ রূপ দেখতে ক্লিক করুন
              </span>
              <span className="text-[11px] font-bold bg-[#009664] text-white px-2 py-0.5 rounded-md shadow-2xs">প্রিভিউ নিচে ⬇</span>
            </button>
          </div>

          {/* Workflow Tabs (1 to 4) with Full Bengali Labels on Mobile & Desktop */}
          <div className="mb-5 bg-white rounded-2xl border border-slate-200/80 p-1 shadow-xs grid grid-cols-4 gap-1">
            {[
              { id: 1, fullLabel: '১. টেমপ্লেট ও স্টাইল', mobileLabel: '১. স্টাইল', icon: Palette },
              { id: 2, fullLabel: '২. সংবাদ ও টেক্সট', mobileLabel: '২. সংবাদ', icon: FileText },
              { id: 3, fullLabel: '৩. ছবি ও ব্রান্ডিং', mobileLabel: '৩. ব্রান্ডিং', icon: ImageIcon },
              { id: 4, fullLabel: '৪. সেভ ও ডাউনলোড', mobileLabel: '৪. ডাউনলোড', icon: Download },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1.5 sm:px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                    isActive 
                      ? 'bg-[#009664] text-white shadow-md shadow-emerald-600/20' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                  <span className="sm:hidden text-[11px]">{tab.mobileLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Main Grid Layout: Controls Left, Live Canvas Preview Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Controls Column (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* TAB 1: Template & Styles */}
              {(activeTab === 1 || activeTab === 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Template Selection */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs">
                    <label className="text-xs font-black text-slate-800 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Palette size={16} className="text-[#009664]" /> টেমপ্লেট লেআউট ডিজাইন</span>
                      <span className="text-[10px] text-slate-400">৬টি প্রফেশনাল থিম</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                              ? 'border-[#009664] bg-emerald-50/60 shadow-xs ring-2 ring-[#009664]/30' 
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <div className={`w-full h-3.5 rounded-md mb-2 ${t.color}`}></div>
                          <span className="text-[11px] font-black text-slate-800 block truncate">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fonts & Styling Customization */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Type size={16} className="text-[#009664]" /> ফন্ট ও টেক্সট সাইজ কাস্টমাইজেশন
                    </h3>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">বাংলা ফন্ট নির্বাচন</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'Hind Siliguri', name: 'হিন্দ শিলিগুড়ি (বোল্ড)' },
                          { id: 'SolaimanLipi', name: 'সোলাইমান লিপি' },
                          { id: 'Kalpurush', name: 'কালপুরুষ' },
                          { id: 'Tiro Bangla', name: 'তিরো বাংলা (ঐতিহ্যবাহী)' }
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setFontFamily(f.id as any)}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                              fontFamily === f.id 
                                ? 'bg-emerald-50/80 border-[#009664] text-[#009664] ring-2 ring-[#009664]/20' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                          <span>শিরোনামের সাইজ</span>
                          <span className="text-[#009664] font-black">{toBengaliNumber(headlineFontSize)}px</span>
                        </label>
                        <input
                          type="range"
                          min="32"
                          max="60"
                          value={headlineFontSize}
                          onChange={(e) => setHeadlineFontSize(Number(e.target.value))}
                          className="w-full accent-[#009664] cursor-pointer h-2 bg-slate-100 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                          <span>উপ-শিরোনামের সাইজ</span>
                          <span className="text-[#009664] font-black">{toBengaliNumber(subHeadlineFontSize)}px</span>
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="38"
                          value={subHeadlineFontSize}
                          onChange={(e) => setSubHeadlineFontSize(Number(e.target.value))}
                          className="w-full accent-[#009664] cursor-pointer h-2 bg-slate-100 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <label className="text-[11px] font-bold text-slate-700 mb-2 block">ক্যাটাগরি ব্যাকগ্রাউন্ড কালার</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {['#009664', '#dc2626', '#2563eb', '#1e293b', '#d97706'].map((c) => {
                            const isSelected = badgeBgColor.toLowerCase() === c.toLowerCase();
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setBadgeBgColor(c)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                  isSelected ? 'ring-2 ring-offset-2 ring-slate-800 shadow-xs' : 'hover:opacity-90'
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              >
                                {isSelected && <Check size={14} className="text-white drop-shadow-xs" />}
                              </button>
                            );
                          })}
                          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-300 shadow-2xs shrink-0 cursor-pointer flex items-center justify-center bg-white">
                            <input 
                              type="color" 
                              value={badgeBgColor} 
                              onChange={(e) => setBadgeBgColor(e.target.value)} 
                              className="absolute -inset-2 w-11 h-11 cursor-pointer bg-transparent border-0 opacity-0"
                              title="পছন্দের কালার বাছাই করুন"
                            />
                            <Palette size={14} className="text-slate-600 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <label className="text-[11px] font-bold text-slate-700 mb-2 block">হাইলাইট ব্যাকগ্রাউন্ড কালার</label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {['#fef08a', '#fca5a5', '#a7f3d0', '#bae6fd', '#fed7aa'].map((c) => {
                            const isSelected = highlightColor.toLowerCase() === c.toLowerCase();
                            const isLight = ['#fef08a', '#fed7aa', '#a7f3d0', '#bae6fd'].includes(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setHighlightColor(c)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                  isSelected ? 'ring-2 ring-offset-2 ring-slate-800 shadow-xs' : 'hover:opacity-90'
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              >
                                {isSelected && <Check size={14} className={isLight ? "text-slate-800" : "text-white"} />}
                              </button>
                            );
                          })}
                          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-300 shadow-2xs shrink-0 cursor-pointer flex items-center justify-center bg-white">
                            <input 
                              type="color" 
                              value={highlightColor} 
                              onChange={(e) => setHighlightColor(e.target.value)} 
                              className="absolute -inset-2 w-11 h-11 cursor-pointer bg-transparent border-0 opacity-0"
                              title="পছন্দের কালার বাছাই করুন"
                            />
                            <Palette size={14} className="text-slate-600 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: Text & Content */}
              {(activeTab === 2 || activeTab === 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
                    <div>
                      <label className="text-xs font-black text-slate-800 mb-1 block">
                        ক্যাটাগরি / বিষয়শ্রেণী
                      </label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="যেমন: বিশেষ সংবাদ, খেলাধুলা, স্থানীয় খবর"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-black text-slate-800 block">
                          প্রধান শিরোনাম (Headline)
                        </label>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          💡 শব্দকে *হাইলাইট* করতে স্টার (*) চিহ্ন দিন
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="যেমন: আমাদের পুঠিয়ায় শুভ উদ্বোধন হতে যাচ্ছে *বিশেষ নিউজ কার্ড* জেনারেটর"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">দ্রুত হাইলাইট:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const raw = headline.replace(/\*/g, '').trim();
                            const words = raw.split(/\s+/);
                            if (words.length > 0) {
                              words[0] = `*${words[0]}*`;
                              setHeadline(words.join(' '));
                            }
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          ⭐ ১ম শব্দ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const raw = headline.replace(/\*/g, '').trim();
                            const words = raw.split(/\s+/);
                            if (words.length >= 2) {
                              const midIdx = Math.floor(words.length / 2);
                              words[midIdx] = `*${words[midIdx]}*`;
                              setHeadline(words.join(' '));
                            }
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          ⭐ মাঝের শব্দ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const raw = headline.replace(/\*/g, '').trim();
                            const words = raw.split(/\s+/);
                            if (words.length > 0) {
                              words[words.length - 1] = `*${words[words.length - 1]}*`;
                              setHeadline(words.join(' '));
                            }
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          ⭐ শেষ শব্দ
                        </button>
                        {headline.includes('*') && (
                          <button
                            type="button"
                            onClick={() => setHeadline(headline.replace(/\*/g, ''))}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            মুছুন
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-800 mb-1 block">
                        উপ-শিরোনাম / সংবাদ সংক্ষেপ (Sub-headline)
                      </label>
                      <textarea
                        rows={3}
                        value={subHeadline}
                        onChange={(e) => setSubHeadline(e.target.value)}
                        placeholder="সংবাদের মূল অংশ বা বিবরণ সংক্ষেপে লিখুন"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-black text-slate-800 mb-1 block">
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
                        <label className="text-xs font-black text-slate-800 mb-1 block">
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
                </motion.div>
              )}

              {/* TAB 3: Photos & Branding */}
              {(activeTab === 3 || activeTab === 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Notice Quick Import */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 rounded-2xl border border-emerald-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-[#01412F] flex items-center gap-1.5">
                        <Zap size={15} className="text-amber-500 fill-amber-500" /> অ্যাপের সাম্প্রতিক নোটিশ থেকে ইমপোর্ট
                      </span>
                    </div>
                    <select
                      value={selectedNoticeId}
                      onChange={handleImportNotice}
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                    >
                      <option value="">-- নোটিশ সিলেক্ট করে অটো-ফিল করুন --</option>
                      {recentNotices.map((notice) => (
                        <option key={notice.id} value={notice.id}>
                          {notice.title || notice.text || 'শিরোনামহীন নোটিশ'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Image Upload & Branding Controls */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
                    <div>
                      <label className="text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>সংবাদের মূল ছবি নির্বাচন / আপলোড</span>
                        <span className="text-[10px] text-slate-400">ডিভাইস থেকে আপলোড করুন</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-[#009664] hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>

                    {/* Institution Banner Option */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Building size={15} className="text-[#009664]" /> প্রতিষ্ঠান / সংবাদের নাম
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowInstitution(!showInstitution)}
                          className={`px-3 py-1 rounded-lg text-xs font-black border transition-colors ${
                            showInstitution ? 'bg-emerald-50 border-emerald-200 text-[#009664]' : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {showInstitution ? 'দৃশ্যমান' : 'লুকানো'}
                        </button>
                      </div>
                      {showInstitution && (
                        <input
                          type="text"
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          placeholder="যেমন: দৈনিক আমাদের পুঠিয়া / পুঠিয়া মডেল প্রেস ক্লাব"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#009664]"
                        />
                      )}
                    </div>

                    {/* Watermark Tagline */}
                    <div>
                      <label className="text-xs font-black text-slate-800 mb-1 block">
                        ওয়াটারমার্ক / ব্র্যান্ড ট্যাগলাইন
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
                  </div>
                </motion.div>
              )}

              {/* TAB 4: Save & Download Actions */}
              {(activeTab === 4 || activeTab === 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Save size={16} className="text-[#009664]" /> সেভ ও প্রসেসিং
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      তৈরিকৃত নিউজ ফটোকার্ডটি আপনার একাউন্টে অথবা সরাসরি এইচডি ফাইল হিসেবে ডাউনলোড করুন।
                    </p>
                    
                    <button
                      onClick={handleSaveToGallery}
                      className="w-full py-3 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"
                    >
                      <Save size={16} /> মাই গ্যালারিতে ফটোকার্ড সেভ করুন
                    </button>
                  </div>
                </motion.div>
              )}

            </div>

            {/* Right Canvas Live Preview Column (7 cols on lg) */}
            <div id="news-card-canvas-preview-container" className="lg:col-span-7 sticky top-24 scroll-mt-24">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-sm font-black text-slate-800">লাইভ প্রাকদর্শন (HD Canvas Preview)</h3>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-black">
                    {[
                      { id: '1:1', label: '১:১ স্কয়ার' },
                      { id: '16:9', label: '১৬:৯ ল্যান্ডস্কেপ' },
                      { id: '4:5', label: '৪:৫ পোর্ট্রেট' },
                    ].map((ar) => (
                      <button
                        key={ar.id}
                        onClick={() => setAspectRatio(ar.id as any)}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          aspectRatio === ar.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner flex items-center justify-center min-h-[400px]">
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-auto max-h-[640px] object-contain rounded-xl shadow-md transition-all"
                  />
                  {isRendering && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs font-black text-[#009664]">
                        <RefreshCw size={18} className="animate-spin" /> জেনারেট হচ্ছে...
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Footer Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleDownloadImage}
                    className="py-3.5 rounded-2xl bg-[#009664] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#007a52] shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <Download size={18} /> হাই-ডেফিনিশন PNG ডাউনলোড
                  </button>
                  <button
                    onClick={handleShareCard}
                    className="py-3.5 rounded-2xl bg-emerald-50 text-[#009664] border border-emerald-200/80 font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
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
