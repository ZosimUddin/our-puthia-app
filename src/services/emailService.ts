import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { logAuditActivity } from "./auditLogger";

export interface WelcomeEmailData {
  to: string;
  name: string;
  phone?: string;
  stars?: number;
}

export interface PasswordResetEmailData {
  to: string;
  name?: string;
  resetLink?: string;
}

export interface SecurityAlertEmailData {
  to: string;
  name?: string;
  time?: string;
  device?: string;
  location?: string;
  securityLink?: string;
}

export interface ProfileReminderEmailData {
  to: string;
  name?: string;
  profileLink?: string;
}

export interface AnnouncementEmailData {
  to: string;
  name?: string;
  title: string;
  details: string;
  effectiveDate?: string;
  websiteLink?: string;
}

export interface EmailSettings {
  welcomeEmailEnabled: boolean;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  supportEmail: string;
  websiteUrl: string;
  subjectTemplate: string;
  includeStarBonus: boolean;
  welcomeBonusStars: number;

  // Password Reset Email Config
  passwordResetEmailEnabled: boolean;
  passwordResetSubject: string;
  passwordResetButtonText: string;

  // Security Alert / Unusual Login Email Config
  securityAlertEmailEnabled: boolean;
  securityAlertSubject: string;
  securityAlertButtonText: string;

  // Profile Completion Reminder Email Config
  profileReminderEmailEnabled: boolean;
  profileReminderSubject: string;
  profileReminderButtonText: string;

  // Announcement & Website Update Email Config
  announcementEmailEnabled: boolean;
  announcementDefaultTitle: string;
  announcementDefaultDetails: string;
  announcementButtonText: string;

  lastUpdated?: string;
  updatedBy?: string;
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  welcomeEmailEnabled: true,
  senderName: "আমাদের পুঠিয়া টিম",
  senderEmail: "support@ourputhia.com",
  replyToEmail: "support@ourputhia.com",
  supportEmail: "support@ourputhia.com",
  websiteUrl: "https://our-puthia-app.vercel.app",
  subjectTemplate: "আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚",
  includeStarBonus: true,
  welcomeBonusStars: 20,

  passwordResetEmailEnabled: true,
  passwordResetSubject: "আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন 🔐",
  passwordResetButtonText: "নতুন পাসওয়ার্ড সেট করুন",

  securityAlertEmailEnabled: true,
  securityAlertSubject: "সতর্কতা: আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টে নতুন বা অস্বাভাবিক লগইন কার্যক্রম শনাক্ত করা হয়েছে 🛡️",
  securityAlertButtonText: "অ্যাকাউন্টের নিরাপত্তা দেখুন",

  profileReminderEmailEnabled: true,
  profileReminderSubject: "আপনার “আমাদের পুঠিয়া” প্রোফাইল সম্পূর্ণ করুন 👤💚",
  profileReminderButtonText: "আমার প্রোফাইল সম্পূর্ণ করুন",

  announcementEmailEnabled: true,
  announcementDefaultTitle: "আমাদের পুঠিয়া পোর্টালে নতুন নাগরিক সেবা ও ফিচার সংযোজন",
  announcementDefaultDetails: "সম্মানিত নাগরিকগণের সুবিধার জন্য 'আমাদের পুঠিয়া' প্ল্যাটফর্মে রিয়েল-টাইম ব্লাড ইনভেন্টরি ট্র্যাকার ও জরুরি হটলাইন সেবা যুক্ত করা হয়েছে।",
  announcementButtonText: "ওয়েবসাইটে দেখুন"
};

/**
 * Retrieves email settings from Firestore or returns default configuration
 */
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const snap = await getDoc(doc(db, "site_settings", "email_config"));
    if (snap.exists()) {
      return { ...DEFAULT_EMAIL_SETTINGS, ...snap.data() } as EmailSettings;
    }
  } catch (err) {
    console.warn("Could not fetch email settings, using defaults:", err);
  }
  return DEFAULT_EMAIL_SETTINGS;
}

/**
 * Updates email configuration settings in Firestore
 */
export async function updateEmailSettings(
  settings: Partial<EmailSettings>,
  adminUser?: { name?: string; email?: string }
): Promise<void> {
  try {
    const docRef = doc(db, "site_settings", "email_config");
    await setDoc(
      docRef,
      {
        ...settings,
        lastUpdated: new Date().toISOString(),
        updatedBy: adminUser?.name || adminUser?.email || "অ্যাডমিনিস্ট্রেটর"
      },
      { merge: true }
    );

    await logAuditActivity({
      action: "ইমেইল সেটিংস কনফিগারেশন আপডেট",
      details: `ওয়েলকাম: ${settings.welcomeEmailEnabled ? "অন" : "অফ"}, ঘোষণা: ${settings.announcementEmailEnabled ? "অন" : "অফ"}`,
      category: "system",
      severity: "info",
      customUser: adminUser?.name || "অ্যাডমিনিস্ট্রেটর"
    });
  } catch (error) {
    console.error("Error updating email settings:", error);
    throw error;
  }
}

/**
 * Generates an extraordinarily beautiful, mobile-responsive HTML welcome email template for 'Our Puthia'
 * Matching the exact wording, branding, and styling requested by the user.
 */
