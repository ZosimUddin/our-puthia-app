import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  Indent, Outdent, Quote, Link as LinkIcon, Unlink, Image as ImageIcon,
  Video, Minus, Table as TableIcon, Undo, Redo, RemoveFormatting,
  Type, Palette, Highlighter, Code, Eye, X, Check, Upload, Loader2,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeHtml, isContentEmpty, getSafeVideoEmbedUrl, extractPlainText } from '../../utils/sanitizeHtml';

export interface WordPressRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  userId?: string;
}

const PRESET_COLORS = [
  { name: 'কালো / ডিফল্ট', value: '#1e293b' },
  { name: 'গাঢ় সবুজ', value: '#065f46' },
  { name: 'এমেরাল্ড গ্রিন', value: '#059669' },
  { name: 'নীল', value: '#2563eb' },
  { name: 'লাল', value: '#dc2626' },
  { name: 'অ্যাম্বার / কমলা', value: '#d97706' },
  { name: 'পার্পল', value: '#7c3aed' },
];

const PRESET_HIGHLIGHTS = [
  { name: 'হলুদ হাইলাইট', value: '#fef08a' },
  { name: 'সবুজ হাইলাইট', value: '#bbf7d0' },
  { name: 'নীল হাইলাইট', value: '#bae6fd' },
  { name: 'গোলাপি হাইলাইট', value: '#fbcfe8' },
  { name: 'কমলা হাইলাইট', value: '#fed7aa' },
];

const toBengaliNumber = (num: number | string): string => {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(num).replace(/[0-9]/g, (d) => map[d] || d);
};

