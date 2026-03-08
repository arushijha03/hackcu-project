import emailjs from "@emailjs/nodejs";

const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;

/** Template variables for EmailJS: to_email, job_title, feedback, application_url */
export async function sendRejectionEmail(
  to: string,
  jobTitle: string,
  plainEnglishSummary: string,
  applicationUrl: string
): Promise<boolean> {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn(
      "[EmailJS] Rejection email skipped: Add EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID to .env. See .env.example."
    );
    return false;
  }

  if (!to?.trim()) {
    console.warn("[EmailJS] Rejection email skipped: No recipient email (resume email or student email).");
    return false;
  }

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: to.trim(),
        job_title: jobTitle,
        feedback: plainEnglishSummary,
        application_url: applicationUrl,
      },
      {
        publicKey: EMAILJS_PUBLIC_KEY,
        privateKey: EMAILJS_PRIVATE_KEY || undefined,
      }
    );
    console.log("[EmailJS] Rejection email sent to", to.trim());
    return true;
  } catch (err) {
    console.error("[EmailJS] Rejection email failed:", err);
    return false;
  }
}
