import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  MessageSquare, 
  User, 
  Image as ImageIcon, 
  Video, 
  Mail, 
  Ban, 
  Eye, 
  EyeOff, 
  Trash2, 
  AlertOctagon, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink, 
  Send, 
  Phone, 
  Calendar, 
  Check, 
  X, 
  Sparkles,
  Lock,
  Unlock,
  Radio,
  UserX,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  getDoc 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAuditActivity } from '../../services/auditLogger';
import toast from 'react-hot-toast';

// 7 Report Categories
export type ReportCategoryType = 
  | 'all'
  | 'post'
  | 'comment'
  | 'user'
  | 'photo'
  | 'video'
  | 'message'
  | 'fake_spam';

export type ReportLifecycleStatus = 
  | 'pending'
  | 'reviewed'
  | 'warned'
  | 'hidden'
  | 'deleted'
  | 'suspended'
  | 'banned'
  | 'dismissed';

export interface ComprehensiveReportItem {
  id: string; // Ticket or Report ID
  reportType: 'post' | 'comment' | 'user' | 'photo' | 'video' | 'message' | 'fake_spam';
  title?: string;
  reason: string;
  reasonBangla: string;
  details?: string;
  contentId: string;
  contentSnippet?: string;
  contentMediaUrl?: string;
  
  // Target / Author info
  targetUid: string;
  targetName: string;
  targetUsername?: string;
  targetPhone?: string;
  targetEmail?: string;
  targetAvatar?: string;
  
  // Reporter info
  reporterUid: string;
  reporterName: string;
  reporterAvatar?: string;
  reporterPhone?: string;
  
  // Status & Priority
  status: ReportLifecycleStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Moderator Notes & Actions
  reviewedBy?: string;
  reviewedAt?: string;
  warningGiven?: string;
  suspendDurationDays?: number;
  
  createdAt: string;
  updatedAt?: string;
}

// Bengali number helper
const toBn = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
};