export const WordPressRichEditor: React.FC<WordPressRichEditorProps> = ({
  value,
  onChange,
  placeholder = 'সংবাদের বিস্তারিত বিবরণ এখানে সুন্দরভাবে লিখুন...',
  minHeight = '280px',
  label = 'সংবাদের মূল কন্টেন্ট',
  required = true,
  disabled = false,
  userId = 'news_author'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [codeValue, setCodeValue] = useState(value || '');
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  // Active state trackers
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  // Dropdown & Modal Popups
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  
  // Modals
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageWidth, setImageWidth] = useState<'100%' | '75%' | '50%'>('100%');
  const [imageAlign, setImageAlign] = useState<'center' | 'left' | 'right'>('center');
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Sync editor innerHTML with external value only when needed
  useEffect(() => {
    if (editorRef.current && activeTab === 'visual') {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        // If legacy plain text with no tags, wrap in clean <p>
        if (value && !/<[a-z][\s\S]*>/i.test(value)) {
          const paragraphs = value.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join('');
          editorRef.current.innerHTML = paragraphs;
        } else {
          editorRef.current.innerHTML = value || '';
        }
      }
    }
    setCodeValue(value || '');
  }, [value, activeTab]);

  // Save current user selection before opening modals
  const saveSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelection(sel.getRangeAt(0).cloneRange());
    }
  }, []);

  // Restore selection
  const restoreSelection = useCallback(() => {
    if (typeof window === 'undefined' || !savedSelection) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelection);
    }
  }, [savedSelection]);

  // Check active formatting for toolbar buttons
  const checkActiveFormats = useCallback(() => {
    if (activeTab !== 'visual' || !editorRef.current) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {}
  }, [activeTab]);

  // Handle Editor Content Change
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    onChange(rawHtml);
    checkActiveFormats();
  };

  // Execute standard execCommand
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (activeTab !== 'visual') return;
    editorRef.current?.focus();
    try {
      document.execCommand(command, false, arg);
      handleEditorInput();
      checkActiveFormats();
    } catch (e) {
      console.warn("execCommand error:", e);
    }
  };

  // Headings
  const applyHeading = (tag: string) => {
    setShowHeadingMenu(false);
    editorRef.current?.focus();
    execCmd('formatBlock', `<${tag}>`);
  };

  // Font Size
  const applyFontSize = (sizeStr: string) => {
    setShowFontSizeMenu(false);
    editorRef.current?.focus();
    saveSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      execCmd('fontSize', '4');
      return;
    }
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = sizeStr;
    try {
      range.surroundContents(span);
      handleEditorInput();
    } catch {
      execCmd('fontSize', '4');
    }
  };

  // Text Color
  const applyColor = (color: string) => {
    setShowColorPicker(false);
    execCmd('foreColor', color);
  };

  // Highlight Background Color
  const applyHighlight = (color: string) => {
    setShowHighlightPicker(false);
    execCmd('hiliteColor', color);
  };

  // Open Link Modal
  const handleOpenLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    setLinkText(selectedText);
    setLinkUrl('');
    setLinkNewTab(true);
    setShowLinkModal(true);
  };

  // Insert Link
  const handleInsertLink = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!linkUrl.trim()) {
      toast.error("সঠিক লিঙ্ক (URL) দিন");
      return;
    }

    let safeUrl = linkUrl.trim();
    if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(safeUrl)) {
      safeUrl = `https://${safeUrl}`;
    }

    restoreSelection();
    editorRef.current?.focus();

    if (linkText.trim()) {
      const linkHtml = `<a href="${safeUrl}" ${linkNewTab ? 'target="_blank" rel="noopener noreferrer"' : ''} class="text-emerald-700 underline font-semibold hover:text-emerald-800">${linkText.trim()}</a>`;
      execCmd('insertHTML', linkHtml);
    } else {
      execCmd('createLink', safeUrl);
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    toast.success("লিঙ্ক যুক্ত করা হয়েছে!");
  };

  // Remove Link
  const handleRemoveLink = () => {
    execCmd('unlink');
    toast.success("লিঙ্ক মুছে ফেলা হয়েছে");
  };

  // Image Upload & Insert
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict format check: ONLY JPG, JPEG, PNG, WEBP. Reject SVG!
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) || file.name.toLowerCase().endsWith('.svg')) {
      toast.error("শুধুমাত্র JPG, JPEG, PNG এবং WEBP ছবি নির্বাচন করুন। (SVG সমর্থিত নয়)");
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ছবির আকার সর্বোচ্চ ১০ মেগাবাইট হতে পারবে");
      return;
    }

    setImageUploading(true);
    setUploadProgress(15);

    try {
      const { uploadPostMedia } = await import('../../services/firebaseStorageService');
      const res = await uploadPostMedia(userId, file, undefined, (percent) => 
        setUploadProgress(Math.min(95, Math.max(20, percent)))
      );
      if (res && res.downloadUrl) {
        setImageUrl(res.downloadUrl);
        setUploadProgress(100);
        toast.success("ছবি সফলভাবে আপলোড হয়েছে!");
        setImageUploading(false);
        return;
      }
    } catch (err) {
      console.warn("Storage upload fallback to client compression:", err);
    }

    // Client-side fallback compression with Canvas
    try {
      setUploadProgress(60);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.85);
            setImageUrl(compressed);
          } else {
            setImageUrl(event.target?.result as string);
          }
          setUploadProgress(100);
          toast.success("ছবি প্রসেস সম্পন্ন হয়েছে!");
          setImageUploading(false);
        };
        img.onerror = () => {
          setImageUrl(event.target?.result as string);
          setUploadProgress(100);
          setImageUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error("ছবি প্রসেস করতে সমস্যা হয়েছে");
      setImageUploading(false);
      setUploadProgress(0);
    }
  };

  // Insert Image into Editor Content
  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      toast.error("কোনো ছবি পাওয়া যায়নি");
      return;
    }

    restoreSelection();
    editorRef.current?.focus();

    const alignClass = 
      imageAlign === 'left' ? 'float-left mr-4 mb-3' :
      imageAlign === 'right' ? 'float-right ml-4 mb-3' :
      'mx-auto block';

    const figureHtml = `
      <figure class="my-4 ${alignClass}" style="max-width: ${imageWidth};">
        <img 
          src="${imageUrl}" 
          alt="${imageAlt.trim() || 'সংবাদের ছবি'}" 
          class="rounded-2xl max-w-full h-auto shadow-sm border border-slate-200/80" 
          loading="lazy"
        />
        ${imageCaption.trim() ? `<figcaption class="text-xs text-slate-500 text-center font-medium mt-1.5 italic">${imageCaption.trim()}</figcaption>` : ''}
      </figure>
      <p><br></p>
    `;

    execCmd('insertHTML', figureHtml);
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
    setUploadProgress(0);
    toast.success("ছবি সংবাদের মধ্যে যুক্ত হয়েছে!");
  };

  // Insert Video Embed
  const handleInsertVideo = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const embedUrl = getSafeVideoEmbedUrl(videoUrl);
    if (!embedUrl) {
      toast.error("অনুগ্রহ করে একটি সঠিক YouTube বা Vimeo লিঙ্ক দিন");
      return;
    }

    restoreSelection();
    editorRef.current?.focus();

    const videoHtml = `
      <div class="my-4 w-full aspect-video rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-950">
        <iframe 
          src="${embedUrl}" 
          class="w-full h-full" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen="true"
        ></iframe>
      </div>
      <p><br></p>
    `;

    execCmd('insertHTML', videoHtml);
    setShowVideoModal(false);
    setVideoUrl('');
    toast.success("ভিডিও যুক্ত করা হয়েছে!");
  };

  // Insert Table
  const handleInsertTable = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    restoreSelection();
    editorRef.current?.focus();

    const rows = Math.min(10, Math.max(1, tableRows));
    const cols = Math.min(10, Math.max(1, tableCols));

    let tableHtml = `<div class="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs"><table class="w-full text-xs sm:text-sm text-left border-collapse"><thead><tr class="bg-emerald-50 text-emerald-950 border-b border-emerald-200 font-bold">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th class="p-2.5 sm:p-3 border-r border-emerald-200 last:border-r-0">কলাম ${toBengaliNumber(c)}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr class="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/80">`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td class="p-2.5 sm:p-3 border-r border-slate-200 last:border-r-0 text-slate-700">তথ্য...</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table></div><p><br></p>`;

    execCmd('insertHTML', tableHtml);
    setShowTableModal(false);
    toast.success("টেবিল যুক্ত করা হয়েছে!");
  };

  // Switch between Visual & HTML Code View
  const handleTabSwitch = (tab: 'visual' | 'code') => {
    if (tab === 'code') {
      if (editorRef.current) {
        setCodeValue(editorRef.current.innerHTML);
      }
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML = codeValue;
        onChange(codeValue);
      }
    }
    setActiveTab(tab);
  };

  // Word count & statistics
  const plainText = useMemo(() => {
    return extractPlainText(value || '');
  }, [value]);

  const wordCount = useMemo(() => {
    if (!plainText.trim()) return 0;
    return plainText.trim().split(/\s+/).length;
  }, [plainText]);

  const charCount = plainText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className="w-full space-y-1.5 font-sans">
      
      {/* Editor Header Bar with Label & View Tabs */}
      <div className="flex items-center justify-between pb-1">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>

        {/* Visual / Code Switcher */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => handleTabSwitch('visual')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-white text-emerald-800 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ভিজ্যুয়াল (Visual)</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('code')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white text-emerald-800 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>এইচটিএমএল (Code)</span>
          </button>
        </div>
      </div>

      {/* Main Editor Wrapper */}
      <div className={`relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
        disabled ? 'opacity-60 pointer-events-none' : 'border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20'
      }`}>
        
        {/* ========================================================================= */}
        {/* WORDPRESS TOOLBAR                                                         */}
        {/* ========================================================================= */}
        {activeTab === 'visual' && (
          <div className="bg-slate-50 border-b border-slate-200 p-1.5 sm:p-2 select-none">
            {/* Scrollable on Android / Mobile */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin scrollbar-thumb-slate-300">

              {/* Group 1: Undo & Redo */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
                <button
                  type="button"
                  onClick={() => execCmd('undo')}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="পূর্বাবস্থায় ফিরুন (Undo)"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('redo')}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="পুনরায় করুন (Redo)"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group 2: Headings Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowHeadingMenu(!showHeadingMenu);
                    setShowFontSizeMenu(false);
                    setShowColorPicker(false);
                    setShowHighlightPicker(false);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 shadow-3xs cursor-pointer"
                  title="শিরোনাম / ফরম্যাট"
                >
                  <Type className="w-3.5 h-3.5 text-emerald-600" />
                  <span>হেডিং</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showHeadingMenu && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => applyHeading('p')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      সাধারণ প্যারাগ্রাফ (P)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyHeading('h1')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-base font-black text-slate-900 cursor-pointer flex items-center gap-1.5"
                    >
                      <Heading1 className="w-4 h-4 text-emerald-600" />
                      <span>বড় শিরোনাম (H1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyHeading('h2')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-sm font-bold text-slate-900 cursor-pointer flex items-center gap-1.5"
                    >
                      <Heading2 className="w-4 h-4 text-emerald-600" />
                      <span>মাঝারি শিরোনাম (H2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyHeading('h3')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5"
                    >
                      <Heading3 className="w-4 h-4 text-emerald-600" />
                      <span>ছোট শিরোনাম (H3)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyHeading('blockquote')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs italic text-slate-700 cursor-pointer flex items-center gap-1.5 border-t border-slate-100 mt-1"
                    >
                      <Quote className="w-4 h-4 text-emerald-600" />
                      <span>উদ্ধৃতি (Blockquote)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Group 3: Font Size */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowFontSizeMenu(!showFontSizeMenu);
                    setShowHeadingMenu(false);
                    setShowColorPicker(false);
                    setShowHighlightPicker(false);
                  }}
                  className="px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 shadow-3xs cursor-pointer"
                  title="ফন্টের আকার"
                >
                  <span>সাইজ</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showFontSizeMenu && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => applyFontSize('13px')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-700 cursor-pointer text-[12px]"
                    >
                      ছোট (Small)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFontSize('16px')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-bold text-slate-800 cursor-pointer text-sm"
                    >
                      সাধারণ (Normal)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFontSize('20px')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-black text-slate-900 cursor-pointer text-base"
                    >
                      বড় (Large)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFontSize('24px')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-black text-slate-900 cursor-pointer text-lg"
                    >
                      বিশাল (Huge)
                    </button>
                  </div>
                )}
              </div>

              {/* Group 4: Text Styles (Bold, Italic, Underline, Strikethrough) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
                <button
                  type="button"
                  onClick={() => execCmd('bold')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.bold ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="বোল্ড (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('italic')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.italic ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="ইটালিক (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('underline')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.underline ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="আন্ডারলাইন (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('strikeThrough')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.strikethrough ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="স্ট্রাইকথ্রু"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group 5: Text Color & Highlight */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
                {/* Text Color */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      setShowHighlightPicker(false);
                      setShowHeadingMenu(false);
                      setShowFontSizeMenu(false);
                    }}
                    className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex items-center gap-0.5"
                    title="টেক্সট কালার"
                  >
                    <Palette className="w-3.5 h-3.5 text-emerald-700" />
                  </button>

                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-30 space-y-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">রং নির্বাচন করুন</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => applyColor(c.value)}
                            style={{ backgroundColor: c.value }}
                            className="w-7 h-7 rounded-lg border border-slate-300 hover:scale-110 transition-transform cursor-pointer shadow-3xs"
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Highlight Color */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHighlightPicker(!showHighlightPicker);
                      setShowColorPicker(false);
                      setShowHeadingMenu(false);
                      setShowFontSizeMenu(false);
                    }}
                    className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex items-center gap-0.5"
                    title="ব্যাকগ্রাউন্ড হাইলাইট কালার"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                  </button>

                  {showHighlightPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-30 space-y-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">হাইলাইট কালার</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {PRESET_HIGHLIGHTS.map(h => (
                          <button
                            key={h.value}
                            type="button"
                            onClick={() => applyHighlight(h.value)}
                            style={{ backgroundColor: h.value }}
                            className="w-6 h-6 rounded-lg border border-slate-300 hover:scale-110 transition-transform cursor-pointer shadow-3xs"
                            title={h.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group 6: Alignment */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
                <button
                  type="button"
                  onClick={() => execCmd('justifyLeft')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.justifyLeft ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="বামে সাজান (Left Align)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('justifyCenter')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.justifyCenter ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="মাঝখানে সাজান (Center Align)"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('justifyRight')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.justifyRight ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="ডানে সাজান (Right Align)"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('justifyFull')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.justifyFull ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="উভয় পাশে সমান (Justify)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group 7: Lists, Indent, Outdent, Quote */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
                <button
                  type="button"
                  onClick={() => execCmd('insertUnorderedList')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.insertUnorderedList ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="বুলেট লিস্ট"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('insertOrderedList')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    activeFormats.insertOrderedList ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="নম্বর লিস্ট"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('indent')}
                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="ডানে সরান (Indent)"
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('outdent')}
                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="বামে সরান (Outdent)"
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('formatBlock', '<blockquote>')}
                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="উদ্ধৃতি (Blockquote)"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group 8: Media & Inserts (Link, Image, Video, Table, Divider) */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
                <button
                  type="button"
                  onClick={handleOpenLinkModal}
                  className="p-1.5 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="লিঙ্ক যুক্ত করুন"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  className="p-1.5 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="লিঙ্ক অপসারণ"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveSelection();
                    setShowImageModal(true);
                  }}
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                  title="সংবাদের মাঝে ছবি যুক্ত করুন"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">ছবি</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveSelection();
                    setShowVideoModal(true);
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                  title="YouTube / ভিডিও যুক্ত করুন"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">ভিডিও</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveSelection();
                    setShowTableModal(true);
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  title="টেবিল যুক্ত করুন"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCmd('insertHorizontalRule')}
                  className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="অনুভূমিক রেখা (Horizontal Divider)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group 9: Clear Formatting */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
                <button
                  type="button"
                  onClick={() => execCmd('removeFormat')}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="ফরম্যাটিং মুছুন (Clear Formatting)"
                >
                  <RemoveFormatting className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EDITABLE CANVAS / HTML CODE VIEW                                          */}
        {/* ========================================================================= */}
        {activeTab === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleEditorInput}
            onKeyUp={checkActiveFormats}
            onMouseUp={checkActiveFormats}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className="p-3.5 sm:p-5 text-slate-800 text-sm sm:text-base leading-relaxed focus:outline-none overflow-y-auto max-h-[550px] space-y-3 font-normal prose-emerald [&_p]:mb-3 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-slate-900 [&_h1]:my-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-800 [&_h3]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-600 [&_blockquote]:bg-emerald-50/50 [&_blockquote]:p-3 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:rounded-r-xl [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-emerald-50 [&_th]:p-2 [&_th]:border [&_th]:border-slate-300 [&_td]:p-2 [&_td]:border [&_td]:border-slate-300 [&_figure]:my-4 [&_img]:rounded-xl [&_img]:max-w-full [&_hr]:my-4 [&_hr]:border-slate-200"
          />
        ) : (
          <textarea
            value={codeValue}
            onChange={(e) => {
              setCodeValue(e.target.value);
              onChange(e.target.value);
            }}
            style={{ minHeight }}
            rows={12}
            className="w-full p-4 font-mono text-xs sm:text-sm text-slate-800 bg-slate-900/5 focus:outline-none leading-relaxed resize-y border-none"
            placeholder="<p>এখানে সরাসরি এইচটিএমএল (HTML) কোড লিখতে পারেন...</p>"
          />
        )}

        {/* ========================================================================= */}
        {/* WORDPRESS STATUS BAR (Character & Word Count, Reading Time)               */}
        {/* ========================================================================= */}
        <div className="bg-slate-50/90 border-t border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-semibold text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span>মোট শব্দ: <strong className="text-slate-800">{toBengaliNumber(wordCount)}</strong></span>
            <span>অক্ষর: <strong className="text-slate-800">{toBengaliNumber(charCount)}</strong></span>
            <span className="hidden sm:inline">পড়ার আনুমানিক সময়: <strong className="text-emerald-700">{toBengaliNumber(readingTimeMinutes)} মিনিট</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>এডিটর সক্রিয়</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. LINK INSERT MODAL                                                      */}
      {/* ========================================================================= */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-emerald-600" />
                <span>হাইপারলিঙ্ক যুক্ত করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="space-y-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertLink(e);
                }
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">লিঙ্ক টেক্সট (প্রদর্শন নাম)</label>
                <input
                  type="text"
                  placeholder="উদা: বিস্তারিত পড়ুন"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ওয়েব ঠিকানা (URL) *</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="link-new-tab"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="link-new-tab" className="text-xs font-bold text-slate-700 cursor-pointer">
                  নতুন ট্যাবে খুলুন (Open in new tab)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>যুক্ত করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. IMAGE INSERT MODAL                                                     */}
      {/* ========================================================================= */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>সংবাদের মাঝে ছবি যুক্ত করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-3">
              <label className="block p-4 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/40 text-center hover:bg-emerald-50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageFileSelect}
                  disabled={imageUploading}
                />
                {imageUploading ? (
                  <div className="space-y-2 py-2">
                    <Loader2 className="w-7 h-7 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-emerald-800">ছবি আপলোড হচ্ছে... ({toBengaliNumber(uploadProgress)}%)</p>
                    <div className="w-full bg-emerald-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 py-1">
                    <Upload className="w-7 h-7 text-emerald-600 mx-auto" />
                    <p className="text-xs font-black text-slate-800">ছবি আপলোড করতে ক্লিক করুন</p>
                    <p className="text-[11px] text-slate-500">শুধুমাত্র JPG, PNG, WEBP (সর্বোচ্চ ১০ মেগাবাইট, SVG নিষিদ্ধ)</p>
                  </div>
                )}
              </label>

              {/* Or Direct Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">অথবা ছবির সরাসরি লিঙ্ক (URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="p-2 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                  <div className="relative rounded-xl overflow-hidden max-h-40 bg-slate-900/5">
                    <img src={imageUrl} alt="প্রিভিউ" className="w-full h-full object-cover" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">ছবির প্রস্থ (Width)</label>
                      <select
                        value={imageWidth}
                        onChange={(e) => setImageWidth(e.target.value as any)}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="100%">পূর্ণ প্রস্থ (১০০%)</option>
                        <option value="75%">মাঝারি (৭৫%)</option>
                        <option value="50%">ছোট (৫০%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600">অবস্থান (Alignment)</label>
                      <select
                        value={imageAlign}
                        onChange={(e) => setImageAlign(e.target.value as any)}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="center">মাঝখানে (Center)</option>
                        <option value="left">বামে (Left float)</option>
                        <option value="right">ডানে (Right float)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">ছবির ক্যাপশন / বিবরণ (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder="উদা: পুঠিয়া রাজবাড়ী চত্বরে অনুষ্ঠিত সভা"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={!imageUrl || imageUploading}
                  onClick={handleInsertImage}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>সংবাদে যুক্ত করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIDEO INSERT MODAL (Safe YouTube / Vimeo only)                          */}
      {/* ========================================================================= */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <Video className="w-4 h-4 text-red-600" />
                <span>ভিডিও যুক্ত করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="space-y-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertVideo(e);
                }
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">YouTube / Vimeo ভিডিও লিঙ্ক *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400">নিরাপত্তার স্বার্থে শুধুমাত্র যাচাইকৃত YouTube ও Vimeo ভিডিও লিঙ্ক সমর্থিত।</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleInsertVideo}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ভিডিও যোগ করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TABLE INSERT MODAL                                                     */}
      {/* ========================================================================= */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-xs shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>টেবিল যুক্ত করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="space-y-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertTable(e);
                }
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">সারি (Rows)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">কলাম (Columns)</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleInsertTable}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>তৈরি করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WordPressRichEditor;