export function generateWelcomeEmailHtml(data: {
  name: string;
  email: string;
  phone?: string;
  stars?: number;
  appUrl?: string;
  senderName?: string;
  supportEmail?: string;
}): string {
  const appUrl = data.appUrl || "https://our-puthia-app.vercel.app";
  const userName = data.name || "সম্মানিত নাগরিক";
  const senderName = data.senderName || "আমাদের পুঠিয়া টিম";
  const supportEmail = data.supportEmail || "support@ourputhia.com";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'SolaimanLipi', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Premium Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #005a3e 0%, #007a55 50%, #004d33 100%); padding: 42px 30px 36px; text-align: center; color: #ffffff; position: relative;">
              <div style="display: inline-block; background-color: #ffffff; width: 72px; height: 72px; border-radius: 24px; line-height: 72px; margin-bottom: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
                <span style="font-size: 36px; line-height: 72px;">🏛️</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">আমাদের পুঠিয়া</h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: #a7f3d0; font-weight: 600; letter-spacing: 0.5px;">ঐতিহ্য ও আধুনিকতার ডিজিটাল নাগরিক প্ল্যাটফর্ম</p>
            </td>
          </tr>

          <!-- Main Email Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <div style="margin-bottom: 22px;">
                <h2 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #0f172a;">
                  প্রিয় ${userName},
                </h2>
                <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 20px; font-size: 15px; font-weight: 800; color: #047857; margin-top: 4px;">
                  আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚
                </div>
              </div>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #334155;">
                আমাদের সঙ্গে যুক্ত হওয়ার জন্য আপনাকে অসংখ্য ধন্যবাদ। পুঠিয়ার মানুষ, ঐতিহ্য, সংস্কৃতি ও কমিউনিটির সঙ্গে সংযুক্ত থাকার এই যাত্রায় আপনাকে পাশে পেয়ে আমরা আনন্দিত।
              </p>

              <table role="presentation" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-left: 4px solid #007a55; border-radius: 14px; margin: 20px 0 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #065f46; font-weight: 600;">
                      “আমাদের পুঠিয়া শুধু একটি ওয়েবসাইট নয়—এটি আমাদের এলাকার মানুষের সঙ্গে যুক্ত থাকার একটি সুন্দর উদ্যোগ।”
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.7; color: #334155;">
                আশা করি, আমাদের এই প্ল্যাটফর্ম আপনার ভালো লাগবে এবং আপনি এখানকার বিভিন্ন সুবিধা উপভোগ করবেন।
              </p>

              <table role="presentation" width="100%" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/profile?edit=true" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #007a55 0%, #005a3e 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 36px; border-radius: 50px; box-shadow: 0 6px 18px rgba(0, 122, 85, 0.35); text-align: center; letter-spacing: 0.3px;">
                      👉 এখনই প্রোফাইল সম্পন্ন করুন ও সেবা দেখুন
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #334155;">
                আপনার নতুন যাত্রা সুন্দর হোক। আমাদের পুঠিয়া পরিবারের সঙ্গে থাকুন, নিজের এলাকার সঙ্গে যুক্ত থাকুন। 💚
              </p>

              <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">আন্তরিক শুভেচ্ছান্তে,</p>
                <h4 style="margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #007a55;">${senderName}</h4>
              </div>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 22px;">
                <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #334155;">
                  যেকোনো মতামত, অভিযোগ বা প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন:
                </p>
                <table role="presentation" width="100%">
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #475569;">
                      📧 <strong>ইমেইল:</strong> <a href="mailto:${supportEmail}" style="color: #007a55; text-decoration: none; font-weight: 600;">${supportEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #475569;">
                      🌐 <strong>ওয়েবসাইট:</strong> <a href="${appUrl}" target="_blank" style="color: #007a55; text-decoration: none; font-weight: 600;">${appUrl}</a>
                    </td>
                  </tr>
                </table>
                <div style="margin-top: 14px; pt-2; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #047857;">
                  🌿 সুস্থ থাকুন, সুন্দর থাকুন, পুঠিয়ার সাথেই থাকুন।
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 22px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0; font-weight: 500;">
                © 2026 আমাদের পুঠিয়া। সর্বস্বত্ব সংরক্ষিত।
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates an elegant, high-security HTML Password Reset email matching user's exact requested wording.
 */
export function generatePasswordResetEmailHtml(data: {
  name?: string;
  email: string;
  resetLink?: string;
  appUrl?: string;
  senderName?: string;
  buttonText?: string;
}): string {
  const appUrl = data.appUrl || "https://our-puthia-app.vercel.app";
  const userName = data.name || data.email.split("@")[0] || "ব্যবহারকারী";
  const resetLink = data.resetLink || `${appUrl}/login?reset=true&email=${encodeURIComponent(data.email)}`;
  const senderName = data.senderName || "আমাদের পুঠিয়া টিম";
  const buttonText = data.buttonText || "নতুন পাসওয়ার্ড সেট করুন";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>পাসওয়ার্ড রিসেট - আমাদের পুঠিয়া</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'SolaimanLipi', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #005a3e 0%, #007a55 50%, #004d33 100%); padding: 36px 30px 32px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background-color: #ffffff; width: 68px; height: 68px; border-radius: 22px; line-height: 68px; margin-bottom: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.18);">
                <span style="font-size: 32px; line-height: 68px;">🔐</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">আমাদের পুঠিয়া</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0; font-weight: 600;">অ্যাকাউন্ট নিরাপত্তা ও পাসওয়ার্ড পরিবর্তন</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #0f172a;">
                প্রিয় ${userName},
              </h2>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #334155;">
                আপনি আপনার <strong>“আমাদের পুঠিয়া”</strong> অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করার অনুরোধ করেছেন।
              </p>

              <p style="margin: 0 0 26px; font-size: 15px; line-height: 1.7; color: #334155;">
                আপনার অ্যাকাউন্টে আবার নিরাপদে প্রবেশ করতে নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।
              </p>

              <table role="presentation" width="100%" style="margin: 24px 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #007a55 0%, #005a3e 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 38px; border-radius: 50px; box-shadow: 0 6px 18px rgba(0, 122, 85, 0.35); text-align: center; letter-spacing: 0.3px;">
                      👉 ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" style="background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 12px; margin: 20px 0 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #854d0e; font-weight: 600;">
                      ⏱️ <strong>মনে রাখবেন:</strong> নিরাপত্তার জন্য এই লিংকটি সীমিত সময়ের জন্য কার্যকর থাকবে।
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.7; color: #475569;">
                আপনি যদি পাসওয়ার্ড পরিবর্তনের অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন। আপনার বর্তমান পাসওয়ার্ড পরিবর্তন হবে না।
              </p>

              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin: 20px 0 26px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #334155;">
                      🛡️ <strong>নিরাপত্তা পরামর্শ:</strong> আপনার অ্যাকাউন্টের নিরাপত্তা আমাদের কাছে গুরুত্বপূর্ণ। কখনোই আপনার পাসওয়ার্ড বা নিরাপত্তা কোড অন্য কারও সঙ্গে শেয়ার করবেন না।
                    </p>
                  </td>
                </tr>
              </table>

              <div style="margin-top: 26px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">শুভেচ্ছান্তে,</p>
                <h4 style="margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #007a55;">${senderName}</h4>
                <p style="margin: 6px 0 0; font-size: 13px;">
                  🌐 <a href="${appUrl}" target="_blank" style="color: #007a55; text-decoration: none; font-weight: 600;">${appUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 22px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0; font-weight: 500;">
                © 2026 আমাদের পুঠিয়া। সর্বস্বত্ব সংরক্ষিত।
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates an extraordinarily beautiful, mobile-responsive HTML Security Alert email template
 */
export function generateSecurityAlertEmailHtml(data: {
  name?: string;
  email: string;
  time?: string;
  device?: string;
  location?: string;
  appUrl?: string;
  securityLink?: string;
  senderName?: string;
  buttonText?: string;
}): string {
  const appUrl = data.appUrl || "https://our-puthia-app.vercel.app";
  const userName = data.name || data.email.split("@")[0] || "ব্যবহারকারী";
  const securityLink = data.securityLink || `${appUrl}/profile`;
  const senderName = data.senderName || "আমাদের পুঠিয়া নিরাপত্তা টিম";
  const buttonText = data.buttonText || "অ্যাকাউন্টের নিরাপত্তা দেখুন";
  const loginTime = data.time || new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  const loginDevice = data.device || (typeof window !== "undefined" ? window.navigator.userAgent.slice(0, 45) : "অজানা ব্রাউজার / মোবাইল");
  const loginLocation = data.location || "পুঠিয়া, রাজশাহী (আনুমানিক)";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>লগইন নিরাপত্তা সতর্কতা - আমাদের পুঠিয়া</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'SolaimanLipi', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #7f1d1d 100%); padding: 38px 30px 34px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background-color: #ffffff; width: 68px; height: 68px; border-radius: 22px; line-height: 68px; margin-bottom: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.2);">
                <span style="font-size: 34px; line-height: 68px;">🛡️</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">আমাদের পুঠিয়া</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #fecaca; font-weight: 600;">অ্যাকাউন্ট নিরাপত্তা ও পর্যবেক্ষণ</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #0f172a;">
                প্রিয় ${userName},
              </h2>

              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #334155;">
                আপনার <strong>“আমাদের পুঠিয়া”</strong> অ্যাকাউন্টে একটি নতুন বা অস্বাভাবিক লগইন কার্যক্রম শনাক্ত করা হয়েছে।
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 22px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                  📋 লগইনের বিবরণ
                </h3>
                <table role="presentation" width="100%">
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      ⏰ <strong>সময়:</strong> <span style="color: #0f172a; font-weight: 600;">${loginTime}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      📱 <strong>ডিভাইস:</strong> <span style="color: #0f172a; font-weight: 600;">${loginDevice}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      📍 <strong>আনুমানিক অবস্থান:</strong> <span style="color: #0f172a; font-weight: 600;">${loginLocation}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.7; color: #475569;">
                আপনি যদি নিজেই লগইন করে থাকেন, তাহলে এই বার্তাটি উপেক্ষা করতে পারেন।
              </p>

              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: #b91c1c; font-weight: 600;">
                আপনি যদি এই কার্যক্রম চিনতে না পারেন, তাহলে দ্রুত আপনার অ্যাকাউন্টের নিরাপত্তা পরীক্ষা করুন এবং প্রয়োজনে পাসওয়ার্ড পরিবর্তন করুন।
              </p>

              <table role="presentation" width="100%" style="margin: 24px 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${securityLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 38px; border-radius: 50px; box-shadow: 0 6px 18px rgba(220, 38, 38, 0.35); text-align: center; letter-spacing: 0.3px;">
                      👉 ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #047857; font-weight: 600;">
                  🔒 আপনার ব্যক্তিগত তথ্য ও অ্যাকাউন্টের নিরাপত্তা রক্ষায় আমরা সচেষ্ট।
                </p>
              </div>

              <div style="margin-top: 26px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">শুভেচ্ছান্তে,</p>
                <h4 style="margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #991b1b;">${senderName}</h4>
                <p style="margin: 6px 0 0; font-size: 13px;">
                  🌐 <a href="${appUrl}" target="_blank" style="color: #007a55; text-decoration: none; font-weight: 600;">${appUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 22px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0; font-weight: 500;">
                © 2026 আমাদের পুঠিয়া। সর্বস্বত্ব সংরক্ষিত।
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates an extraordinarily beautiful, mobile-responsive HTML Profile Completion Reminder email template
 */
export function generateProfileReminderEmailHtml(data: {
  name?: string;
  email: string;
  appUrl?: string;
  profileLink?: string;
  senderName?: string;
  buttonText?: string;
}): string {
  const appUrl = data.appUrl || "https://our-puthia-app.vercel.app";
  const userName = data.name || data.email.split("@")[0] || "ব্যবহারকারী";
  const profileLink = data.profileLink || `${appUrl}/profile?edit=true`;
  const senderName = data.senderName || "আমাদের পুঠিয়া টিম";
  const buttonText = data.buttonText || "আমার প্রোফাইল সম্পূর্ণ করুন";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>প্রোফাইল সম্পূর্ণ করুন - আমাদের পুঠিয়া</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'SolaimanLipi', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #005a3e 0%, #007a55 50%, #004d33 100%); padding: 38px 30px 34px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background-color: #ffffff; width: 68px; height: 68px; border-radius: 22px; line-height: 68px; margin-bottom: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.18);">
                <span style="font-size: 34px; line-height: 68px;">👤</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">আমাদের পুঠিয়া</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0; font-weight: 600;">নাগরিক প্রোফাইল ও কমিউনিটি পরিচিতি</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 14px; font-size: 20px; font-weight: 800; color: #0f172a;">
                প্রিয় ${userName},
              </h2>

              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #334155;">
                “আমাদের পুঠিয়া” পরিবারের সঙ্গে থাকার জন্য ধন্যবাদ! 💚
              </p>

              <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.7; color: #334155;">
                আপনার প্রোফাইলের কিছু তথ্য এখনো যোগ করা বাকি রয়েছে। প্রোফাইলটি সম্পূর্ণ করলে অন্যরা আপনাকে সহজে চিনতে পারবেন এবং আমাদের কমিউনিটিতে আপনার পরিচিতি আরও সুন্দরভাবে তুলে ধরতে পারবেন।
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 22px; margin-bottom: 26px;">
                <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 800; color: #0f172a;">
                  আপনি চাইলে যোগ করতে পারেন:
                </h4>
                <table role="presentation" width="100%">
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      🖼️ আপনার প্রোফাইল ছবি
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      ✍️ আপনার পরিচিতি ও সংক্ষিপ্ত বিবরণ
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 14px; color: #475569;">
                      ✨ আপনার পছন্দসই অন্যান্য প্রোফাইল তথ্য
                    </td>
                  </tr>
                </table>
              </div>

              <table role="presentation" width="100%" style="margin: 24px 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${profileLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #007a55 0%, #005a3e 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 38px; border-radius: 50px; box-shadow: 0 6px 18px rgba(0, 122, 85, 0.35); text-align: center; letter-spacing: 0.3px;">
                      👉 ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #166534; font-weight: 600;">
                      🔒 আপনার ব্যক্তিগত তথ্যের নিয়ন্ত্রণ আপনার হাতেই থাকবে। শুধু যে তথ্যগুলো শেয়ার করতে স্বাচ্ছন্দ্যবোধ করেন, সেগুলোই যোগ করুন।
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #334155; font-weight: 600;">
                আপনার অংশগ্রহণে আমাদের পুঠিয়া আরও প্রাণবন্ত হয়ে উঠুক!
              </p>

              <div style="margin-top: 26px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">শুভেচ্ছান্তে,</p>
                <h4 style="margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #007a55;">${senderName}</h4>
                <p style="margin: 6px 0 0; font-size: 13px;">
                  🌐 <a href="${appUrl}" target="_blank" style="color: #007a55; text-decoration: none; font-weight: 600;">${appUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 22px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0; font-weight: 500;">
                © 2026 আমাদের পুঠিয়া। সর্বস্বত্ব সংরক্ষিত।
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates an extraordinarily beautiful, mobile-responsive HTML Official Announcement / Website Update email template
 * matching user's exact requested wording.
 */
export function generateAnnouncementEmailHtml(data: {
  name?: string;
  email: string;
  title: string;
  details: string;
  effectiveDate?: string;
  appUrl?: string;
  websiteLink?: string;
  senderName?: string;
  buttonText?: string;
}): string {
  const appUrl = data.appUrl || "https://our-puthia-app.vercel.app";
  const userName = data.name || data.email.split("@")[0] || "সম্মানিত ব্যবহারকারী";
  const websiteLink = data.websiteLink || appUrl;
  const senderName = data.senderName || "আমাদের পুঠিয়া টিম";
  const buttonText = data.buttonText || "ওয়েবসাইটে দেখুন";
  const effectiveDate = data.effectiveDate || new Date().toLocaleDateString("bn-BD");

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - আমাদের পুঠিয়া</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'SolaimanLipi', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Emerald Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #005a3e 0%, #007a55 50%, #004d33 100%); padding: 38px 30px 34px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background-color: #ffffff; width: 68px; height: 68px; border-radius: 22px; line-height: 68px; margin-bottom: 14px; box-shadow: 0 6px 18px rgba(0,0,0,0.18);">
                <span style="font-size: 34px; line-height: 68px;">📢</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">আমাদের পুঠিয়া</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0; font-weight: 600;">গুরুত্বপূর্ণ ওয়েবসাইট আপডেট ও ঘোষণা</p>
            </td>
          </tr>

          <!-- Main Email Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 14px; font-size: 20px; font-weight: 800; color: #0f172a;">
                প্রিয় ${userName},
              </h2>

              <!-- Paragraph 1 -->
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #334155;">
                “আমাদের পুঠিয়া” ওয়েবসাইটের পক্ষ থেকে আপনাকে জানাই আন্তরিক শুভেচ্ছা।
              </p>

              <!-- Paragraph 2 -->
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #334155;">
                আমাদের ওয়েবসাইটের গুরুত্বপূর্ণ আপডেট, নতুন সুবিধা এবং প্রয়োজনীয় পরিবর্তন সম্পর্কে আপনাকে অবহিত রাখতে এই বার্তাটি পাঠানো হয়েছে।
              </p>

              <!-- Announcement Details Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px 22px; margin-bottom: 26px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                
                <!-- Title Header -->
                <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #007a55; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
                    ঘোষণার শিরোনাম:
                  </span>
                  <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.5;">
                    ${data.title}
                  </h3>
                </div>

                <!-- Details body -->
                <div style="margin-bottom: 16px;">
                  <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">
                    বিস্তারিত তথ্য:
                  </span>
                  <div style="font-size: 14px; line-height: 1.8; color: #334155; white-space: pre-line;">
                    ${data.details}
                  </div>
                </div>

                <!-- Effective Date -->
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 10px 14px; display: inline-block;">
                  <span style="font-size: 12px; font-weight: 700; color: #047857;">
                    📅 <strong>কার্যকর হওয়ার তারিখ:</strong> ${effectiveDate}
                  </span>
                </div>

              </div>

              <!-- Notice -->
              <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.7; color: #475569;">
                বিস্তারিত জানতে আমাদের ওয়েবসাইট ভিজিট করুন।
              </p>

              <!-- Prominent CTA Button -->
              <table role="presentation" width="100%" style="margin: 24px 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${websiteLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #007a55 0%, #005a3e 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 40px; border-radius: 50px; box-shadow: 0 6px 18px rgba(0, 122, 85, 0.35); text-align: center; letter-spacing: 0.3px;">
                      👉 ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Appreciation message -->
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: #334155; font-weight: 600;">
                আপনাদের সহযোগিতা ও ভালোবাসাই আমাদের এগিয়ে যাওয়ার অনুপ্রেরণা।
              </p>

              <!-- Signoff -->
              <div style="margin-top: 26px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">ধন্যবাদান্তে,</p>
                <h4 style="margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #007a55;">${senderName}</h4>
                <p style="margin: 6px 0 0; font-size: 13px;">
                  🌐 <a href="${appUrl}" target="_blank" style="color: #007a55; text-decoration: none; font-weight: 600;">${appUrl}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px; font-weight: 500;">
                এই ইমেইলটি ওয়েবসাইটের গুরুত্বপূর্ণ তথ্য জানানোর জন্য পাঠানো হয়েছে।
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 আমাদের পুঠিয়া। সর্বস্বত্ব সংরক্ষিত।
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Queues a welcome email to the Firestore 'mail' collection with user's exact requested wording.
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const recipientEmail = (data.to || "").trim().toLowerCase();

  if (!recipientEmail || recipientEmail.endsWith("@puthiadiary.com")) {
    console.log("Welcome email skipped: User registered with phone or dummy email:", recipientEmail);
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.warn("Invalid email address for welcome email:", recipientEmail);
    return false;
  }

  try {
    const config = await getEmailSettings();

    if (!config.welcomeEmailEnabled) {
      console.log("Welcome email skipped: Disabled in Admin Settings config.");
      return false;
    }

    const userName = data.name || "সম্মানিত নাগরিক";
    const subject = config.subjectTemplate || `আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚`;
    const appUrl = config.websiteUrl || "https://our-puthia-app.vercel.app";

    const htmlContent = generateWelcomeEmailHtml({
      name: userName,
      email: recipientEmail,
      phone: data.phone,
      stars: config.includeStarBonus ? (config.welcomeBonusStars || 20) : 0,
      appUrl,
      senderName: config.senderName,
      supportEmail: config.supportEmail
    });

    const plainText = `প্রিয় ${userName},
আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚

আমাদের সঙ্গে যুক্ত হওয়ার জন্য আপনাকে অসংখ্য ধন্যবাদ। পুঠিয়ার মানুষ, ঐতিহ্য, সংস্কৃতি ও কমিউনিটির সঙ্গে সংযুক্ত থাকার এই যাত্রায় আপনাকে পাশে পেয়ে আমরা আনন্দিত।

আমাদের পুঠিয়া শুধু একটি ওয়েবসাইট নয়—এটি আমাদের এলাকার মানুষের সঙ্গে যুক্ত থাকার একটি সুন্দর উদ্যোগ।
আশা করি, আমাদের এই প্ল্যাটফর্ম আপনার ভালো লাগবে এবং আপনি এখানকার বিভিন্ন সুবিধা উপভোগ করবেন।

👉 এখনই প্রোফাইল সম্পন্ন করুন ও সেবা দেখুন: ${appUrl}/profile?edit=true

আপনার নতুন যাত্রা সুন্দর হোক। আমাদের পুঠিয়া পরিবারের সঙ্গে থাকুন, নিজের এলাকার সঙ্গে যুক্ত থাকুন। 💚

আন্তরিক শুভেচ্ছান্তে,
${config.senderName}

যেকোনো মতামত, অভিযোগ বা প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন:

📧 ইমেইল: ${config.supportEmail}
🌐 ওয়েবসাইট: ${appUrl}
সুস্থ থাকুন, সুন্দর থাকুন, পুঠিয়ার সাথেই থাকুন।

© 2026 আমাদের পুঠিয়া। সর্বস্বত্ব সংরক্ষিত।`;

    await addDoc(collection(db, "mail"), {
      to: [recipientEmail],
      from: config.senderEmail ? `"${config.senderName}" <${config.senderEmail}>` : undefined,
      replyTo: config.replyToEmail || config.senderEmail,
      message: {
        subject,
        text: plainText,
        html: htmlContent
      },
      type: "welcome_email",
      recipientName: userName,
      recipientEmail,
      recipientPhone: data.phone || null,
      createdAt: serverTimestamp(),
      status: "pending"
    });

    await logAuditActivity({
      action: `স্বাগতম ইমেইল কিউতে যুক্ত করা হয়েছে (${recipientEmail})`,
      details: `প্রাপক: ${userName}, ইমেইল: ${recipientEmail}, প্রেরক: ${config.senderName}`,
      category: "user",
      severity: "info",
      customUser: "সিস্টেম বট"
    });

    return true;
  } catch (error) {
    console.warn("Could not queue welcome email in Firestore:", error);
    return false;
  }
}

/**
 * Queues a customized password reset email to the Firestore 'mail' collection.
 */
export async function sendPasswordResetCustomEmail(data: PasswordResetEmailData): Promise<boolean> {
  const recipientEmail = (data.to || "").trim().toLowerCase();

  if (!recipientEmail || recipientEmail.endsWith("@puthiadiary.com")) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return false;
  }

  try {
    const config = await getEmailSettings();

    if (!config.passwordResetEmailEnabled) {
      console.log("Password reset custom email skipped: Disabled in Admin Settings config.");
      return false;
    }

    const userName = data.name || recipientEmail.split("@")[0] || "সম্মানিত ব্যবহারকারী";
    const appUrl = config.websiteUrl || "https://our-puthia-app.vercel.app";
    const subject = config.passwordResetSubject || "আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন 🔐";
    const resetLink = data.resetLink || `${appUrl}/login?reset=true&email=${encodeURIComponent(recipientEmail)}`;

    const htmlContent = generatePasswordResetEmailHtml({
      name: userName,
      email: recipientEmail,
      resetLink,
      appUrl,
      senderName: config.senderName,
      buttonText: config.passwordResetButtonText || "নতুন পাসওয়ার্ড সেট করুন"
    });

    const plainText = `প্রিয় ${userName},

আপনি আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করার অনুরোধ করেছেন।

আপনার অ্যাকাউন্টে আবার নিরাপদে প্রবেশ করতে নিচের বাটনে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন।

👉 নতুন পাসওয়ার্ড সেট করুন: ${resetLink}

নিরাপত্তার জন্য এই লিংকটি সীমিত সময়ের জন্য কার্যকর থাকবে।

আপনি যদি পাসওয়ার্ড পরিবর্তনের অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন। আপনার বর্তমান পাসওয়ার্ড পরিবর্তন হবে না।

আপনার অ্যাকাউন্টের নিরাপত্তা আমাদের কাছে গুরুত্বপূর্ণ। কখনোই আপনার পাসওয়ার্ড অন্য কারও সঙ্গে শেয়ার করবেন না।

শুভেচ্ছান্তে,
${config.senderName}

🌐 ${appUrl}`;

    await addDoc(collection(db, "mail"), {
      to: [recipientEmail],
      from: config.senderEmail ? `"${config.senderName}" <${config.senderEmail}>` : undefined,
      replyTo: config.replyToEmail || config.senderEmail,
      message: {
        subject,
        text: plainText,
        html: htmlContent
      },
      type: "password_reset_email",
      recipientName: userName,
      recipientEmail,
      createdAt: serverTimestamp(),
      status: "pending"
    });

    await logAuditActivity({
      action: `পাসওয়ার্ড রিসেট ইমেইল কিউতে যুক্ত করা হয়েছে (${recipientEmail})`,
      details: `প্রাপক: ${userName}, ইমেইল: ${recipientEmail}`,
      category: "security",
      severity: "info",
      customUser: "সিস্টেম বট"
    });

    return true;
  } catch (error) {
    console.warn("Could not queue password reset email:", error);
    return false;
  }
}

/**
 * Queues an unusual / new login security alert email to the Firestore 'mail' collection.
 */
export async function sendSecurityAlertEmail(data: SecurityAlertEmailData): Promise<boolean> {
  const recipientEmail = (data.to || "").trim().toLowerCase();

  if (!recipientEmail || recipientEmail.endsWith("@puthiadiary.com")) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return false;
  }

  try {
    const config = await getEmailSettings();

    if (!config.securityAlertEmailEnabled) {
      console.log("Security alert email skipped: Disabled in Admin Settings config.");
      return false;
    }

    const userName = data.name || recipientEmail.split("@")[0] || "সম্মানিত ব্যবহারকারী";
    const appUrl = config.websiteUrl || "https://our-puthia-app.vercel.app";
    const subject = config.securityAlertSubject || "সতর্কতা: আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টে নতুন বা অস্বাভাবিক লগইন কার্যক্রম শনাক্ত করা হয়েছে 🛡️";
    const securityLink = data.securityLink || `${appUrl}/profile`;
    const senderName = "আমাদের পুঠিয়া নিরাপত্তা টিম";
    const time = data.time || new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
    const device = data.device || (typeof window !== "undefined" ? window.navigator.userAgent.slice(0, 45) : "অজানা ব্রাউজার / মোবাইল");
    const location = data.location || "পুঠিয়া, রাজশাহী (আনুমানিক)";

    const htmlContent = generateSecurityAlertEmailHtml({
      name: userName,
      email: recipientEmail,
      time,
      device,
      location,
      appUrl,
      securityLink,
      senderName,
      buttonText: config.securityAlertButtonText || "অ্যাকাউন্টের নিরাপত্তা দেখুন"
    });

    const plainText = `প্রিয় ${userName},

আপনার “আমাদের পুঠিয়া” অ্যাকাউন্টে একটি নতুন বা অস্বাভাবিক লগইন কার্যক্রম শনাক্ত করা হয়েছে।

লগইনের বিবরণ

- সময়: ${time}
- ডিভাইস: ${device}
- আনুমানিক অবস্থান: ${location}

আপনি যদি নিজেই লগইন করে থাকেন, তাহলে এই বার্তাটি উপেক্ষা করতে পারেন।

আপনি যদি এই কার্যক্রম চিনতে না পারেন, তাহলে দ্রুত আপনার অ্যাকাউন্টের নিরাপত্তা পরীক্ষা করুন এবং প্রয়োজনে পাসওয়ার্ড পরিবর্তন করুন।

👉 অ্যাকাউন্টের নিরাপত্তা দেখুন: ${securityLink}

আপনার ব্যক্তিগত তথ্য ও অ্যাকাউন্টের নিরাপত্তা রক্ষায় আমরা সচেষ্ট।

শুভেচ্ছান্তে,
${senderName}

🌐 ${appUrl}`;

    await addDoc(collection(db, "mail"), {
      to: [recipientEmail],
      from: config.senderEmail ? `"${senderName}" <${config.senderEmail}>` : undefined,
      replyTo: config.replyToEmail || config.senderEmail,
      message: {
        subject,
        text: plainText,
        html: htmlContent
      },
      type: "security_alert_email",
      recipientName: userName,
      recipientEmail,
      createdAt: serverTimestamp(),
      status: "pending"
    });

    await logAuditActivity({
      action: `নিরাপত্তা সতর্কতা ইমেইল কিউতে যুক্ত করা হয়েছে (${recipientEmail})`,
      details: `প্রাপক: ${userName}, ডিভাইস: ${device}, সময়: ${time}`,
      category: "security",
      severity: "warning",
      customUser: "নিরাপত্তা ইঞ্জিন"
    });

    return true;
  } catch (error) {
    console.warn("Could not queue security alert email:", error);
    return false;
  }
}

/**
 * Queues a profile completion reminder email to the Firestore 'mail' collection.
 */
export async function sendProfileReminderEmail(data: ProfileReminderEmailData): Promise<boolean> {
  const recipientEmail = (data.to || "").trim().toLowerCase();

  if (!recipientEmail || recipientEmail.endsWith("@puthiadiary.com")) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return false;
  }

  try {
    const config = await getEmailSettings();

    if (!config.profileReminderEmailEnabled) {
      console.log("Profile reminder email skipped: Disabled in Admin Settings config.");
      return false;
    }

    const userName = data.name || recipientEmail.split("@")[0] || "সম্মানিত ব্যবহারকারী";
    const appUrl = config.websiteUrl || "https://our-puthia-app.vercel.app";
    const subject = config.profileReminderSubject || "আপনার “আমাদের পুঠিয়া” প্রোফাইল সম্পূর্ণ করুন 👤💚";
    const profileLink = data.profileLink || `${appUrl}/profile?edit=true`;

    const htmlContent = generateProfileReminderEmailHtml({
      name: userName,
      email: recipientEmail,
      appUrl,
      profileLink,
      senderName: config.senderName,
      buttonText: config.profileReminderButtonText || "আমার প্রোফাইল সম্পূর্ণ করুন"
    });

    const plainText = `প্রিয় ${userName},

“আমাদের পুঠিয়া” পরিবারের সঙ্গে থাকার জন্য ধন্যবাদ! 💚

আপনার প্রোফাইলের কিছু তথ্য এখনো যোগ করা বাকি রয়েছে। প্রোফাইলটি সম্পূর্ণ করলে অন্যরা আপনাকে সহজে চিনতে পারবেন এবং আমাদের কমিউনিটিতে আপনার পরিচিতি আরও সুন্দরভাবে তুলে ধরতে পারবেন।

আপনি চাইলে যোগ করতে পারেন:

- আপনার প্রোফাইল ছবি
- আপনার পরিচিতি ও সংক্ষিপ্ত বিবরণ
- আপনার পছন্দসই অন্যান্য প্রোফাইল তথ্য

👉 আমার প্রোফাইল সম্পূর্ণ করুন: ${profileLink}

আপনার ব্যক্তিগত তথ্যের নিয়ন্ত্রণ আপনার হাতেই থাকবে। শুধু যে তথ্যগুলো শেয়ার করতে স্বাচ্ছন্দ্যবোধ করেন, সেগুলোই যোগ করুন।

আপনার অংশগ্রহণে আমাদের পুঠিয়া আরও প্রাণবন্ত হয়ে উঠুক!

শুভেচ্ছান্তে,
${config.senderName}

🌐 ${appUrl}`;

    await addDoc(collection(db, "mail"), {
      to: [recipientEmail],
      from: config.senderEmail ? `"${config.senderName}" <${config.senderEmail}>` : undefined,
      replyTo: config.replyToEmail || config.senderEmail,
      message: {
        subject,
        text: plainText,
        html: htmlContent
      },
      type: "profile_reminder_email",
      recipientName: userName,
      recipientEmail,
      createdAt: serverTimestamp(),
      status: "pending"
    });

    await logAuditActivity({
      action: `প্রোফাইল সম্পূর্ণকরণ রিমাইন্ডার ইমেইল কিউতে যুক্ত করা হয়েছে (${recipientEmail})`,
      details: `প্রাপক: ${userName}`,
      category: "user",
      severity: "info",
      customUser: "সিস্টেম বট"
    });

    return true;
  } catch (error) {
    console.warn("Could not queue profile reminder email:", error);
    return false;
  }
}

/**
 * Queues an official announcement / website update email to the Firestore 'mail' collection.
 * Matching the exact wording requested by the user.
 */
export async function sendAnnouncementEmail(data: AnnouncementEmailData): Promise<boolean> {
  const recipientEmail = (data.to || "").trim().toLowerCase();

  if (!recipientEmail || recipientEmail.endsWith("@puthiadiary.com")) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return false;
  }

  try {
    const config = await getEmailSettings();

    if (!config.announcementEmailEnabled) {
      console.log("Announcement email skipped: Disabled in Admin Settings config.");
      return false;
    }

    const userName = data.name || recipientEmail.split("@")[0] || "সম্মানিত ব্যবহারকারী";
    const appUrl = config.websiteUrl || "https://our-puthia-app.vercel.app";
    const subject = `📢 ঘোষণা: ${data.title} — আমাদের পুঠিয়া`;
    const websiteLink = data.websiteLink || appUrl;
    const effectiveDate = data.effectiveDate || new Date().toLocaleDateString("bn-BD");

    const htmlContent = generateAnnouncementEmailHtml({
      name: userName,
      email: recipientEmail,
      title: data.title,
      details: data.details,
      effectiveDate,
      appUrl,
      websiteLink,
      senderName: config.senderName,
      buttonText: config.announcementButtonText || "ওয়েবসাইটে দেখুন"
    });

    const plainText = `প্রিয় ${userName},

“আমাদের পুঠিয়া” ওয়েবসাইটের পক্ষ থেকে আপনাকে জানাই আন্তরিক শুভেচ্ছা।

আমাদের ওয়েবসাইটের গুরুত্বপূর্ণ আপডেট, নতুন সুবিধা এবং প্রয়োজনীয় পরিবর্তন সম্পর্কে আপনাকে অবহিত রাখতে এই বার্তাটি পাঠানো হয়েছে।

ঘোষণার শিরোনাম: ${data.title}

বিস্তারিত তথ্য:

${data.details}

কার্যকর হওয়ার তারিখ: ${effectiveDate}

বিস্তারিত জানতে আমাদের ওয়েবসাইট ভিজিট করুন।

👉 ${config.announcementButtonText || "ওয়েবসাইটে দেখুন"}: ${websiteLink}

আপনাদের সহযোগিতা ও ভালোবাসাই আমাদের এগিয়ে যাওয়ার অনুপ্রেরণা।

ধন্যবাদান্তে,
${config.senderName}

🌐 ${appUrl}

এই ইমেইলটি ওয়েবসাইটের গুরুত্বপূর্ণ তথ্য জানানোর জন্য পাঠানো হয়েছে।`;

    await addDoc(collection(db, "mail"), {
      to: [recipientEmail],
      from: config.senderEmail ? `"${config.senderName}" <${config.senderEmail}>` : undefined,
      replyTo: config.replyToEmail || config.senderEmail,
      message: {
        subject,
        text: plainText,
        html: htmlContent
      },
      type: "announcement_email",
      recipientName: userName,
      recipientEmail,
      createdAt: serverTimestamp(),
      status: "pending"
    });

    await logAuditActivity({
      action: `ঘোষণা ও আপডেট ইমেইল কিউতে যুক্ত করা হয়েছে (${recipientEmail})`,
      details: `শিরোনাম: ${data.title}, প্রাপক: ${userName}`,
      category: "content",
      severity: "info",
      customUser: "অ্যাডমিনিস্ট্রেটর"
    });

    return true;
  } catch (error) {
    console.warn("Could not queue announcement email:", error);
    return false;
  }
}
