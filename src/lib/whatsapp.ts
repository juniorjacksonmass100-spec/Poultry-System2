/**
 * WhatsApp sharing.
 *
 * WhatsApp does not let an app send messages silently in the background without the
 * paid WhatsApp Business API. What works for everyone, free, is a "click to chat" link:
 * it opens WhatsApp with the person's chat and the message already typed, and the admin
 * only presses Send. Used on the website and in the Android app.
 */

/** Country code added when a number is typed in local format (0712...). Tanzania = 255. */
export const DEFAULT_COUNTRY_CODE = '255';

/**
 * Turns whatever a person typed into the digits-only international format WhatsApp needs.
 *  "0712 345 678"      -> "255712345678"
 *  "+255 712 345 678"  -> "255712345678"
 *  "712345678"         -> "255712345678"
 * Returns null when it does not look like a phone number.
 */
export const normalizePhone = (raw: string | null | undefined, countryCode: string = DEFAULT_COUNTRY_CODE): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  const hadPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (trimmed.startsWith('00')) digits = digits.slice(2);       // 00255... international prefix
  else if (hadPlus) digits = digits;                            // already international
  else if (digits.startsWith('0')) digits = countryCode + digits.slice(1); // local format
  else if (!digits.startsWith(countryCode) && digits.length <= 10) digits = countryCode + digits; // no leading 0

  return digits.length >= 9 && digits.length <= 15 ? digits : null;
};

export const buildWhatsAppLink = (phone: string | null | undefined, message: string): string | null => {
  const number = normalizePhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

/** Message text used for WhatsApp: title in bold (WhatsApp uses *asterisks*), then the body. */
export const formatNewsForWhatsApp = (title: string, content: string, senderName?: string): string => {
  const footer = senderName ? `\n\n— ${senderName} (KukuTrack)` : '\n\n— KukuTrack';
  return `*${title.trim()}*\n\n${content.trim()}${footer}`;
};

/** Opens WhatsApp. Returns false if the number is unusable. */
export const openWhatsApp = (phone: string | null | undefined, message: string): boolean => {
  const link = buildWhatsAppLink(phone, message);
  if (!link) return false;
  // _blank + noopener keeps the app page alive; the Android app hands the link to WhatsApp
  const win = window.open(link, '_blank', 'noopener,noreferrer');
  if (!win) window.location.href = link;
  return true;
};
