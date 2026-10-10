import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { HeroSlide } from "../../types";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

export interface BannerItem {
  id?: string;
  image?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  link?: string;
  targetUrl?: string;
  url?: string;
  order?: number;
  isActive?: boolean;
  active?: boolean;
  category?: string;
  tag?: string;
}

export const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: "default-1",
    image: '/logo.svg',
    title: "পুঠিয়ার সব খবর, সেবা\nও আপডেট এক জায়গায়",
    subtitle: "সহজে জানুন, দ্রুত সেবা নিন",
    link: "/news",
    order: 1,
    isActive: true
  },
  {
    id: "default-2",
    image: '/logo.svg',
    title: "নিয়মিত পুঠিয়ার সকল তথ্য এড করে আমাদেরকে সহযোগিতা করুন",
    subtitle: "আপনার এলাকার সকল গুরুত্বপূর্ণ সেবা ও ব্যবসা প্রতিষ্ঠানের তথ্য যুক্ত করুন",
    link: "/dashboard",
    order: 2,
    isActive: true
  },
  {
    id: "default-3",
    image: '/logo.svg',
    title: "পুঠিয়া উপজেলার সকল তথ্য সেবা পেতে আমাদের পুঠিয়া অ্যাপ ব্যবহার করুন",
    subtitle: "সহজে নাগরিক সেবা পেতে পুঠিয়া অ্যাপটি ফোনে সংগৃহীত রাখুন",
    link: "/download",
    order: 3,
    isActive: true
  },
  {
    id: "default-4",
    image: '/logo.svg',
    title: "জরুরী রক্তদাতা, ডাক্তার ডিরেক্টরি ও নাগরিক সেবা পেতে আমাদের সাথে থাকুন",
    subtitle: "২৪ ঘন্টা বিনামূল্যে রক্তদাতা ও অ্যাম্বুলেন্স সেবা হটলাইন",
    link: "/blood-donor",
    order: 4,
    isActive: true
  },
  {
    id: "default-5",
    image: '/logo.svg',
    title: "প্রাচীন পুঠিয়া রাজবাড়ী ও ঐতিহাসিক শিব মন্দির কমপ্লেক্স",
    subtitle: "১৬শ শতাব্দীর রাজপ্রাসাদ ও মনোরম শিব দিঘীর প্রাকৃতিক শোভা",
    link: "/history",
    order: 5,
    isActive: true
  }
];

