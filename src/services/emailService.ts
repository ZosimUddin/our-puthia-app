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
 * Generates an extraordinarily beautiful, mobile-responsive HTML welcome email template for 'Our Puthia'
 * Matching the exact wording, branding, and styling requested by the user.
 */
export function generateWelcomeEmailHtml(data: {
  name: string;
  email: string;
  phone?: string;
  stars?: number;
  appUrl?: string;
}): string {
  const appUrl = data.appUrl || "https://our-puthia-app.vercel.app";
  const userName = data.name || "সম্মানিত নাগরিক";

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
              <!-- Circle Icon Badge -->
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
              <!-- Greeting Headline -->
              <div style="margin-bottom: 22px;">
                <h2 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #0f172a;">
                  প্রিয় ${userName},
                </h2>
                <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 20px; font-size: 15px; font-weight: 800; color: #047857; margin-top: 4px;">
                  আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚
                </div>
              </div>

              <!-- Paragraph 1 -->
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #334155;">
                আমাদের সঙ্গে যুক্ত হওয়ার জন্য আপনাকে অসংখ্য ধন্যবাদ। পুঠিয়ার মানুষ, ঐতিহ্য, সংস্কৃতি ও কমিউনিটির সঙ্গে সংযুক্ত থাকার এই যাত্রায় আপনাকে পাশে পেয়ে আমরা আনন্দিত।
              </p>

              <!-- Special Highlight Callout Box -->
              <table role="presentation" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-left: 4px solid #007a55; border-radius: 14px; margin: 20px 0 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #065f46; font-weight: 600;">
                      “আমাদের পুঠিয়া শুধু একটি ওয়েবসাইট নয়—এটি আমাদের এলাকার মানুষের সঙ্গে যুক্ত থাকার একটি সুন্দর উদ্যোগ।”
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Paragraph 2 -->
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.7; color: #334155;">
                আশা করি, আমাদের এই প্ল্যাটফর্ম আপনার ভালো লাগবে এবং আপনি এখানকার বিভিন্ন সুবিধা উপভোগ করবেন।
              </p>

              <!-- Prominent CTA Button -->
              <table role="presentation" width="100%" style="margin: 28px 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/profile?edit=true" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #007a55 0%, #005a3e 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 36px; border-radius: 50px; box-shadow: 0 6px 18px rgba(0, 122, 85, 0.35); text-align: center; letter-spacing: 0.3px;">
                      👉 এখনই প্রোফাইল সম্পন্ন করুন ও সেবা দেখুন
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Paragraph 3 -->
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #334155;">
                আপনার নতুন যাত্রা সুন্দর হোক। আমাদের পুঠিয়া পরিবারের সঙ্গে থাকুন, নিজের এলাকার সঙ্গে যুক্ত থাকুন। 💚
              </p>

              <!-- Signoff -->
              <div style="margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">আন্তরিক শুভেচ্ছান্তে,</p>
                <h4 style="margin: 4px 0 0; font-size: 16px; font-weight: 800; color: #007a55;">আমাদের পুঠিয়া টিম</h4>
              </div>

              <!-- Contact & Support Section -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px 22px;">
                <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #334155;">
                  যেকোনো মতামত, অভিযোগ বা প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন:
                </p>
                <table role="presentation" width="100%">
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #475569;">
                      📧 <strong>ইমেইল:</strong> <a href="mailto:support@ourputhia.com" style="color: #007a55; text-decoration: none; font-weight: 600;">support@ourputhia.com</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #475569;">
                      🌐 <strong>ওয়েবসাইট:</strong> <a href="https://our-puthia-app.vercel.app" target="_blank" style="color: #007a55; text-decoration: none; font-weight: 600;">https://our-puthia-app.vercel.app</a>
                    </td>
                  </tr>
                </table>
                <div style="margin-top: 14px; pt-2; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #047857;">
                  🌿 সুস্থ থাকুন, সুন্দর থাকুন, পুঠিয়ার সাথেই থাকুন।
                </div>
              </div>

            </td>
          </tr>

          <!-- Footer Section -->
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
 * Queues a welcome email to the Firestore 'mail' collection with user's exact requested wording.
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
    const userName = data.name || "সম্মানিত নাগরিক";
    const subject = `আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚`;
    const appUrl = "https://our-puthia-app.vercel.app";

    const htmlContent = generateWelcomeEmailHtml({
      name: userName,
      email: recipientEmail,
      phone: data.phone,
      stars: data.stars || 20,
      appUrl
    });

    const plainText = `প্রিয় ${userName},
আমাদের পুঠিয়া পরিবারে আপনাকে স্বাগতম! 💚

আমাদের সঙ্গে যুক্ত হওয়ার জন্য আপনাকে অসংখ্য ধন্যবাদ। পুঠিয়ার মানুষ, ঐতিহ্য, সংস্কৃতি ও কমিউনিটির সঙ্গে সংযুক্ত থাকার এই যাত্রায় আপনাকে পাশে পেয়ে আমরা আনন্দিত।

আমাদের পুঠিয়া শুধু একটি ওয়েবসাইট নয়—এটি আমাদের এলাকার মানুষের সঙ্গে যুক্ত থাকার একটি সুন্দর উদ্যোগ।
আশা করি, আমাদের এই প্ল্যাটফর্ম আপনার ভালো লাগবে এবং আপনি এখানকার বিভিন্ন সুবিধা উপভোগ করবেন।

👉 এখনই প্রোফাইল সম্পন্ন করুন ও সেবা দেখুন: ${appUrl}/profile?edit=true

আপনার নতুন যাত্রা সুন্দর হোক। আমাদের পুঠিয়া পরিবারের সঙ্গে থাকুন, নিজের এলাকার সঙ্গে যুক্ত থাকুন। 💚

আন্তরিক শুভেচ্ছান্তে,
আমাদের পুঠিয়া টিম

যেকোনো মতামত, অভিযোগ বা প্রয়োজনে আমাদের সাথে যোগাযোগ করতে পারেন:

📧 ইমেইল: support@ourputhia.com
🌐 ওয়েবসাইট: ${appUrl}
সুস্থ থাকুন, সুন্দর থাকুন, পুঠিয়ার সাথেই থাকুন।

© 2026 আমাদের পুঠিয়া। সর্বস্বত্ব সংরক্ষিত।`;

    // Write to Firestore 'mail' collection for Firebase Trigger Email extension
    await addDoc(collection(db, "mail"), {
      to: [recipientEmail],
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

    // Log to system audit trail
    await logAuditActivity({
      action: `স্বাগতম ইমেইল কিউতে যুক্ত করা হয়েছে (${recipientEmail})`,
      details: `প্রাপক: ${userName}, ইমেইল: ${recipientEmail}`,
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
