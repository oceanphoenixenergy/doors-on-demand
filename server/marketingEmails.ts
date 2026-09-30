import type { QuoteSubmission } from "@shared/schema";
import { DOOR_STYLES } from "@shared/schema";

function getDoorStyleLabel(style: string): string {
  const styleConfig = DOOR_STYLES[style as keyof typeof DOOR_STYLES];
  return styleConfig?.name || style;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function deriveGalleryUrl(resumeUrl?: string): string {
  if (!resumeUrl) return '';
  try {
    const url = new URL(resumeUrl);
    return `${url.origin}/gallery`;
  } catch {
    return '';
  }
}

export const EMAIL_WRAPPER = (content: string, unsubscribeUrl?: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
<div style="text-align:center;padding:20px 0;">
<h2 style="color:#0091b3;margin:0;font-size:22px;">Doors On Demand</h2>
</div>
<div style="background:#ffffff;border-radius:8px;padding:30px;margin-bottom:20px;">
${content}
</div>
<div style="text-align:center;padding:15px 0;">
<p style="color:#9ca3af;font-size:12px;margin:5px 0;">Doors On Demand Ltd</p>
${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:12px;">Unsubscribe from future emails</a>` : ''}
</div>
</div>
</body>
</html>`;

const FACEBOOK_REVIEWS_URL = "https://www.facebook.com/doorsondemand10/reviews";

const FACEBOOK_REVIEWS_BLOCK = `
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="${FACEBOOK_REVIEWS_URL}" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>`;

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

export function generateFollowUpEmail1(quote: QuoteSubmission, unsubscribeUrl: string, customTemplate?: { subject: string; body: string }, resumeUrl?: string) {
  const doorLabel = getDoorStyleLabel(quote.doorStyle);
  const galleryUrl = deriveGalleryUrl(resumeUrl);
  const variables: Record<string, string> = {
    firstName: quote.firstName,
    lastName: quote.lastName,
    doorStyle: doorLabel,
    totalDoors: String(quote.totalDoors),
    grandTotal: formatCurrency(quote.grandTotal),
    resumeUrl: resumeUrl || "",
    galleryUrl,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const resumeBlock = resumeUrl ? `
<div style="text-align:center;margin:25px 0;">
<a href="${resumeUrl}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>` : '';

  const galleryBlock = galleryUrl ? `
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See what your home could look like</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Take a look at some of our recent transformations - real homes, real doors, real results.</p>
<a href="${galleryUrl}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>` : '';

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${quote.firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">Thanks for getting your quote for <strong>${quote.totalDoors} ${doorLabel} doors</strong> at <strong>${formatCurrency(quote.grandTotal)}</strong>. I just wanted to quickly show you what a difference new doors can make.</p>
<p style="color:#4b5563;line-height:1.6;">Last week, a customer in Solihull had 5 doors fitted. She said: <em>"I can't believe the difference - the whole house feels brand new. I wish I'd done it sooner!"</em></p>
<p style="color:#4b5563;line-height:1.6;">That's what we hear from almost every customer. New internal doors are one of the simplest ways to transform your home - and with everything included (premium handles, hinges, latches, and professional fitting), we make it easy.</p>
${galleryBlock}
${FACEBOOK_REVIEWS_BLOCK}
${resumeBlock}
<p style="color:#4b5563;line-height:1.6;">Any questions at all? I'm always happy to chat.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${quote.firstName}, see what your home could look like`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}

export function generateFollowUpEmail2(quote: QuoteSubmission, unsubscribeUrl: string, customTemplate?: { subject: string; body: string }, resumeUrl?: string) {
  const doorLabel = getDoorStyleLabel(quote.doorStyle);
  const deposit = formatCurrency(Math.ceil(quote.grandTotal / 2));
  const galleryUrl = deriveGalleryUrl(resumeUrl);
  const variables: Record<string, string> = {
    firstName: quote.firstName,
    lastName: quote.lastName,
    doorStyle: doorLabel,
    totalDoors: String(quote.totalDoors),
    grandTotal: formatCurrency(quote.grandTotal),
    deposit,
    resumeUrl: resumeUrl || "",
    galleryUrl,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const resumeBlock = resumeUrl ? `
<div style="text-align:center;margin:25px 0;">
<a href="${resumeUrl}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>` : '';

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${quote.firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">I know getting new doors is a big decision, so I wanted to answer the 3 most common questions I get:</p>
<div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:15px 0;">
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"Will it be messy?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 15px;">Not at all. I fit doors cleanly and tidy up after myself. Most customers are surprised how quick and clean the process is - usually done in a day.</p>
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"What if my door frames aren't standard?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 15px;">No problem. I measure everything on the day and trim to fit. Every home is different and I've seen it all - victorian, new-build, everything in between.</p>
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"Is it really all-inclusive?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0;">Yes - your quote of <strong>${formatCurrency(quote.grandTotal)}</strong> covers the ${doorLabel} doors, premium handles, hinges, latches, and professional fitting. No hidden extras. You pay ${deposit} to book, and the rest on completion.</p>
</div>
${FACEBOOK_REVIEWS_BLOCK}
${resumeBlock}
<p style="color:#4b5563;line-height:1.6;">Still have questions? I'm always happy to have a quick chat - no pressure whatsoever.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">All the best,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${quote.firstName}, got questions about your door quote?`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}

export function generateFollowUpEmail3(quote: QuoteSubmission, unsubscribeUrl: string, customTemplate?: { subject: string; body: string }, resumeUrl?: string) {
  const doorLabel = getDoorStyleLabel(quote.doorStyle);
  const galleryUrl = deriveGalleryUrl(resumeUrl);
  const variables: Record<string, string> = {
    firstName: quote.firstName,
    lastName: quote.lastName,
    doorStyle: doorLabel,
    totalDoors: String(quote.totalDoors),
    grandTotal: formatCurrency(quote.grandTotal),
    resumeUrl: resumeUrl || "",
    galleryUrl,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const resumeBlock = resumeUrl ? `
<div style="text-align:center;margin:25px 0;">
<a href="${resumeUrl}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>` : '';

  const galleryBlock = galleryUrl ? `
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See our latest work</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Browse real before &amp; after photos from recent fittings across the West Midlands.</p>
<a href="${galleryUrl}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>` : '';

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${quote.firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">Quick update - my diary is filling up fast over the next few weeks. I only take on a limited number of fittings each month so I can give every job the time and attention it deserves.</p>
<p style="color:#4b5563;line-height:1.6;">Your quote for <strong>${quote.totalDoors} ${doorLabel} doors</strong> at <strong>${formatCurrency(quote.grandTotal)}</strong> is still valid, but I wanted to let you know that popular dates are going quickly.</p>
<p style="color:#4b5563;line-height:1.6;">A lot of homeowners tell me they spent weeks getting quotes from different companies - only to come back to us because we include everything in one simple price. No chasing separate tradesmen, no surprise costs, no mess left behind.</p>
${galleryBlock}
${FACEBOOK_REVIEWS_BLOCK}
${resumeBlock}
<p style="color:#4b5563;line-height:1.6;">If you'd like to lock in a date before they're gone, just click above. Or drop me a message if you'd like to chat first.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${quote.firstName}, fitting dates are going fast`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}

export function generateFollowUpEmail4(quote: QuoteSubmission, unsubscribeUrl: string, customTemplate?: { subject: string; body: string }, resumeUrl?: string) {
  const doorLabel = getDoorStyleLabel(quote.doorStyle);
  const galleryUrl = deriveGalleryUrl(resumeUrl);
  const variables: Record<string, string> = {
    firstName: quote.firstName,
    lastName: quote.lastName,
    doorStyle: doorLabel,
    totalDoors: String(quote.totalDoors),
    grandTotal: formatCurrency(quote.grandTotal),
    resumeUrl: resumeUrl || "",
    galleryUrl,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const resumeBlock = resumeUrl ? `
<div style="text-align:center;margin:25px 0;">
<a href="${resumeUrl}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>` : '';

  const galleryBlock = galleryUrl ? `
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See homes we've transformed</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Take a look at the difference new doors make - you might be surprised.</p>
<a href="${galleryUrl}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>` : '';

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${quote.firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">This is my last message about your door quote, and I wanted to leave you with this thought.</p>
<p style="color:#4b5563;line-height:1.6;">Every homeowner I've worked with says the same thing: <em>"I wish I'd done this years ago."</em> Not because the doors are fancy or expensive - but because walking through your home and seeing beautiful, solid oak doors makes you feel proud of where you live.</p>
<p style="color:#4b5563;line-height:1.6;">Your home is where you spend most of your time. It should make you smile when you walk through it. And honestly, new internal doors are one of the easiest and most affordable ways to make that happen.</p>
<p style="color:#4b5563;line-height:1.6;">Your quote for <strong>${quote.totalDoors} ${doorLabel} doors</strong> at <strong>${formatCurrency(quote.grandTotal)}</strong> is still waiting for you - everything included, no hidden costs.</p>
${galleryBlock}
${FACEBOOK_REVIEWS_BLOCK}
${resumeBlock}
<p style="color:#4b5563;line-height:1.6;">No pressure at all, ${quote.firstName}. But if you do decide to go ahead, I'd love to help make it happen. Just drop me a message anytime.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">All the best,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${quote.firstName}, one last thing about your home`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}

export function generateBalancePaymentEmail(data: {
  firstName?: string;
  customerName?: string;
  customerEmail?: string;
  balanceDue?: number;
  balanceAmount?: string;
  paymentLink?: string;
  balancePaymentUrl?: string;
}, unsubscribeUrl?: string, customTemplate?: { subject: string; body: string }) {
  const firstName = data.firstName || (data.customerName || 'Customer').split(' ')[0];
  const amount = data.balanceAmount || (data.balanceDue ? formatCurrency(data.balanceDue) : '\u00a30');
  const link = data.paymentLink || data.balancePaymentUrl || '#';

  const variables: Record<string, string> = {
    firstName,
    balanceAmount: amount,
    paymentLink: link,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">Great news - your doors have been fitted! We hope you love them.</p>
<p style="color:#4b5563;line-height:1.6;">The remaining balance of <strong>${amount}</strong> is now due. You can pay securely using the link below:</p>
<div style="text-align:center;margin:25px 0;">
<a href="${link}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Pay ${amount} Balance</a>
</div>
<p style="color:#4b5563;line-height:1.6;">If you have any questions, just reply to this email or message me on WhatsApp.</p>
<p style="color:#4b5563;line-height:1.6;">Thanks again for choosing Doors On Demand!<br><strong>Mark</strong></p>`;
  return {
    subject: `Your balance payment - ${amount}`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}

export function generateReviewRequestEmail(data: {
  customerName?: string;
  firstName?: string;
  facebookReviewUrl?: string;
  reviewLink?: string;
}, unsubscribeUrl?: string, customTemplate?: { subject: string; body: string }) {
  const firstName = data.firstName || (data.customerName || 'Customer').split(' ')[0];
  const reviewLink = data.reviewLink || data.facebookReviewUrl || '#';

  const variables: Record<string, string> = {
    firstName,
    reviewLink,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">Thank you so much for your final payment - everything is now settled.</p>
<p style="color:#4b5563;line-height:1.6;">We really hope you're enjoying your new doors! If you've got a moment, we'd be incredibly grateful if you could leave us a quick review. It helps other homeowners find us and means the world to a small business like ours.</p>
<div style="text-align:center;margin:25px 0;">
<a href="${reviewLink}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Leave a Review</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Thanks for choosing Doors On Demand - it's been a pleasure working with you!</p>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${firstName}, how are your new doors?`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}

export function generateGoogleReviewRequestEmail(data: {
  firstName: string;
  googleReviewUrl: string;
}, unsubscribeUrl?: string, customTemplate?: { subject: string; body: string }) {
  const variables: Record<string, string> = {
    firstName: data.firstName,
    googleReviewUrl: data.googleReviewUrl,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const configBlock = configSummary ? `
<div style="background:#f0fafb;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 4px;">Your saved configuration</p>
<p style="color:#4b5563;margin:0;">${configSummary}</p>
</div>` : '';

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${data.firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">Thank you so much for choosing Doors On Demand - it was a real pleasure working with you, and we hope you're loving your new doors!</p>
<p style="color:#4b5563;line-height:1.6;">If you have a spare moment, we'd be incredibly grateful if you could leave us a quick review on Google. It makes a huge difference to a small business like ours and helps other homeowners find us.</p>
<div style="text-align:center;margin:30px 0;">
<a href="${data.googleReviewUrl}" style="display:inline-block;background:#4285F4;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Leave a Google Review &#9733;</a>
</div>
<p style="color:#4b5563;line-height:1.6;">It only takes a minute and means the world to us. Thank you!</p>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${data.firstName}, would you leave us a Google review?`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}

export function generateAbandonedQuoteRecoveryEmail(data: {
  firstName: string;
  resumeUrl: string;
  doorStyle?: string;
  totalDoors?: number;
}, unsubscribeUrl: string, customTemplate?: { subject: string; body: string }) {
  const doorLabel = data.doorStyle ? getDoorStyleLabel(data.doorStyle) : "";
  const configSummary = doorLabel && data.totalDoors
    ? `${data.totalDoors} ${doorLabel} door${data.totalDoors !== 1 ? "s" : ""}`
    : "";

  const variables: Record<string, string> = {
    firstName: data.firstName,
    resumeUrl: data.resumeUrl,
    doorStyle: doorLabel,
    totalDoors: data.totalDoors ? String(data.totalDoors) : "",
    configSummary,
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body, unsubscribeUrl),
    };
  }

  const configBlock = configSummary ? `
<div style="background:#f0fafb;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 4px;">Your saved configuration</p>
<p style="color:#4b5563;margin:0;">${configSummary}</p>
</div>` : '';

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Hi ${data.firstName},</h3>
<p style="color:#4b5563;line-height:1.6;">You started building your door quote with us but didn't quite finish - no worries at all, life gets busy!</p>
<p style="color:#4b5563;line-height:1.6;">The good news is your quote is saved and ready for you. Just click the button below to pick up exactly where you left off - it only takes a couple of minutes to complete.</p>
${configBlock}
<div style="text-align:center;margin:25px 0;">
<a href="${data.resumeUrl}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Resume My Quote</a>
</div>
<p style="color:#4b5563;line-height:1.6;">If you have any questions before you complete your quote, I'm always happy to help - just drop me a message on WhatsApp.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${data.firstName}, you left your quote unfinished…`,
    html: EMAIL_WRAPPER(content, unsubscribeUrl),
  };
}


export function generateDiscountEmail(data: {
  firstName: string;
  doorStyle: string;
  totalDoors: number;
  originalTotal: number;
  discountPercent: number;
  newTotal: number;
  newDeposit: number;
  resumeUrl?: string;
}, customTemplate?: { subject: string; body: string }) {
  const variables: Record<string, string> = {
    firstName: data.firstName,
    doorStyle: data.doorStyle,
    totalDoors: String(data.totalDoors),
    originalTotal: formatCurrency(data.originalTotal),
    discountPercent: String(data.discountPercent),
    newTotal: formatCurrency(data.newTotal),
    newDeposit: formatCurrency(data.newDeposit),
    savings: formatCurrency(data.originalTotal - data.newTotal),
    resumeUrl: data.resumeUrl || "",
  };

  if (customTemplate) {
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return {
      subject,
      html: EMAIL_WRAPPER(body),
    };
  }

  const resumeBlock = data.resumeUrl ? `
<div style="text-align:center;margin:25px 0;">
<a href="${data.resumeUrl}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Book Your Fitting Now</a>
</div>` : '';

  const content = `
<h3 style="color:#1f2937;margin:0 0 15px;">Great news, ${data.firstName}!</h3>
<p style="color:#4b5563;line-height:1.6;">I've applied a <strong>${data.discountPercent}% discount</strong> to your door quote - here's your updated pricing:</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="color:#6b7280;padding:6px 0;">Original quote</td><td style="text-align:right;color:#6b7280;padding:6px 0;text-decoration:line-through;">${formatCurrency(data.originalTotal)}</td></tr>
<tr><td style="color:#0091b3;font-weight:600;padding:6px 0;">Your saving (${data.discountPercent}%)</td><td style="text-align:right;color:#0091b3;font-weight:600;padding:6px 0;">-${formatCurrency(data.originalTotal - data.newTotal)}</td></tr>
<tr><td colspan="2" style="border-top:1px solid #e5e7eb;padding:0;"></td></tr>
<tr><td style="color:#1f2937;font-weight:700;padding:8px 0;font-size:18px;">New total</td><td style="text-align:right;color:#1f2937;font-weight:700;padding:8px 0;font-size:18px;">${formatCurrency(data.newTotal)}</td></tr>
<tr><td style="color:#6b7280;padding:4px 0;">Deposit (50%)</td><td style="text-align:right;color:#6b7280;padding:4px 0;">${formatCurrency(data.newDeposit)}</td></tr>
</table>
</div>
<p style="color:#4b5563;line-height:1.6;">That's <strong>${data.totalDoors} ${data.doorStyle} doors</strong> supplied and fitted, with premium handles, hinges and latches all included.</p>
${resumeBlock}
<p style="color:#4b5563;line-height:1.6;">If you've got any questions, just drop me a message - happy to help.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`;
  return {
    subject: `${data.firstName}, I've applied a discount to your door quote`,
    html: EMAIL_WRAPPER(content),
  };
}
