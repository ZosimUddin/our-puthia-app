import React, { useState } from 'react';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFriendlyAuthErrorMessage } from '../../utils/authMessages';
import { logAuditActivity } from '../../services/auditLogger';
import { 
  Lock, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  ArrowLeft,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const ChangePassword: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresRecentLogin, setRequiresRecentLogin] = useState(false);
  const [success, setSuccess] = useState('');
  const [resetEmailSuccess, setResetEmailSuccess] = useState('');

  // Determine user email
  const userEmail = 
    auth.currentUser?.email || 
    user?.email || 
    userProfile?.email || 
    (userProfile?.phone ? `${userProfile.phone}@puthiadiary.com` : 'admin@puthiadiary.com');

  const isRealEmail = userEmail && !userEmail.endsWith('@puthiadiary.com');

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pwd.length < 6) return { score: 1, label: 'খুব দুর্বল (কমপক্ষে ৬ অক্ষর)', color: 'bg-rose-500 text-rose-600' };
    
    let score = 1;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[a-zA-Z]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 2, label: 'মোটামুটি', color: 'bg-amber-500 text-amber-600' };
    if (score === 3) return { score: 3, label: 'শক্তিশালী', color: 'bg-emerald-500 text-emerald-600' };
    return { score: 4, label: 'অত্যন্ত শক্তিশালী', color: 'bg-teal-600 text-teal-700' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setRequiresRecentLogin(false);
    setResetEmailSuccess('');

    const targetUser = auth.currentUser;
    if (!targetUser) {
      setError('লগইন করা ইউজার পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      setError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড হুবহু মেলেনি। অনুগ্রহ করে যাচাই করুন।');
      return;
    }

    setLoading(true);

    try {
      // Step 1: If current password is provided, re-authenticate first to bypass stale-token rules
      if (currentPassword) {
        try {
          const credential = EmailAuthProvider.credential(userEmail, currentPassword);
          await reauthenticateWithCredential(targetUser, credential);
        } catch (reauthErr: any) {
          console.warn('Re-authentication warning:', reauthErr);
          const reauthCode = reauthErr?.code || '';
          if (
            reauthCode === 'auth/wrong-password' || 
            reauthCode === 'auth/invalid-credential' ||
            reauthErr?.message?.includes('wrong-password') ||
            reauthErr?.message?.includes('invalid-credential')
          ) {
            throw new Error('আপনার বর্তমান পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।');
          }
          // If other re-auth error, try proceeding or throw friendly error
        }
      }

      // Step 2: Update password directly in Firebase Auth
      await updatePassword(targetUser, newPassword);

      // Step 3: Update Firestore record and log audit activity
      try {
        const userDocRef = doc(db, 'users', targetUser.uid);
        await updateDoc(userDocRef, {
          passwordUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('Could not update user doc timestamp:', dbErr);
      }

      // Audit log
      try {
        await logAuditActivity({
          action: 'ADMIN_PASSWORD_UPDATED',
          details: `সুপার অ্যাডমিন (${userEmail}) সফলভাবে পাসওয়ার্ড পরিবর্তন করেছেন`,
          category: 'security',
          severity: 'critical'
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }

      setSuccess('আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন ও আপডেট করা হয়েছে!');
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/admin/profile');
      }, 2000);

    } catch (err: any) {
      console.error('Password change error details:', err);
      const errCode = err?.code || '';
      const errMsg = err?.message || '';

      if (
        errCode === 'auth/requires-recent-login' || 
        errMsg.includes('requires-recent-login') ||
        errMsg.includes('CREDENTIAL_TOO_OLD_LOGIN_AGAIN')
      ) {
        setRequiresRecentLogin(true);
        setError(
          'নিরাপত্তাজনিত কারণে আপনার বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক। অনুগ্রহ করে নিচের "বর্তমান পাসওয়ার্ড" ফিল্ডে আপনার বর্তমান পাসওয়ার্ড দিন এবং পুনরায় চেষ্টা করুন।'
        );
      } else if (errMsg.includes('বর্তমান পাসওয়ার্ডটি সঠিক নয়')) {
        setError(errMsg);
      } else {
        setError(getFriendlyAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!userEmail) {
      toast.error('ইমেইল ঠিকানা পাওয়া যায়নি');
      return;
    }

    setResetEmailLoading(true);
    setResetEmailSuccess('');
    setError('');

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, userEmail, actionCodeSettings);
      const msg = `${userEmail} ঠিকানায় পাসওয়ার্ড রিসেট লিংক সফলভাবে পাঠানো হয়েছে! ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।`;
      setResetEmailSuccess(msg);
      toast.success('পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে');
    } catch (err: any) {
      console.error('Password reset email error:', err);
      toast.error(getFriendlyAuthErrorMessage(err));
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setResetEmailLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6 font-sans">
      
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link 
          to="/admin/profile" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition"
        >
          <ArrowLeft size={16} />
          <span>প্রোফাইলে ফিরে যান</span>
        </Link>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
          সিকিউরিটি কন্ট্রোল
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
          <Lock size={120} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
            <Key size={24} className="text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">পাসওয়ার্ড পরিবর্তন</h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
              সুপার অ্যাডমিন অ্যাকাউন্টের সুরক্ষা নিশ্চিত রাখতে একটি শক্তিশালী পাসওয়ার্ড নির্ধারণ করুন।
            </p>
          </div>
        </div>
      </div>

      {/* Account Info Quick Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-sm">
            {(userProfile?.name || user?.displayName || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{userProfile?.name || user?.displayName || 'সুপার অ্যাডমিন'}</p>
            <p className="text-[11px] text-slate-500 font-medium">{userEmail}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
          <ShieldCheck size={13} />
          <span>অ্যাডমিন সেশন ভেরিফাইড</span>
        </span>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-sm font-bold shadow-2xs">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-600 mt-0.5" />
          <div className="space-y-1">
            <p>{success}</p>
            <p className="text-xs text-emerald-600 font-medium">কয়েক সেকেন্ডের মধ্যে প্রোফাইলে রিডাইরেক্ট করা হচ্ছে...</p>
          </div>
        </div>
      )}

      {/* Reset Email Success Notification */}
      {resetEmailSuccess && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-blue-900 text-sm font-bold shadow-2xs">
          <Mail size={20} className="shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p>{resetEmailSuccess}</p>
            <p className="text-xs text-blue-700 font-medium">ইনবক্স এবং স্প্যাম ফোল্ডার পরীক্ষা করুন। প্রাপ্ত লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-sm font-bold shadow-2xs">
          <AlertCircle size={20} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p>{error}</p>
            {requiresRecentLogin && (
              <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-rose-600 font-medium">বিকল্প উপায়:</span>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={resetEmailLoading}
                  className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  {resetEmailLoading ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                  <span>ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠান</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Change Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-200/80 space-y-5">
        
        {/* Field 1: Current Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>বর্তমান পাসওয়ার্ড</span>
            <span className="text-[11px] text-slate-400 font-medium">(প্রযোজ্য ক্ষেত্রে)</span>
          </label>
          <div className="relative">
            <input 
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="আপনার বর্তমান পাসওয়ার্ড লিখুন..."
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            নিরাপত্তার স্বার্থে বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক। পূর্বে পাসওয়ার্ড না থাকলে খালি রাখতে পারেন।
          </p>
        </div>

        {/* Field 2: New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            নতুন পাসওয়ার্ড <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input 
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-3.5 pr-10 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড..."
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          {/* Strength Meter */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-full flex-1 rounded-full transition-all duration-300 ${
                      step <= strength.score ? strength.color.split(' ')[0] : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[11px] font-bold ${strength.color.split(' ')[1] || 'text-slate-500'}`}>
                পাসওয়ার্ড শক্তি: {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Field 3: Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            নতুন পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-3.5 pr-10 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition ${
                confirmPassword && newPassword !== confirmPassword 
                  ? 'border-rose-300 focus:ring-rose-400' 
                  : confirmPassword && newPassword === confirmPassword
                  ? 'border-emerald-300 focus:ring-emerald-500'
                  : 'border-slate-200 focus:ring-emerald-500'
              }`}
              placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন..."
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-[11px] font-bold mt-1 ${
              newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {newPassword === confirmPassword ? '✓ পাসওয়ার্ড দুটি হুবহু মিলেছে' : '✗ পাসওয়ার্ড দুটি মিলছে না'}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0B7A3B] hover:bg-emerald-800 text-white p-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-950/10 cursor-pointer min-h-[46px]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>পরিবর্তন সংরক্ষণ করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>পরিবর্তন করুন</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Alternative Option: One-Click Password Reset Email */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/60 text-emerald-800 flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900">
              বর্তমান পাসওয়ার্ড মনে নেই বা সরাসরি লিংক চান?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              আপনার নিবন্ধিত ইমেইলে ({userEmail}) একটি পাসওয়ার্ড রিসেট লিংক পাঠাতে পারেন। লিংকে ক্লিক করে আপনি সহজেই সরাসরি নতুন পাসওয়ার্ড নির্ধারণ করতে পারবেন।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendResetEmail}
          disabled={resetEmailLoading}
          className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px]"
        >
          {resetEmailLoading ? (
            <Loader2 size={15} className="animate-spin text-emerald-600" />
          ) : (
            <Sparkles size={15} className="text-emerald-600" />
          )}
          <span>আমার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠান</span>
        </button>
      </div>

      {/* Security Best Practices Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-amber-600 shrink-0" />
          <span>নিরাপত্তা সংক্রান্ত নির্দেশনা:</span>
        </h4>
        <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4 font-medium">
          <li>পাসওয়ার্ড হিসেবে নিজের নাম, ফোন নম্বর বা পরিচিত শব্দ ব্যবহার করবেন না।</li>
          <li>কমপক্ষে ৮ বা ততোধিক অক্ষরের পাসওয়ার্ড ব্যবহার করা সর্বাধিক নিরাপদ।</li>
          <li>সুপার অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড কখনো অন্য কারো সঙ্গে শেয়ার করবেন না।</li>
        </ul>
      </div>

    </div>
  );
};