export const HeroBannerSlider: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [banners, setBanners] = useState<BannerItem[]>(DEFAULT_BANNERS);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<any>(null);

  const autoplayDelay = (settings?.heroSliderAutoplayDelay || 4) * 1000;

  useEffect(() => {
    // 1. Subscribe to 'banners' collection first as requested
    const unsubBanners = onSnapshot(
      collection(db, "banners"),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: BannerItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const isActive = data.isActive !== undefined ? data.isActive : data.active !== undefined ? data.active : true;
            if (isActive !== false) {
              loaded.push({
                id: docSnap.id,
                image: data.image || data.imageUrl || data.url || "",
                title: data.title || "",
                subtitle: data.subtitle || data.description || "",
                link: data.link || data.targetUrl || data.url || "/news",
                order: data.order !== undefined ? Number(data.order) : 99,
                isActive: true,
                category: data.category || "পুঠিয়া",
                tag: data.tag || ""
              });
            }
          });

          // Sort by order
          loaded.sort((a, b) => (a.order || 0) - (b.order || 0));

          if (loaded.length > 0) {
            setBanners(loaded);
            setLoading(false);
            return;
          }
        }

        // 2. Fallback to 'hero_slides' collection if banners collection is empty
        const unsubSlides = onSnapshot(
          collection(db, "hero_slides"),
          (slidesSnap) => {
            if (!slidesSnap.empty) {
              const loadedSlides: BannerItem[] = [];
              slidesSnap.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.isActive !== false) {
                  loadedSlides.push({
                    id: docSnap.id,
                    image: data.image || data.imageUrl || "",
                    title: data.title || "",
                    subtitle: data.subtitle || "",
                    link: data.link || "/news",
                    order: data.order || 99,
                    isActive: true,
                    category: data.category || "পুঠিয়া",
                    tag: data.tag || ""
                  });
                }
              });
              loadedSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
              if (loadedSlides.length > 0) {
                setBanners(loadedSlides);
              }
            } else {
              setBanners(DEFAULT_BANNERS);
            }
            setLoading(false);
          },
          (err) => {
            console.warn("Error fetching hero slides fallback:", err);
            setBanners(DEFAULT_BANNERS);
            setLoading(false);
          }
        );

        return () => unsubSlides();
      },
      (error) => {
        console.warn("Error fetching banners collection:", error);
        setBanners(DEFAULT_BANNERS);
        setLoading(false);
      }
    );

    return () => unsubBanners();
  }, []);

  if (settings?.showHeroSlider === false) {
    return null;
  }

  const handleSlideChange = (swiper: any) => {
    if (swiper) {
      setActiveIndex(swiper.realIndex ?? swiper.activeIndex ?? 0);
    }
  };

  const handleSelectSlide = (index: number) => {
    if (swiperRef.current && swiperRef.current.swiper) {
      if (typeof swiperRef.current.swiper.slideToLoop === "function") {
        swiperRef.current.swiper.slideToLoop(index);
      } else {
        swiperRef.current.swiper.slideTo(index);
      }
    }
  };

  const displayBanners = banners.length > 0 ? banners : DEFAULT_BANNERS;

  return (
    <div className="relative w-full mb-4 sm:mb-6">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-4">
        {/* Banner Card Frame */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-slate-900 border border-slate-200/80 group">
          <Swiper
            ref={swiperRef}
            spaceBetween={0}
            speed={600}
            loop={displayBanners.length > 1}
            grabCursor={true}
            onRealIndexChange={handleSlideChange}
            autoplay={{
              delay: autoplayDelay,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            modules={[Autoplay, Pagination, Navigation]}
            className="h-[175px] sm:h-[250px] md:h-[300px] relative z-10 rounded-2xl sm:rounded-3xl"
          >
            {displayBanners.map((banner, idx) => {
              const hasText = Boolean(banner.title && banner.title.trim());
              const targetLink = banner.link || banner.targetUrl || "/news";

              const handleBannerClick = () => {
                if (targetLink.startsWith("http://") || targetLink.startsWith("https://")) {
                  window.open(targetLink, "_blank", "noopener,noreferrer");
                } else {
                  navigate(targetLink);
                }
              };

              return (
                <SwiperSlide key={banner.id || idx}>
                  <div
                    className="relative w-full h-full group cursor-pointer overflow-hidden bg-slate-900 select-none"
                    onClick={handleBannerClick}
                  >
                    {/* Banner Image */}
                    <img
                      src={banner.image || banner.imageUrl}
                      alt={banner.title || "আমাদের পুঠিয়া ব্যানার"}
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                      width="1200"
                      height="400"
                      className="w-full h-full object-cover transition-transform duration-[7s] group-hover:scale-105"
                    />

                    {/* Gradient & Text Overlay (only if banner has title text) */}
                    {hasText && (
                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent flex flex-col justify-center p-3.5 sm:p-7 lg:p-10 z-10">
                        <div className="max-w-md sm:max-w-xl space-y-1 sm:space-y-2 relative z-20">
                          <h2 className="text-sm sm:text-2xl md:text-5xl font-black text-white leading-tight drop-shadow-md whitespace-pre-line tracking-tight line-clamp-2 sm:line-clamp-none">
                            {banner.title}
                          </h2>
                          {banner.subtitle && (
                            <p className="text-[11px] md:text-xl text-slate-200 font-medium drop-shadow-sm opacity-95 line-clamp-1 sm:line-clamp-none">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Interactive Slide Indicators (Dots / Pill) */}
          {displayBanners.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg pointer-events-auto">
              {displayBanners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSlide(i)}
                  className={`transition-all duration-300 cursor-pointer p-0 border-0 ${
                    activeIndex === i
                      ? "w-6 sm:w-7 h-2 bg-emerald-400 rounded-full shadow-xs"
                      : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/70 hover:bg-white rounded-full"
                  }`}
                  style={{
                    minWidth: activeIndex === i ? "24px" : "8px",
                    minHeight: "8px",
                    maxWidth: activeIndex === i ? "28px" : "10px",
                    maxHeight: "10px"
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroBannerSlider;