export const ReportsAndModerationHub: React.FC = () => {
  const { user, userProfile } = useAuth();

  // States
  const [reports, setReports] = useState<ComprehensiveReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ReportCategoryType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_action' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals & Action Drawers
  const [selectedReport, setSelectedReport] = useState<ComprehensiveReportItem | null>(null);
  
  // 1. Warning Modal
  const [warningModalReport, setWarningModalReport] = useState<ComprehensiveReportItem | null>(null);
  const [warningText, setWarningText] = useState('কমিউনিটি গাইডলাইন লঙ্ঘনের জন্য আপনাকে সতর্ক করা হচ্ছে। অনুগ্রহ করে প্ল্যাটফর্মের নিয়মাবলী মেনে চলুন।');

  // 2. Suspend Modal
  const [suspendModalReport, setSuspendModalReport] = useState<ComprehensiveReportItem | null>(null);
  const [suspendDays, setSuspendDays] = useState(7);
  const [suspendReason, setSuspendReason] = useState('একাধিক অভিযোগ ও প্ল্যাটফর্ম নীতি লঙ্ঘনের কারণে সাময়িক স্থগিত করা হলো।');

  // 3. Ban Modal
  const [banModalReport, setBanModalReport] = useState<ComprehensiveReportItem | null>(null);
  const [banReason, setBanReason] = useState('গুরুতর স্প্যামিং, ফেক প্রোফাইল বা অশোভন কার্যকলাপের কারণে স্থায়ী বহিষ্কার।');

  // 4. Delete Confirmation Modal
  const [deleteModalReport, setDeleteModalReport] = useState<ComprehensiveReportItem | null>(null);

  // 1. Real-time Firestore Listeners (listening to both 'reports' and 'moderation_cases')
  useEffect(() => {
    setLoading(true);
    try {
      const reportsQuery = query(collection(db, 'reports'), limit(300));
      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        const list: ComprehensiveReportItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          
          // Map raw type to 7 categories
          let mappedType: 'post' | 'comment' | 'user' | 'photo' | 'video' | 'message' | 'fake_spam' = 'post';
          const rawType = (d.contentType || d.type || '').toLowerCase();
          const rawReason = (d.reason || d.reasonId || d.category || '').toLowerCase();

          if (rawReason.includes('fake') || rawReason.includes('spam') || rawReason.includes('scam')) {
            mappedType = 'fake_spam';
          } else if (rawType.includes('comment') || rawType.includes('reply')) {
            mappedType = 'comment';
          } else if (rawType.includes('user') || rawType.includes('profile') || rawType.includes('account')) {
            mappedType = 'user';
          } else if (rawType.includes('image') || rawType.includes('photo')) {
            mappedType = 'photo';
          } else if (rawType.includes('video') || rawType.includes('reel') || rawType.includes('story')) {
            mappedType = 'video';
          } else if (rawType.includes('message') || rawType.includes('chat')) {
            mappedType = 'message';
          } else {
            mappedType = 'post';
          }

          list.push({
            id: docSnap.id,
            reportType: mappedType,
            title: d.contentTitle || d.title || 'ফ্ল্যাগড কন্টেন্ট',
            reason: d.reason || d.reasonLabel || 'অশোভন আচরণ বা নিয়ম লঙ্ঘন',
            reasonBangla: d.reasonBangla || d.reasonLabel || d.reason || 'কমিউনিটি নিয়ম লঙ্ঘন',
            details: d.details || d.description || '',
            contentId: d.contentId || d.targetId || docSnap.id,
            contentSnippet: d.contentSnippet || d.snippet || d.text || '',
            contentMediaUrl: d.mediaUrl || d.photoUrl || (d.mediaUrls && d.mediaUrls[0]) || '',
            
            targetUid: d.contentAuthorUid || d.targetUid || 'unknown_target',
            targetName: d.contentAuthorName || d.targetName || 'অজ্ঞাত ইউজার',
            targetUsername: d.contentAuthorUsername || d.targetUsername || '',
            targetPhone: d.targetPhone || '',
            targetEmail: d.targetEmail || '',
            targetAvatar: d.contentAuthorAvatar || d.targetAvatar || '',
            
            reporterUid: d.reporterUid || 'unknown_reporter',
            reporterName: d.reporterName || 'সচেতন নাগরিক',
            reporterAvatar: d.reporterAvatar || '',
            reporterPhone: d.reporterPhone || '',
            
            status: (d.status as ReportLifecycleStatus) || (d.isResolved ? 'reviewed' : 'pending'),
            priority: (d.priority as any) || 'medium',
            
            reviewedBy: d.reviewedBy || '',
            reviewedAt: d.reviewedAt || '',
            warningGiven: d.warningGiven || '',
            suspendDurationDays: d.suspendDurationDays || 0,
            
            createdAt: d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt : new Date(d.createdAt.seconds * 1000).toISOString()) : new Date().toISOString(),
            updatedAt: d.updatedAt ? (typeof d.updatedAt === 'string' ? d.updatedAt : new Date(d.updatedAt.seconds * 1000).toISOString()) : undefined,
          });
        });

        // Default Model Seeding if empty
        if (list.length === 0) {
          list.push(
            {
              id: 'RPT-2026-00101',
              reportType: 'post',
              title: 'ভুল ও বিভ্রান্তিকর তথ্য প্রচার',
              reason: 'Misleading information',
              reasonBangla: 'ভুল ও বিভ্রান্তিকর পোস্ট',
              details: 'পুঠিয়া বাজারের নির্ধারিত দ্রব্যমূল্য সম্পর্কে অসত্য তথ্য পোস্ট করা হয়েছে।',
              contentId: 'post_01',
              contentSnippet: 'জরুরি নোটিশ: আগামীকাল থেকে বাজারের সকল পাইকারি দোকান অনির্দিষ্টকালের জন্য বন্ধ থাকবে...',
              targetUid: 'usr_mock_1',
              targetName: 'সাইফুল ইসলাম',
              targetUsername: 'saiful_puthia',
              reporterUid: 'usr_reporter_1',
              reporterName: 'আব্দুর রহিম',
              status: 'pending',
              priority: 'high',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
            },
            {
              id: 'RPT-2026-00102',
              reportType: 'comment',
              title: 'অশালীন ও অবমাননাকর মন্তব্য',
              reason: 'Harassment & Abuse',
              reasonBangla: 'গালাগালি ও সাইবার বুলিং',
              details: 'নাগরিক সেবা পোস্টের নিচে ব্যক্তিগত আক্রমণাত্মক মন্তব্য করা হয়েছে।',
              contentId: 'com_02',
              contentSnippet: 'এই সেবাগুলো সম্পূর্ণ ভুয়া এবং আপনারা সবাই প্রতারক...',
              targetUid: 'usr_mock_2',
              targetName: 'রফিকুল হাসান',
              targetUsername: 'rafiq_99',
              reporterUid: 'usr_reporter_2',
              reporterName: 'নাজমা বেগম',
              status: 'pending',
              priority: 'medium',
              createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
            },
            {
              id: 'RPT-2026-00103',
              reportType: 'fake_spam',
              title: 'ভুয়া লটারি ও ফিশিং লিংক',
              reason: 'Spam & Scam Link',
              reasonBangla: 'ফিশিং ও স্প্যাম লিংক প্রচার',
              details: 'ফ্রি মোবাইল রিচার্জ দেওয়ার নামে ক্ষতিকর ফিশিং ওয়েবসাইট ছড়ানো হচ্ছে।',
              contentId: 'post_spam_03',
              contentSnippet: '৫০০ টাকা ফ্রি রিচার্জ পেতে এখনই এই লিংকে ক্লিক করুন ও ফর্ম পূরণ করুন...',
              targetUid: 'usr_mock_3',
              targetName: 'ফ্রি অফার বিডি',
              targetUsername: 'free_offer_bot',
              reporterUid: 'usr_reporter_3',
              reporterName: 'মো. তরিকুল',
              status: 'pending',
              priority: 'critical',
              createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
            },
            {
              id: 'RPT-2026-00104',
              reportType: 'photo',
              title: 'কপিরাইট ও অনুপযুক্ত ছবি',
              reason: 'Inappropriate Image',
              reasonBangla: 'অনুপযুক্ত ছবি পোস্ট',
              details: 'ব্যক্তির অনুমতি ছাড়া ব্যক্তিগত ছবি আপলোড করা হয়েছে।',
              contentId: 'photo_04',
              contentSnippet: 'অনুসন্ধানী ছবি ও প্রমাণপত্র...',
              contentMediaUrl: '/logo.svg', 
              targetUid: 'usr_mock_4',
              targetName: 'কামাল হোসেন',
              targetUsername: 'kamal_h',
              reporterUid: 'usr_reporter_4',
              reporterName: 'সুমন আহমেদ',
              status: 'reviewed',
              priority: 'medium',
              createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
            }
          );
        }

        setReports(list);
        setLoading(false);
      }, (err) => {
        console.error('Firestore reports error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // 1. Category Filter
      if (activeCategory !== 'all' && r.reportType !== activeCategory) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter === 'pending' && r.status !== 'pending') return false;
      if (statusFilter === 'in_action' && !['reviewed', 'warned', 'hidden'].includes(r.status)) return false;
      if (statusFilter === 'resolved' && !['deleted', 'suspended', 'banned', 'dismissed'].includes(r.status)) return false;

      // 3. Priority Filter
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.id.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.reasonBangla.toLowerCase().includes(q) ||
          r.targetName.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q) ||
          (r.contentSnippet && r.contentSnippet.toLowerCase().includes(q))
        );
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports, activeCategory, statusFilter, priorityFilter, searchQuery]);

  // Metric Counts
  const counts = useMemo(() => {
    return {
      all: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      post: reports.filter(r => r.reportType === 'post').length,
      comment: reports.filter(r => r.reportType === 'comment').length,
      user: reports.filter(r => r.reportType === 'user').length,
      photo: reports.filter(r => r.reportType === 'photo').length,
      video: reports.filter(r => r.reportType === 'video').length,
      message: reports.filter(r => r.reportType === 'message').length,
      fake_spam: reports.filter(r => r.reportType === 'fake_spam').length,
    };
  }, [reports]);

  // ---------------- 6-STEP ACTION HANDLERS ---------------- //

  // 1. Step 1: Review (তদন্ত ও রিভিউ শুরু)
  const handleReviewAction = async (report: ComprehensiveReportItem) => {
    setActionLoading(true);
    try {
      const reportRef = doc(db, 'reports', report.id);
      await updateDoc(reportRef, {
        status: 'reviewed',
        reviewedBy: userProfile?.name || 'সুপার এডমিন',
        reviewedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });

      await logAuditActivity({
        action: 'MODERATION_REVIEW_STARTED',
        details: `সুপার এডমিন রিপোর্ট ${report.id} এর রিভিউ শুরু করেছেন (টার্গেট: ${report.targetName})`,
        category: 'security',
        severity: 'info',
        targetType: 'report',
        targetId: report.id,
        targetName: report.targetName
      });

      toast.success(`🔍 রিপোর্ট #${report.id} সফলভাবে রিভিউ তালিকায় যুক্ত করা হয়েছে`);
      if (selectedReport?.id === report.id) {
        setSelectedReport({ ...selectedReport, status: 'reviewed' });
      }
    } catch (err) {
      toast.error('রিভিউ স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Step 2: Warning (সতর্কবার্তা প্রেরণ)
  const handleConfirmWarning = async () => {
    if (!warningModalReport) return;
    setActionLoading(true);
    try {
      // Update report status
      const reportRef = doc(db, 'reports', warningModalReport.id);
      await updateDoc(reportRef, {
        status: 'warned',
        warningGiven: warningText,
        updatedAt: serverTimestamp()
      });

      // Update target user warning count
      if (warningModalReport.targetUid && warningModalReport.targetUid !== 'unknown_target') {
        const userRef = doc(db, 'users', warningModalReport.targetUid);
        await updateDoc(userRef, {
          warningsCount: (warningModalReport as any).warningsCount ? (warningModalReport as any).warningsCount + 1 : 1,
          lastWarningReason: warningText,
          updatedAt: serverTimestamp()
        });
      }

      await logAuditActivity({
        action: 'ISSUE_USER_WARNING',
        details: `সুপার এডমিন ${warningModalReport.targetName}-কে অফিশিয়াল সতর্কবার্তা পাঠিয়েছেন: "${warningText}"`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: warningModalReport.targetUid,
        targetName: warningModalReport.targetName
      });

      toast.success(`⚠️ ${warningModalReport.targetName}-কে সফলভাবে সতর্কবার্তা পাঠানো হয়েছে!`);
      setWarningModalReport(null);
      if (selectedReport?.id === warningModalReport.id) {
        setSelectedReport({ ...selectedReport, status: 'warned', warningGiven: warningText });
      }
    } catch (err) {
      toast.error('সতর্কবার্তা পাঠাতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Step 3: Hide (কন্টেন্ট টাইমলাইন থেকে লুকানো)
  const handleHideAction = async (report: ComprehensiveReportItem) => {
    setActionLoading(true);
    try {
      const reportRef = doc(db, 'reports', report.id);
      await updateDoc(reportRef, {
        status: 'hidden',
        isContentHidden: true,
        updatedAt: serverTimestamp()
      });

      // If it's a post, mark post as hidden
      if (report.contentId && report.reportType === 'post') {
        const postRef = doc(db, 'posts', report.contentId);
        await updateDoc(postRef, {
          isHidden: true,
          moderatedAt: serverTimestamp()
        });
      }

      await logAuditActivity({
        action: 'HIDE_MODERATED_CONTENT',
        details: `সুপার এডমিন রিপোর্ট #${report.id} এর কন্টেন্ট (${report.reportType}) জনসমক্ষে প্রদর্শন থেকে লুকিয়েছেন`,
        category: 'security',
        severity: 'warning',
        targetType: 'post',
        targetId: report.contentId,
        targetName: report.title
      });

      toast.success(`👁️‍🗨️ কন্টেন্টটি ফিড ও টাইমলাইন থেকে সফলভাবে লুকানো (Hide) হয়েছে`);
      if (selectedReport?.id === report.id) {
        setSelectedReport({ ...selectedReport, status: 'hidden' });
      }
    } catch (err) {
      toast.error('কন্টেন্ট লুকাতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Step 4: Delete (কন্টেন্ট স্থায়ীভাবে ডিলিট)
  const handleConfirmDelete = async () => {
    if (!deleteModalReport) return;
    setActionLoading(true);
    try {
      // Update report status
      const reportRef = doc(db, 'reports', deleteModalReport.id);
      await updateDoc(reportRef, {
        status: 'deleted',
        isContentDeleted: true,
        updatedAt: serverTimestamp()
      });

      // Try delete from posts / comments collection if applicable
      if (deleteModalReport.contentId) {
        if (deleteModalReport.reportType === 'post') {
          await deleteDoc(doc(db, 'posts', deleteModalReport.contentId));
        } else if (deleteModalReport.reportType === 'comment') {
          await deleteDoc(doc(db, 'comments', deleteModalReport.contentId));
        }
      }

      await logAuditActivity({
        action: 'DELETE_MODERATED_CONTENT',
        details: `সুপার এডমিন রিপোর্ট #${deleteModalReport.id} এর কন্টেন্ট স্থায়ীভাবে মুছে ফেলেছেন`,
        category: 'security',
        severity: 'critical',
        targetType: 'post',
        targetId: deleteModalReport.contentId
      });

      toast.success(`🗑️ কন্টেন্টটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে`);
      setDeleteModalReport(null);
      if (selectedReport?.id === deleteModalReport.id) {
        setSelectedReport({ ...selectedReport, status: 'deleted' });
      }
    } catch (err) {
      toast.error('কন্টেন্ট ডিলিট করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Step 5: Suspend (ইউজার সাময়িক স্থগিত)
  const handleConfirmSuspend = async () => {
    if (!suspendModalReport) return;
    setActionLoading(true);
    try {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + suspendDays);

      // 1. Update report
      const reportRef = doc(db, 'reports', suspendModalReport.id);
      await updateDoc(reportRef, {
        status: 'suspended',
        suspendDurationDays: suspendDays,
        updatedAt: serverTimestamp()
      });

      // 2. Suspend target user
      if (suspendModalReport.targetUid && suspendModalReport.targetUid !== 'unknown_target') {
        const userRef = doc(db, 'users', suspendModalReport.targetUid);
        await updateDoc(userRef, {
          status: 'suspended',
          statusReason: suspendReason,
          suspendedUntil: untilDate.toISOString(),
          updatedAt: serverTimestamp()
        });
      }

      await logAuditActivity({
        action: 'SUSPEND_USER_FROM_REPORT',
        details: `সুপার এডমিন রিপোর্ট #${suspendModalReport.id} এর ভিত্তিতে ${suspendModalReport.targetName}-কে ${toBn(suspendDays)} দিনের জন্য স্থগিত করেছেন`,
        category: 'security',
        severity: 'warning',
        targetType: 'user',
        targetId: suspendModalReport.targetUid,
        targetName: suspendModalReport.targetName
      });

      toast.success(`⏳ ${suspendModalReport.targetName}-কে ${toBn(suspendDays)} দিনের জন্য স্থগিত করা হলো`);
      setSuspendModalReport(null);
      if (selectedReport?.id === suspendModalReport.id) {
        setSelectedReport({ ...selectedReport, status: 'suspended', suspendDurationDays: suspendDays });
      }
    } catch (err) {
      toast.error('স্থগিত করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Step 6: Ban (ইউজার স্থায়ী বহিষ্কার ও ব্লক)
  const handleConfirmBan = async () => {
    if (!banModalReport) return;
    setActionLoading(true);
    try {
      // 1. Update report
      const reportRef = doc(db, 'reports', banModalReport.id);
      await updateDoc(reportRef, {
        status: 'banned',
        updatedAt: serverTimestamp()
      });

      // 2. Permanently ban target user
      if (banModalReport.targetUid && banModalReport.targetUid !== 'unknown_target') {
        const userRef = doc(db, 'users', banModalReport.targetUid);
        await updateDoc(userRef, {
          status: 'banned',
          isBlocked: true,
          statusReason: banReason,
          updatedAt: serverTimestamp()
        });
      }

      await logAuditActivity({
        action: 'BAN_USER_FROM_REPORT',
        details: `সুপার এডমিন রিপোর্ট #${banModalReport.id} এর ভিত্তিতে ${banModalReport.targetName}-কে স্থায়ীভাবে ব্যান ও ব্লক করেছেন`,
        category: 'security',
        severity: 'critical',
        targetType: 'user',
        targetId: banModalReport.targetUid,
        targetName: banModalReport.targetName
      });

      toast.success(`🚫 ${banModalReport.targetName}-কে স্থায়ীভাবে ব্যান ও ব্লক করা হয়েছে`);
      setBanModalReport(null);
      if (selectedReport?.id === banModalReport.id) {
        setSelectedReport({ ...selectedReport, status: 'banned' });
      }
    } catch (err) {
      toast.error('ব্যান করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Dismiss / No Violation
  const handleDismissReport = async (report: ComprehensiveReportItem) => {
    setActionLoading(true);
    try {
      const reportRef = doc(db, 'reports', report.id);
      await updateDoc(reportRef, {
        status: 'dismissed',
        updatedAt: serverTimestamp()
      });

      toast.success(`✓ রিপোর্ট #${report.id} কোনো নীতি লঙ্ঘন না পাওয়ায় খারিজ করা হলো`);
      if (selectedReport?.id === report.id) {
        setSelectedReport({ ...selectedReport, status: 'dismissed' });
      }
    } catch (err) {
      toast.error('খারিজ করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in font-sans pb-16">
      
      {/* 1. MASTER EMERALD BANNER */}
      <div className="bg-gradient-to-br from-[#0B7A3B] via-[#01412F] to-[#042A1E] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xs shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  আড্ডা সেন্ট্রাল মডারেশন হাব
                </span>
                <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                  পেন্ডিং রিপোর্ট: {toBn(counts.pending)}টি
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                রিপোর্ট ও কনটেন্ট মডারেশন সেন্টার ⭐
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
                নাগরিক আড্ডার পোস্ট, কমেন্ট, ইউজার, ছবি, ভিডিও, মেসেজ ও ফেক/স্প্যাম রিপোর্টের সার্বিক পর্যালোচনা এবং ৬-ধাপের অ্যাকশন কমান্ড সেন্টার
              </p>
            </div>
          </div>

          {/* Quick 6-step summary indicator */}
          <div className="bg-emerald-950/70 p-3.5 rounded-2xl border border-emerald-400/30 backdrop-blur-md flex items-center gap-2 text-[11px] font-bold text-emerald-200 flex-wrap">
            <span className="text-white font-black">অ্যাকশন পাইপলাইন:</span>
            <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded-md">1. Review</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded-md">2. Warning</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded-md">3. Hide</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-rose-500/30 text-rose-200 rounded-md">4. Delete</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-orange-500/30 text-orange-200 rounded-md">5. Suspend</span>
            <span>➔</span>
            <span className="px-2 py-0.5 bg-red-600 text-white rounded-md">6. Ban</span>
          </div>
        </div>
      </div>

      {/* 2. REPORT HIERARCHY TABS (7 CATEGORIES) */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-[#0B7A3B]" />
            <span>রিপোর্ট ক্যাটাগরি ব্রাউজ করুন</span>
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            সর্বমোট: {toBn(counts.all)}টি রিপোর্ট
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { id: 'all', label: 'সকল রিপোর্ট', count: counts.all, icon: ShieldAlert, color: 'text-slate-800' },
            { id: 'post', label: 'পোস্ট রিপোর্ট', count: counts.post, icon: FileText, color: 'text-purple-600' },
            { id: 'comment', label: 'কমেন্ট রিপোর্ট', count: counts.comment, icon: MessageSquare, color: 'text-blue-600' },
            { id: 'user', label: 'ইউজার রিপোর্ট', count: counts.user, icon: User, color: 'text-indigo-600' },
            { id: 'photo', label: 'ছবি রিপোর্ট', count: counts.photo, icon: ImageIcon, color: 'text-emerald-600' },
            { id: 'video', label: 'ভিডিও রিপোর্ট', count: counts.video, icon: Video, color: 'text-rose-600' },
            { id: 'message', label: 'মেসেজ রিপোর্ট', count: counts.message, icon: Mail, color: 'text-sky-600' },
            { id: 'fake_spam', label: 'Fake / Spam', count: counts.fake_spam, icon: AlertOctagon, color: 'text-red-600' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as ReportCategoryType)}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-start justify-between cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-emerald-50/70 border-[#0B7A3B] ring-2 ring-[#0B7A3B]/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <tab.icon size={16} className={tab.color} />
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-white border border-slate-200 text-slate-700">
                  {toBn(tab.count)}
                </span>
              </div>
              <span className="text-xs font-black text-slate-900">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. SEARCH & ADVANCED FILTERS */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="রিপোর্ট আইডি, কারণ, অভিযুক্ত ইউজার বা অভিযোগকারীর নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-200 text-slate-900 rounded-xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:border-[#0B7A3B]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
            <Filter size={14} className="text-[#0B7A3B]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="pending">পেন্ডিং (অমীমাংসিত)</option>
              <option value="in_action">চলমান অ্যাকশন (Review/Warn/Hide)</option>
              <option value="resolved">সমাধানকৃত (Delete/Suspend/Ban)</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700">
            <AlertTriangle size={14} className="text-amber-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">সকল অগ্রাধিকার</option>
              <option value="critical">🚨 ক্রিটিক্যাল</option>
              <option value="high">🔴 উচ্চ (High)</option>
              <option value="medium">🟡 মাঝারি (Medium)</option>
              <option value="low">🟢 স্বাভাবিক (Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. REPORTS LIST & 6-STEP ACTION CARDS */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-emerald-100 shadow-2xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B7A3B] mb-2" />
            <p className="text-xs font-bold">রিপোর্ট ডাটাবেজ লোড হচ্ছে...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center text-slate-500 border border-emerald-100 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="text-sm font-black text-slate-800">কোনো পেন্ডিং রিপোর্ট নেই</p>
            <p className="text-xs text-slate-400 mt-1">নির্বাচিত ক্যাটাগরির সকল কন্টেন্ট সম্পূর্ণ নিরাপদ ও পরিচ্ছন্ন</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isCritical = report.priority === 'critical' || report.priority === 'high';
            const isResolved = ['deleted', 'suspended', 'banned', 'dismissed'].includes(report.status);

            return (
              <div
                key={report.id}
                className={`bg-white rounded-3xl border p-5 transition-all shadow-2xs space-y-4 ${
                  isCritical ? 'border-rose-200 bg-rose-50/10' : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                {/* Card Top: Type, Ticket ID, Status, Reporter & Target */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Pill */}
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white flex items-center gap-1.5">
                      {report.reportType === 'post' && <FileText size={12} />}
                      {report.reportType === 'comment' && <MessageSquare size={12} />}
                      {report.reportType === 'user' && <User size={12} />}
                      {report.reportType === 'photo' && <ImageIcon size={12} />}
                      {report.reportType === 'video' && <Video size={12} />}
                      {report.reportType === 'message' && <Mail size={12} />}
                      {report.reportType === 'fake_spam' && <AlertOctagon size={12} />}
                      <span>
                        {report.reportType === 'post' ? 'পোস্ট রিপোর্ট' :
                         report.reportType === 'comment' ? 'কমেন্ট রিপোর্ট' :
                         report.reportType === 'user' ? 'ইউজার রিপোর্ট' :
                         report.reportType === 'photo' ? 'ছবি রিপোর্ট' :
                         report.reportType === 'video' ? 'ভিডিও রিপোর্ট' :
                         report.reportType === 'message' ? 'মেসেজ রিপোর্ট' : 'Fake / Spam রিপোর্ট'}
                      </span>
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{report.id}
                    </span>

                    {/* Priority Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      report.priority === 'critical' ? 'bg-red-600 text-white animate-pulse' :
                      report.priority === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      report.priority === 'medium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {report.priority}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      report.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      report.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      report.status === 'warned' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      report.status === 'hidden' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      report.status === 'deleted' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      report.status === 'suspended' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      report.status === 'banned' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {report.status === 'pending' ? '⏳ পেন্ডিং' :
                       report.status === 'reviewed' ? '🔍 রিভিউড' :
                       report.status === 'warned' ? '⚠️ সতর্কবার্তা প্রেরিত' :
                       report.status === 'hidden' ? '👁️‍🗨️ কন্টেন্ট লুকানো' :
                       report.status === 'deleted' ? '🗑️ ডিলিটকৃত' :
                       report.status === 'suspended' ? '⏳ স্থগিত (Suspended)' :
                       report.status === 'banned' ? '🚫 ব্যানড (Banned)' : '✓ খারিজ'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">
                    {new Date(report.createdAt).toLocaleString('bn-BD')}
                  </div>
                </div>

                {/* Card Middle: Content details & Target info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Reported Content Snippet & Media */}
                  <div className="lg:col-span-2 space-y-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                        <span>{report.reasonBangla}</span>
                      </h3>
                      {report.details && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <strong>অভিযোগের বিবরণ:</strong> {report.details}
                        </p>
                      )}
                    </div>

                    {report.contentSnippet && (
                      <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/70 text-xs text-slate-800">
                        <span className="text-[10px] font-black text-amber-800 uppercase block mb-1">
                          ফ্ল্যাগড কন্টেন্ট স্নপেট:
                        </span>
                        <p className="italic">"{report.contentSnippet}"</p>
                      </div>
                    )}

                    {report.contentMediaUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-xs">
                        <img src={report.contentMediaUrl} alt="" className="w-full h-40 object-cover" />
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-bold">
                          রিপোর্টেড মিডিয়া
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Users context: Target vs Reporter */}
                  <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                    {/* Target User */}
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">অভিযুক্ত ব্যক্তি / পেজ:</span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center font-bold text-xs">
                          {report.targetName[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{report.targetName}</p>
                          {report.targetUsername && <p className="text-[10px] text-slate-400 font-mono">@{report.targetUsername}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Reporter */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 uppercase">অভিযোগকারী:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                          {report.reporterName[0] || 'R'}
                        </div>
                        <p className="font-bold text-slate-700">{report.reporterName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: 6-STEP ACTION TOOLBAR */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Sparkles size={13} className="text-[#0B7A3B]" />
                    <span>৬-ধাপের অ্যাকশন নিন:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* 1. Review */}
                    <button
                      onClick={() => handleReviewAction(report)}
                      disabled={actionLoading || report.status === 'reviewed'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                        report.status === 'reviewed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                      title="রিভিউ শুরু করুন"
                    >
                      <Eye size={13} /> 1. Review
                    </button>

                    {/* 2. Warning */}
                    <button
                      onClick={() => {
                        setWarningModalReport(report);
                        setWarningText(`কমিউনিটি গাইডলাইন লঙ্ঘনের জন্য (${report.reasonBangla}) আপনাকে সতর্ক করা হচ্ছে।`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="ইউজারকে সতর্কবার্তা পাঠান"
                    >
                      <AlertTriangle size={13} /> 2. Warning
                    </button>

                    {/* 3. Hide */}
                    <button
                      onClick={() => handleHideAction(report)}
                      disabled={actionLoading || report.status === 'hidden'}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="কন্টেন্ট লুকান"
                    >
                      <EyeOff size={13} /> 3. Hide
                    </button>

                    {/* 4. Delete */}
                    <button
                      onClick={() => setDeleteModalReport(report)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="কন্টেন্ট ডিলিট করুন"
                    >
                      <Trash2 size={13} /> 4. Delete
                    </button>

                    {/* 5. Suspend */}
                    <button
                      onClick={() => {
                        setSuspendModalReport(report);
                        setSuspendReason(`রিপোর্ট #${report.id} এর কারণে সাময়িক স্থগিত`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-black transition cursor-pointer flex items-center gap-1"
                      title="ইউজার স্থগিত করুন"
                    >
                      <Clock size={13} /> 5. Suspend
                    </button>

                    {/* 6. Ban */}
                    <button
                      onClick={() => {
                        setBanModalReport(report);
                        setBanReason(`রিপোর্ট #${report.id} এর কারণে স্থায়ী বহিষ্কার`);
                      }}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="ইউজার স্থায়ী ব্যান করুন"
                    >
                      <Ban size={13} /> 6. Ban
                    </button>

                    {/* Dismiss */}
                    <button
                      onClick={() => handleDismissReport(report)}
                      disabled={actionLoading}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                      title="রিপোর্ট খারিজ করুন"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------- MODAL 1: ISSUE WARNING ---------------- */}
      <AnimatePresence>
        {warningModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-purple-700">
                <div className="p-3 bg-purple-100 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">ইউজারকে সতর্কবার্তা পাঠান (Warning)</h3>
                  <p className="text-xs text-slate-500">প্রাপক: {warningModalReport.targetName}</p>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 space-y-1">
                <label className="text-slate-500">সতর্কবার্তার বিবরণ:</label>
                <textarea
                  rows={3}
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-purple-500"
                  placeholder="সতর্কবার্তা লিখুন..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWarningModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWarning}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'পাঠানো হচ্ছে...' : 'সতর্কবার্তা পাঠান'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 2: SUSPEND USER ---------------- */}
      <AnimatePresence>
        {suspendModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-orange-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-orange-700">
                <div className="p-3 bg-orange-100 rounded-2xl">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">ইউজার সাময়িক স্থগিত (Suspend)</h3>
                  <p className="text-xs text-slate-500">{suspendModalReport.targetName}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-500">স্থগিতের মেয়াদ:</label>
                  <select
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-orange-500"
                  >
                    <option value={1}>১ দিন</option>
                    <option value={3}>৩ দিন</option>
                    <option value={7}>৭ দিন (১ সপ্তাহ)</option>
                    <option value={14}>১৪ দিন (২ সপ্তাহ)</option>
                    <option value={30}>৩০ দিন (১ মাস)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-500">স্থগিতের কারণ:</label>
                  <textarea
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSuspendModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'স্থগিত হচ্ছে...' : 'স্থগিতাদেশ নিশ্চিত করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 3: BAN USER ---------------- */}
      <AnimatePresence>
        {banModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-700">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <Ban size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">ইউজার স্থায়ীভাবে ব্যান (Ban)</h3>
                  <p className="text-xs text-slate-500">{banModalReport.targetName}</p>
                </div>
              </div>

              <p className="text-xs text-red-800 bg-red-50 p-3 rounded-2xl border border-red-200">
                ⚠️ ব্যান করা হলে ইউজার আড্ডার সকল প্রকার সেবা ও পোস্টিং ক্ষমতা থেকে স্থায়ীভাবে বঞ্চিত হবেন।
              </p>

              <div className="text-xs font-bold text-slate-700">
                <label className="block mb-1 text-slate-500">ব্যান করার কারণ:</label>
                <textarea
                  rows={3}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBanModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBan}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'ব্যান হচ্ছে...' : 'স্থায়ী ব্যান করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL 4: DELETE CONTENT ---------------- */}
      <AnimatePresence>
        {deleteModalReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-700">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">কন্টেন্ট স্থায়ীভাবে ডিলিট (Delete)</h3>
                  <p className="text-xs text-slate-500">রিপোর্ট: #{deleteModalReport.id}</p>
                </div>
              </div>

              <p className="text-xs text-slate-700">
                আপনি কি নিশ্চিত যে এই <strong>{deleteModalReport.reportType}</strong> কন্টেন্টটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলতে চান?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalReport(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {actionLoading ? 'ডিলিট হচ্ছে...' : 'ডিলিট নিশ্চিত করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ReportsAndModerationHub;
