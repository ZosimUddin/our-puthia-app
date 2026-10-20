import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { logAuditActivity } from "./auditLogger";

export interface WelcomeEmailData {
  to: string;
  name: string;
  phone?: string;
  stars?: number;
}

/**
 * Generates an elegant, mobile-responsive HTML welcome email template for 'Our Puthia'
 */
export function generateWelcomeEmailHtml(data: {
  name: string;
  email: string;
  phone?: string;
  stars?: number;
  appUrl?: string;
}): string {
  const appUrl = data.appUrl || (typeof window !== "undefined" ? window.location.origin : "https://ourputhia.com");
  const starsCount = data.stars || 20;

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>স্বাগতম আমাদের পুঠিয়া প্ল্যাটফর্মে</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'SolaimanLipi', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #006a4e 0%, #004d38 100%); padding: 36px 28px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background-color: #ffffff; width: 64px; height: 64px; border-radius: 20px; line-height: 64px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <span style="font-size: 32px;">🏛️</span>
              </div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">আমাদের পুঠিয়া</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0; font-weight: 500;">ঐতিহ্য ও আধুনিকতার ডিজিটাল নাগরিক প্ল্যাটফর্ম</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <!-- Welcome Heading -->
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
                প্রিয় ${data.name}, আসসালামু আলাইকুম! 👋
              </h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                ঐতিহাসিক পুঠিয়া উপজেলার ডিজিটাল নাগরিক সেবা নেটওয়ার্কে সফলভাবে যুক্ত হওয়ার জন্য আপনাকে আন্তরিক অভিনন্দন। এখন থেকে পুঠিয়ার সকল জরুরি ও নাগরিক সেবা আপনি পাবেন একদম হাতের মুঠোয়।
              </p>

              <!-- Welcome Bonus Badge Card -->
              <table role="presentation" width="100%" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="40" style="vertical-align: top; font-size: 26px;">⭐</td>
                        <td style="vertical-align: middle;">
                          <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #065f46;">
                            স্বাগতম উপহার: ${starsCount}টি নাগরিক স্টার!
                          </h4>
                          <p style="margin: 4px 0 0; font-size: 12px; color: #047857;">
                            নতুন একাউন্ট খোলার জন্য আপনার প্রোফাইলে ২০ স্টার যুক্ত হয়েছে। রক্তদান ও নাগরিক সহায়তায় আরও স্টার অর্জন করুন!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What you can do section -->
              <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
                🌟 আপনার জন্য প্ল্যাটফর্মের মূল সেবাসমূহ:
              </h3>

              <table role="presentation" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="32" style="font-size: 20px; vertical-align: top;">🩸</td>
                        <td>
                          <strong style="font-size: 13px; color: #0f172a;">রক্তদান নেটওয়ার্ক ও ইনভেন্টরি</strong>
                          <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">জরুরি রক্তের প্রয়োজনে ডোনার খুঁজুন অথবা রিয়েল-টাইম ব্লাড ব্যাংকের মজুদ চেক করুন।</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="32" style="font-size: 20px; vertical-align: top;">🏥</td>
                        <td>
                          <strong style="font-size: 13px; color: #0f172a;">স্বাস্থ্য ও জরুরি সেবা</strong>
                          <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">উপজেলা স্বাস্থ্য কমপ্লেক্স, বিশেষজ্ঞ চিকিৎসক, ফার্মেসি ও অ্যাম্বুলেন্স তালিকা।</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="32" style="font-size: 20px; vertical-align: top;">📰</td>
                        <td>
                          <strong style="font-size: 13px; color: #0f172a;">পুঠিয়ার খবর ও নোটিশ</strong>
                          <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">উপজেলার সর্বশেষ সংবাদ, সরকারি ঘোষণা ও স্থানীয় খবরাখবর সবার আগে জানুন।</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="32" style="font-size: 20px; vertical-align: top;">🏪</td>
                        <td>
                          <strong style="font-size: 13px; color: #0f172a;">স্থানীয় ব্যবসা ও কেনাকাটা</strong>
                          <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">পুঠিয়ার ঐতিহ্যবাহী হাট-বাজার, দোকানপাট ও বিশ্বস্ত উদ্যোক্তাদের ডিরেক্টরি।</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button -->
              <table role="presentation" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/profile?edit=true" target="_blank" style="display: inline-block; background-color: #006a4e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 12px rgba(0, 106, 78, 0.25);">
                      👉 আপনার প্রোফাইল সম্পূর্ণ করুন
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Emergency Helpline Box -->
              <table role="presentation" width="100%" style="background-color: #f1f5f9; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase;">
                      📞 পুঠিয়া উপজেলার জরুরি হেল্পলাইন:
                    </h4>
                    <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                      স্বাস্থ্য কমপ্লেক্স: <strong style="color: #0f172a;">01711-001122</strong> | থানা পুলিশ: <strong style="color: #0f172a;">01713-373300</strong> | জাতীয় জরুরি সেবা: <strong style="color: #e11d48;">999</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Signoff -->
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                সুস্থ থাকুন, নিরাপদ থাকুন,<br>
                <strong>টিম আমাদের পুঠিয়া</strong><br>
                <span style="font-size: 11px; color: #94a3b8;">পুঠিয়া, রাজশাহী, বাংলাদেশ</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0 0 6px;">
                এই স্বয়ংক্রিয় ইমেইলটি 'আমাদের পুঠিয়া' প্ল্যাটফর্মে আপনার অ্যাকাউন্ট তৈরির প্রেক্ষিতে পাঠানো হয়েছে।
              </p>
              <p style="margin: 0;">
                <a href="${appUrl}" style="color: #006a4e; text-decoration: none; font-weight: 700;">আমাদের পুঠিয়া ওয়েবসাইট</a> | 
                <a href="${appUrl}/terms" style="color: #64748b; text-decoration: none;">শর্তাবলি ও গোপনীয়তা নীতি</a>
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
 * Queues a welcome email to the Firestore 'mail' collection.
 * Compatible with Firebase Trigger Email extension or Cloud Functions.
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const recipientEmail = (data.to || "").trim().toLowerCase();

  // If empty or dummy phone-based email (e.g., 017...@puthiadiary.com), do not send SMTP
  if (!recipientEmail || recipientEmail.endsWith("@puthiadiary.com")) {
    console.log("Welcome email skipped: User registered with phone or dummy email:", recipientEmail);
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.warn("Invalid email address for welcome email:", recipientEmail);
    return false;
  }

  try {
    const subject = `🎉 স্বাগতম ${data.name}! 'আমাদের পুঠিয়া' পরিবারে আপনাকে অভিনন্দন`;
    const htmlContent = generateWelcomeEmailHtml({
      name: data.name,
      email: recipientEmail,
      phone: data.phone,
      stars: data.stars || 20
    });

    const plainText = `প্রিয় ${data.name},

'আমাদের পুঠিয়া' প্ল্যাটফর্মে সফলভাবে যুক্ত হওয়ার জন্য আপনাকে আন্তরিক অভিনন্দন!

আপনার প্রোফাইলে স্বাগতম উপহার হিসেবে ২০টি নাগরিক স্টার পয়েন্ট যুক্ত করা হয়েছে।

আমাদের পুঠিয়া প্ল্যাটফর্মের মাধ্যমে আপনি পুঠিয়া উপজেলার জরুরি রক্তদান, স্বাস্থ্য সেবা, তাজা সংবাদ ও স্থানীয় ব্যবসা সংক্রান্ত তথ্য হাতের মুঠোয় পাবেন।

আপনার প্রোফাইল সম্পূর্ণ করতে ভিজিট করুন: ${typeof window !== "undefined" ? window.location.origin : "https://ourputhia.com"}/profile

শুভেচ্ছা সহ,
টিম আমাদের পুঠিয়া
পুঠিয়া, রাজশাহী`;

    // Write to Firestore 'mail' collection for Firebase Trigger Email
    await addDoc(collection(db, "mail"), {
      to: [recipientEmail],
      message: {
        subject,
        text: plainText,
        html: htmlContent
      },
      type: "welcome_email",
      recipientName: data.name,
      recipientEmail,
      recipientPhone: data.phone || null,
      createdAt: serverTimestamp(),
      status: "pending"
    });

    // Also log in user notification queue for UI tracking
    try {
      await addDoc(collection(db, "welcome_emails_sent"), {
        recipientEmail,
        recipientName: data.name,
        subject,
        sentAt: serverTimestamp()
      });
    } catch (e) {
      // Non-critical
    }

    // Log to system audit trail
    await logAuditActivity({
      action: `স্বাগতম ইমেইল কিউতে যুক্ত করা হয়েছে (${recipientEmail})`,
      details: `প্রাপক: ${data.name}, ইমেইল: ${recipientEmail}`,
      category: "user",
      severity: "info",
      customUser: "সিস্টেম বট"
    });

    console.log("Welcome email successfully queued in Firestore for:", recipientEmail);
    return true;
  } catch (error) {
    console.warn("Could not queue welcome email in Firestore:", error);
    return false;
  }
}
