import type { Express, Request, Response, NextFunction } from "express";
import { verifyAdminCredentials, changeAdminPassword } from "./adminAuth";
import { storage } from "./storage";
import { sendEmail } from "./gmail";
import { generateBalancePaymentEmail, generateReviewRequestEmail, generateDiscountEmail, generateGoogleReviewRequestEmail, EMAIL_WRAPPER } from "./marketingEmails";
import { z } from "zod";
import { DOOR_STYLES } from "@shared/schema";
import { getUncachableStripeClient } from "./stripeClient";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    adminUsername?: string;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

const DEFAULT_TEMPLATES = [
  {
    templateKey: "follow_up_1",
    name: "24-Hour Follow Up",
    subject: "{{firstName}}, see what your home could look like",
    availableVariables: "firstName, lastName, doorStyle, totalDoors, grandTotal, resumeUrl, galleryUrl",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thanks for getting your quote for <strong>{{totalDoors}} {{doorStyle}} doors</strong> at <strong>{{grandTotal}}</strong>. I just wanted to quickly show you what a difference new doors can make.</p>
<p style="color:#4b5563;line-height:1.6;">Last week, a customer in Solihull had 5 doors fitted. She said: <em>"I can't believe the difference - the whole house feels brand new. I wish I'd done it sooner!"</em></p>
<p style="color:#4b5563;line-height:1.6;">That's what we hear from almost every customer. New internal doors are one of the simplest ways to transform your home - and with everything included (premium handles, hinges, latches, and professional fitting), we make it easy.</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See what your home could look like</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Take a look at some of our recent transformations - real homes, real doors, real results.</p>
<a href="{{galleryUrl}}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">Any questions at all? I'm always happy to chat.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  {
    templateKey: "follow_up_2",
    name: "3-Day Follow Up",
    subject: "{{firstName}}, got questions about your door quote?",
    availableVariables: "firstName, lastName, doorStyle, totalDoors, grandTotal, deposit, resumeUrl, galleryUrl",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">I know getting new doors is a big decision, so I wanted to answer the 3 most common questions I get:</p>
<div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:15px 0;">
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"Will it be messy?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 15px;">Not at all. I fit doors cleanly and tidy up after myself. Most customers are surprised how quick and clean the process is - usually done in a day.</p>
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"What if my door frames aren't standard?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 15px;">No problem. I measure everything on the day and trim to fit. Every home is different and I've seen it all - victorian, new-build, everything in between.</p>
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"Is it really all-inclusive?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0;">Yes - your quote of <strong>{{grandTotal}}</strong> covers the {{doorStyle}} doors, premium handles, hinges, latches, and professional fitting. No hidden extras. You pay {{deposit}} to book, and the rest on completion.</p>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">Still have questions? I'm always happy to have a quick chat - no pressure whatsoever.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">All the best,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  {
    templateKey: "balance_payment",
    name: "Balance Payment Request",
    subject: "Your balance payment - {{balanceAmount}}",
    availableVariables: "firstName, balanceAmount, paymentLink",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Great news - your doors have been fitted! We hope you love them.</p>
<p style="color:#4b5563;line-height:1.6;">The remaining balance of <strong>{{balanceAmount}}</strong> is now due. You can pay securely using the link below:</p>
<div style="text-align:center;margin:25px 0;">
<a href="{{paymentLink}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Pay {{balanceAmount}} Balance</a>
</div>
<p style="color:#4b5563;line-height:1.6;">If you have any questions, just reply to this email or message me on WhatsApp.</p>
<p style="color:#4b5563;line-height:1.6;">Thanks again for choosing Doors On Demand!<br><strong>Mark</strong></p>`,
  },
  {
    templateKey: "follow_up_3",
    name: "7-Day Follow Up",
    subject: "{{firstName}}, fitting dates are going fast",
    availableVariables: "firstName, lastName, doorStyle, totalDoors, grandTotal, resumeUrl, galleryUrl",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Quick update - my diary is filling up fast over the next few weeks. I only take on a limited number of fittings each month so I can give every job the time and attention it deserves.</p>
<p style="color:#4b5563;line-height:1.6;">Your quote for <strong>{{totalDoors}} {{doorStyle}} doors</strong> at <strong>{{grandTotal}}</strong> is still valid, but I wanted to let you know that popular dates are going quickly.</p>
<p style="color:#4b5563;line-height:1.6;">A lot of homeowners tell me they spent weeks getting quotes from different companies - only to come back to us because we include everything in one simple price. No chasing separate tradesmen, no surprise costs, no mess left behind.</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See our latest work</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Browse real before &amp; after photos from recent fittings across the West Midlands.</p>
<a href="{{galleryUrl}}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">If you'd like to lock in a date before they're gone, just click above. Or drop me a message if you'd like to chat first.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  {
    templateKey: "follow_up_4",
    name: "14-Day Follow Up",
    subject: "{{firstName}}, one last thing about your home",
    availableVariables: "firstName, lastName, doorStyle, totalDoors, grandTotal, resumeUrl, galleryUrl",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">This is my last message about your door quote, and I wanted to leave you with this thought.</p>
<p style="color:#4b5563;line-height:1.6;">Every homeowner I've worked with says the same thing: <em>"I wish I'd done this years ago."</em> Not because the doors are fancy or expensive - but because walking through your home and seeing beautiful, solid oak doors makes you feel proud of where you live.</p>
<p style="color:#4b5563;line-height:1.6;">Your home is where you spend most of your time. It should make you smile when you walk through it. And honestly, new internal doors are one of the easiest and most affordable ways to make that happen.</p>
<p style="color:#4b5563;line-height:1.6;">Your quote for <strong>{{totalDoors}} {{doorStyle}} doors</strong> at <strong>{{grandTotal}}</strong> is still waiting for you - everything included, no hidden costs.</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See homes we've transformed</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Take a look at the difference new doors make - you might be surprised.</p>
<a href="{{galleryUrl}}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">No pressure at all, {{firstName}}. But if you do decide to go ahead, I'd love to help make it happen. Just drop me a message anytime.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">All the best,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  {
    templateKey: "quote_preview",
    name: "Quote Preview Email",
    subject: "Your Door Quote - {{grandTotal}} | Doors On Demand",
    availableVariables: "firstName, doorStyle, totalDoors, grandTotal, deposit, resumeUrl",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thanks for getting a quote with Doors On Demand. Here's a summary of your door package:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;margin:20px 0;">
<tr><td style="padding:16px;">
<p style="margin:4px 0;color:#4b5563;"><strong>Door Style:</strong> {{doorStyle}}</p>
<p style="margin:4px 0;color:#4b5563;"><strong>Total Doors:</strong> {{totalDoors}}</p>
<p style="margin:4px 0;color:#4b5563;"><strong>Quote Total:</strong> {{grandTotal}}</p>
<p style="margin:4px 0;color:#4b5563;"><strong>Deposit (50%):</strong> {{deposit}}</p>
</td></tr>
</table>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#4b5563;line-height:1.6;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">Any questions? Message Mark on WhatsApp.</p>
<div style="text-align:center;margin:20px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>`,
  },
  {
    templateKey: "deposit_confirmation",
    name: "Deposit Confirmation Email",
    subject: "Booking Confirmed - {{fittingDate}} | Doors On Demand",
    availableVariables: "firstName, fittingDate, totalDoors, doorStyle, depositPaid, balanceDue",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thanks for booking with Doors On Demand. Your deposit has been received and your fitting date is confirmed.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:8px;margin:20px 0;">
<tr><td style="padding:16px;">
<p style="margin:4px 0;color:#4b5563;"><strong>Fitting Date:</strong> {{fittingDate}}</p>
<p style="margin:4px 0;color:#4b5563;"><strong>Total Doors:</strong> {{totalDoors}}</p>
<p style="margin:4px 0;color:#4b5563;"><strong>Door Style:</strong> {{doorStyle}}</p>
<p style="margin:4px 0;color:#4b5563;"><strong>Deposit Paid:</strong> {{depositPaid}}</p>
<p style="margin:4px 0;color:#4b5563;"><strong>Balance Due:</strong> {{balanceDue}}</p>
</td></tr>
</table>
<p style="color:#1f2937;font-weight:600;margin:20px 0 10px;">What happens next?</p>
<p style="color:#4b5563;line-height:1.8;">&#10003; Mark will be in touch via email or WhatsApp to confirm everything<br>&#10003; Mark will arrive on your fitting date<br>&#10003; Pay the remaining balance on completion</p>
<p style="color:#4b5563;line-height:1.6;">Any questions? Message Mark on WhatsApp.</p>
<div style="text-align:center;margin:20px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>`,
  },
  {
    templateKey: "review_request",
    name: "Review Request",
    subject: "{{firstName}}, how are your new doors?",
    availableVariables: "firstName, reviewLink",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thank you so much for your final payment - everything is now settled.</p>
<p style="color:#4b5563;line-height:1.6;">We really hope you're enjoying your new doors! If you've got a moment, we'd be incredibly grateful if you could leave us a quick review. It helps other homeowners find us and means the world to a small business like ours.</p>
<div style="text-align:center;margin:25px 0;">
<a href="{{reviewLink}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Leave a Review</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Thanks for choosing Doors On Demand - it's been a pleasure working with you!</p>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  {
    templateKey: "google_review_request",
    name: "Google Review Request",
    subject: "{{firstName}}, would you leave us a Google review?",
    availableVariables: "firstName, googleReviewUrl",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thank you so much for choosing Doors On Demand - it was a real pleasure working with you, and we hope you're loving your new doors!</p>
<p style="color:#4b5563;line-height:1.6;">If you have a spare moment, we'd be incredibly grateful if you could leave us a quick review on Google. It makes a huge difference to a small business like ours and helps other homeowners find us.</p>
<div style="text-align:center;margin:30px 0;">
<a href="{{googleReviewUrl}}" style="display:inline-block;background:#4285F4;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Leave a Google Review &#9733;</a>
</div>
<p style="color:#4b5563;line-height:1.6;">It only takes a minute and means the world to us. Thank you!</p>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  {
    templateKey: "abandoned_quote_recovery",
    name: "Abandoned Quote Recovery",
    subject: "{{firstName}}, you left your quote unfinished…",
    availableVariables: "firstName, resumeUrl, doorStyle, totalDoors, configSummary",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">You started building your door quote with us but didn't quite finish - no worries at all, life gets busy!</p>
<p style="color:#4b5563;line-height:1.6;">The good news is your quote is saved and ready for you. Just click the button below to pick up exactly where you left off - it only takes a couple of minutes to complete.</p>
<div style="background:#f0fafb;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 4px;">Your saved configuration</p>
<p style="color:#4b5563;margin:0;">{{configSummary}}</p>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Resume My Quote</a>
</div>
<p style="color:#4b5563;line-height:1.6;">If you have any questions before you complete your quote, I'm always happy to help - just drop me a message on WhatsApp.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  {
    templateKey: "discount_notification",
    name: "Discount Notification",
    subject: "{{firstName}}, I've applied a discount to your door quote",
    availableVariables: "firstName, doorStyle, totalDoors, originalTotal, discountPercent, newTotal, newDeposit, savings, resumeUrl",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Great news, {{firstName}}!</h3>
<p style="color:#4b5563;line-height:1.6;">I've applied a <strong>{{discountPercent}}% discount</strong> to your door quote - here's your updated pricing:</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;">
<p style="margin:6px 0;color:#6b7280;">Original quote: <span style="text-decoration:line-through;">{{originalTotal}}</span></p>
<p style="margin:6px 0;color:#0091b3;font-weight:600;">Your saving ({{discountPercent}}%): -{{savings}}</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0;">
<p style="margin:6px 0;color:#1f2937;font-weight:700;font-size:18px;">New total: {{newTotal}}</p>
<p style="margin:6px 0;color:#6b7280;">Deposit (50%): {{newDeposit}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">That's <strong>{{totalDoors}} {{doorStyle}} doors</strong> supplied and fitted, with premium handles, hinges and latches all included.</p>
<p style="color:#4b5563;line-height:1.6;">If you'd like to go ahead and book your fitting, just reply to this email or drop me a message on WhatsApp - I'll get you sorted.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
];

async function seedDefaultTemplates() {
  try {
    const existing = await storage.getEmailTemplates();
    for (const tmpl of DEFAULT_TEMPLATES) {
      const found = existing.find(e => e.templateKey === tmpl.templateKey);
      if (!found) {
        await storage.upsertEmailTemplate(tmpl.templateKey, {
          name: tmpl.name,
          subject: tmpl.subject,
          body: tmpl.body,
          availableVariables: tmpl.availableVariables,
        });
        console.log(`Seeded email template: ${tmpl.templateKey}`);
      } else if (
        tmpl.templateKey.startsWith('follow_up_') &&
        tmpl.availableVariables.includes('resumeUrl') &&
        !found.body.includes('resumeUrl') &&
        !found.body.includes('Continue')
      ) {
        await storage.upsertEmailTemplate(tmpl.templateKey, {
          name: tmpl.name,
          subject: tmpl.subject,
          body: tmpl.body,
          availableVariables: tmpl.availableVariables,
        });
        console.log(`Updated follow-up template with booking button: ${tmpl.templateKey}`);
      } else if (
        tmpl.templateKey.startsWith('follow_up_') &&
        tmpl.body.includes('doorsondemand10/reviews') &&
        !found.body.includes('doorsondemand10/reviews')
      ) {
        await storage.upsertEmailTemplate(tmpl.templateKey, {
          name: tmpl.name,
          subject: tmpl.subject,
          body: tmpl.body,
          availableVariables: tmpl.availableVariables,
        });
        console.log(`Updated follow-up template with Facebook reviews: ${tmpl.templateKey}`);
      }
    }
  } catch (error) {
    console.error("Failed to seed default templates:", error);
  }
}

async function seedDefaultGalleryItems() {
  try {
    const existing = await storage.getGalleryItems();
    if (existing.length > 0) return;

    const defaultItems = [
      {
        id: 'ef5bec18-7f41-4310-bd77-ef36d4c8116f',
        caption: 'Hallway Transformation - Mexicano Oak Doors',
        location: 'Solihull',
        beforeImagePath: '/objects/uploads/4fa712d7-64a0-4e28-bc40-815e0818420c',
        afterImagePath: '/objects/uploads/d14cee4d-3c80-4561-a43a-4f73dd56d9d6',
        sortOrder: 1,
        mediaType: 'image' as const,
      },
      {
        id: '58f20beb-a95c-4d5e-92db-0eed4c367a12',
        caption: 'Landing & Hallway Transformation - Mexicano Oak',
        location: 'West Midlands',
        beforeImagePath: '/objects/uploads/308db504-191c-4dce-9557-77a5fc4f4d6c',
        afterImagePath: '/objects/uploads/fd1d74c3-534c-4090-9177-868bab79fc13',
        sortOrder: 2,
        mediaType: 'video' as const,
      },
    ];

    for (const item of defaultItems) {
      await storage.createGalleryItem(item);
      console.log(`Seeded gallery item: ${item.caption}`);
    }
  } catch (error) {
    console.error("Failed to seed gallery items:", error);
  }
}

const CALENDAR_MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseCalendarDisplayDate(displayDate: string, referenceDate?: Date): Date | null {
  const s = displayDate.trim();
  const firstPart = s.split(' - ')[0].trim();
  const match = firstPart.match(/(\d{1,2})\s+([A-Za-z]{3})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthKey = match[2].toLowerCase();
  const monthIdx = CALENDAR_MONTH_MAP[monthKey];
  if (monthIdx === undefined) return null;

  if (referenceDate) {
    // Use the reference date's year as the primary candidate.
    // This is used for historical records (completed jobs) where depositPaidAt or completedAt gives context.
    const refYear = referenceDate.getFullYear();
    // Try the reference year first
    let candidate = new Date(refYear, monthIdx, day);
    if (isNaN(candidate.getTime())) return null;
    // If the candidate is more than 6 months away from the reference, try adjacent years
    const diffMs = Math.abs(candidate.getTime() - referenceDate.getTime());
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
    if (diffMs > sixMonthsMs) {
      // Try year before reference year
      const prevCandidate = new Date(refYear - 1, monthIdx, day);
      const nextCandidate = new Date(refYear + 1, monthIdx, day);
      const prevDiff = Math.abs(prevCandidate.getTime() - referenceDate.getTime());
      const nextDiff = Math.abs(nextCandidate.getTime() - referenceDate.getTime());
      if (prevDiff < diffMs) candidate = prevCandidate;
      if (nextDiff < prevDiff && nextDiff < diffMs) candidate = nextCandidate;
    }
    return candidate;
  }

  // No reference date: infer year from current date.
  // Assume fitting dates are always upcoming (booked jobs), so if month is in the past,
  // it's next year.
  const now = new Date();
  let year = now.getFullYear();
  // Build a candidate for this year
  const candidateThisYear = new Date(year, monthIdx, day);
  // If the candidate is more than 30 days in the past, it's likely next year
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (candidateThisYear < thirtyDaysAgo) {
    year += 1;
  }
  const d = new Date(year, monthIdx, day);
  if (isNaN(d.getTime())) return null;
  return d;
}

function parseCalendarEndDisplayDate(displayDate: string, referenceDate?: Date): Date | null {
  const s = displayDate.trim();
  const parts = s.split(' - ');
  if (parts.length < 2) return null;
  return parseCalendarDisplayDate(parts[1], referenceDate);
}

export function registerAdminRoutes(app: Express) {
  app.get("/api/unsubscribe", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      await storage.setUnsubscribed(email, true);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  app.get("/api/resubscribe", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }
      await storage.setUnsubscribed(email, false);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to resubscribe" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const valid = await verifyAdminCredentials(username, password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.isAdmin = true;
      req.session.adminUsername = username;
      return res.json({ success: true });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/admin/me", (req, res) => {
    if (req.session?.isAdmin) {
      return res.json({ authenticated: true, username: req.session.adminUsername });
    }
    return res.json({ authenticated: false });
  });

  app.post("/api/admin/change-password", requireAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      await changeAdminPassword(req.session.adminUsername!, newPassword);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/admin/customers", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      let customers;
      if (status === "unsubscribed") {
        const all = await storage.getQuoteSubmissions();
        customers = all.filter(c => c.unsubscribed);
      } else if (status && status !== "all") {
        customers = await storage.getQuoteSubmissionsByStatus(status);
      } else {
        customers = await storage.getQuoteSubmissions();
      }
      return res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      return res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/admin/customers/deduplicate", requireAdmin, async (req, res) => {
    try {
      const removed = await storage.deduplicateQuotedSubmissions();
      return res.json({ success: true, removed });
    } catch (error) {
      console.error("Deduplication error:", error);
      return res.status(500).json({ error: "Failed to deduplicate" });
    }
  });

  app.get("/api/admin/customers/export-csv", requireAdmin, async (req, res) => {
    try {
      const allCustomers = await storage.getQuoteSubmissions();
      const seen = new Set<string>();
      const deduplicated = allCustomers.filter(c => {
        const email = c.email.toLowerCase();
        if (seen.has(email)) return false;
        seen.add(email);
        return true;
      });

      const headers = ["Name", "Email", "Mobile", "Postcode", "Door Style", "Quote Total", "Status", "Outcome", "Outcome Notes", "Follow Up Date", "Date"];
      const rows = deduplicated.map(c => [
        `"${c.firstName} ${c.lastName}"`,
        `"${c.email}"`,
        `"${c.mobile}"`,
        `"${c.postcode}"`,
        `"${c.doorStyle}"`,
        c.grandTotal,
        `"${c.status}"`,
        `"${(c.dispositionStatus || '').replace(/_/g, ' ')}"`,
        `"${(c.dispositionNotes || '').replace(/"/g, '""')}"`,
        `"${c.followUpDate ? new Date(c.followUpDate).toLocaleDateString("en-GB") : ''}"`,
        `"${new Date(c.timestamp).toLocaleDateString("en-GB")}"`,
      ].join(","));

      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=customers.csv");
      return res.send(csv);
    } catch (error) {
      console.error("CSV export error:", error);
      return res.status(500).json({ error: "Failed to export customers" });
    }
  });

  app.get("/api/admin/customers/:id/emails", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getEmailLogsByQuote(req.params.id as string);
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch email logs" });
    }
  });

  app.patch("/api/admin/customers/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["quoted", "deposit_paid", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await storage.updateQuoteStatus(req.params.id as string, status);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/admin/customers/:id/pipeline-stage", requireAdmin, async (req, res) => {
    try {
      const { pipelineStage } = req.body;
      const validStages = ["new_lead", "quoted", "follow_up", "sizes_submitted", "booked", "completed", "lost"];
      if (!validStages.includes(pipelineStage)) {
        return res.status(400).json({ error: "Invalid pipeline stage" });
      }
      const result = await storage.updatePipelineStage(req.params.id as string, pipelineStage);
      if (!result) {
        return res.status(404).json({ error: "Customer not found" });
      }

      if (pipelineStage === "completed" && result.email) {
        try {
          const existingLogs = await storage.getEmailLogsByQuote(result.id);
          const alreadySent = existingLogs.some(log => log.emailType === "google_review_request");
          if (!alreadySent) {
            const googleReviewUrl = process.env.GOOGLE_REVIEWS_URL || "https://g.page/r/review";
            const template = await storage.getEmailTemplate("google_review_request");
            const email = generateGoogleReviewRequestEmail(
              { firstName: result.firstName, googleReviewUrl },
              undefined,
              template ? { subject: template.subject, body: template.body } : undefined
            );
            const sent = await sendEmail(result.email, email.subject, email.html);
            if (sent) {
              await storage.createEmailLog({
                quoteId: result.id,
                recipientEmail: result.email,
                recipientName: `${result.firstName} ${result.lastName}`,
                emailType: "google_review_request",
                subject: email.subject,
              });
              console.log(`Google review request sent to ${result.email}`);
            }
          } else {
            console.log(`Google review request already sent to ${result.email}, skipping duplicate`);
          }
        } catch (emailErr) {
          console.error("Failed to send Google review request email:", emailErr);
        }
      }

      return res.json(result);
    } catch (error) {
      console.error("Pipeline stage update error:", error);
      return res.status(500).json({ error: "Failed to update pipeline stage" });
    }
  });

  app.patch("/api/admin/customers/:id/edit-quote", requireAdmin, async (req, res) => {
    try {
      const { totalDoors, fireDoors, glazedDoors, bathroomLocks, grandTotal, depositDue, notes, doorStyle, doorFinish, handleModel, handleFinish, glazedStyle, estimatedDays } = req.body;
      const result = await storage.editQuote(req.params.id as string, {
        totalDoors, fireDoors, glazedDoors, bathroomLocks, grandTotal, depositDue, notes, doorStyle, doorFinish, handleModel, handleFinish, glazedStyle, estimatedDays,
      });
      if (!result) {
        return res.status(404).json({ error: "Customer not found" });
      }
      if (result.resumeToken) {
        try {
          const draft = await storage.getQuoteDraft(result.resumeToken);
          if (draft && draft.wizardState) {
            const updatedWizardState = {
              ...(draft.wizardState as Record<string, unknown>),
              ...(totalDoors !== undefined && { totalDoors }),
              ...(fireDoors !== undefined && { fireDoors }),
              ...(glazedDoors !== undefined && { glazedDoors }),
              ...(bathroomLocks !== undefined && { bathroomLocks }),
              ...(doorStyle !== undefined && { doorStyle }),
              ...(doorFinish !== undefined && { doorFinish }),
              ...(handleModel !== undefined && { handleModel }),
              ...(handleFinish !== undefined && { handleFinish }),
              ...(glazedStyle !== undefined && { glazedStyle }),
              ...(grandTotal !== undefined && { grandTotalOverride: grandTotal }),
              ...(depositDue !== undefined && { depositDueOverride: depositDue }),
            };
            await storage.updateQuoteDraftWizardState(result.resumeToken, updatedWizardState);
          }
        } catch (draftError) {
          console.error("Failed to update quote draft:", draftError);
        }
      }
      return res.json(result);
    } catch (error) {
      console.error("Edit quote error:", error);
      return res.status(500).json({ error: "Failed to edit quote" });
    }
  });

  app.patch("/api/admin/customers/:id/disposition", requireAdmin, async (req, res) => {
    try {
      const { dispositionStatus, dispositionNotes, followUpDate } = req.body;
      const validStatuses = ["too_expensive", "not_ready", "competitor", "no_response", "changed_mind", "booked_elsewhere", "wrong_number", "other", null];
      if (dispositionStatus !== undefined && !validStatuses.includes(dispositionStatus)) {
        return res.status(400).json({ error: "Invalid disposition status" });
      }
      const result = await storage.updateDisposition(req.params.id as string, {
        dispositionStatus: dispositionStatus ?? null,
        dispositionNotes: dispositionNotes ?? null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      });
      return res.json(result);
    } catch (error) {
      console.error("Update disposition error:", error);
      return res.status(500).json({ error: "Failed to update disposition" });
    }
  });

  app.get("/api/admin/campaigns", requireAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      return res.json(campaigns);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  const campaignSchema = z.object({
    subject: z.string().min(1),
    htmlBody: z.string().min(1),
    targetStatus: z.string().min(1),
    includeTags: z.array(z.string()).optional(),
    excludeTags: z.array(z.string()).optional(),
    scheduledAt: z.string().nullable().optional(),
  });

  app.post("/api/admin/campaigns", requireAdmin, async (req, res) => {
    try {
      const parsed = campaignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid campaign data" });
      }

      const { subject, htmlBody, targetStatus, includeTags, excludeTags, scheduledAt } = parsed.data;
      const campaign = await storage.createEmailCampaign({
        subject,
        htmlBody,
        targetStatus,
        includeTags: includeTags || [],
        excludeTags: excludeTags || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      });

      if (!scheduledAt) {
        const sentCount = await sendCampaignNow(campaign.id, subject, htmlBody, targetStatus, req, includeTags || [], excludeTags || []);
        return res.json({ ...campaign, sentCount, sentAt: new Date() });
      }

      return res.json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      return res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.get("/api/admin/email-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getEmailLogs();
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch email logs" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getQuoteSubmissions();
      const quoted = all.filter(q => q.status === "quoted").length;
      const depositPaid = all.filter(q => q.status === "deposit_paid").length;
      const completed = all.filter(q => q.status === "completed").length;
      const unsubscribed = all.filter(q => q.unsubscribed).length;
      const leads = all.filter(q => q.status === "lead").length;
      const quotedTotal = all.filter(q => q.status === "quoted").reduce((sum, q) => sum + (q.grandTotal || 0), 0);
      const depositPaidTotal = all.filter(q => q.status === "deposit_paid").reduce((sum, q) => sum + (q.depositDue || 0), 0);
      const completedTotal = all.filter(q => q.status === "completed").reduce((sum, q) => sum + (q.grandTotal || 0), 0);
      const needsFollowUp = all.filter(q => !q.dispositionStatus && !q.whatsappFollowedUp && (q.status === "quoted" || q.status === "lead")).length;
      const overdueFollowUps = all.filter(q => q.followUpDate && new Date(q.followUpDate) <= new Date() && !["too_expensive","competitor","changed_mind","booked_elsewhere","wrong_number"].includes(q.dispositionStatus || "")).length;
      const dispositionCounts: Record<string, number> = {};
      for (const q of all) {
        if (q.dispositionStatus) {
          dispositionCounts[q.dispositionStatus] = (dispositionCounts[q.dispositionStatus] || 0) + 1;
        }
      }
      return res.json({ total: all.length, leads, quoted, depositPaid, completed, unsubscribed, quotedTotal, depositPaidTotal, completedTotal, needsFollowUp, overdueFollowUps, dispositionCounts });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/admin/customers/:id/send-review-request", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getQuoteSubmissions();
      const customer = all.find(q => q.id === req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(customer.email)}`;
      const facebookUrl = process.env.FACEBOOK_REVIEW_URL || "https://www.facebook.com/doorsondemand/reviews";

      const reviewTemplate = await storage.getEmailTemplate('review_request');

      const email = generateReviewRequestEmail({
        customerName: `${customer.firstName} ${customer.lastName}`,
        facebookReviewUrl: facebookUrl,
      }, unsubscribeUrl, reviewTemplate ? { subject: reviewTemplate.subject, body: reviewTemplate.body } : undefined);

      await sendEmail(customer.email, email.subject, email.html);
      await storage.createEmailLog({
        quoteId: customer.id,
        recipientEmail: customer.email,
        recipientName: `${customer.firstName} ${customer.lastName}`,
        emailType: "review_request",
        subject: email.subject,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Send review request error:", error);
      return res.status(500).json({ error: "Failed to send review request" });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    return res.json({
      facebookReviewUrl: process.env.FACEBOOK_REVIEW_URL || "",
      businessEmail: process.env.BUSINESS_EMAIL || "",
      whatsappNumber: process.env.WHATSAPP_NUMBER || "",
    });
  });

  app.get("/api/admin/email-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      return res.json(templates);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  const templateUpdateSchema = z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
  });

  app.put("/api/admin/email-templates/:key", requireAdmin, async (req, res) => {
    try {
      const parsed = templateUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid template data" });
      }

      const key = req.params.key as string;
      const defaultTmpl = DEFAULT_TEMPLATES.find(t => t.templateKey === key);
      if (!defaultTmpl) {
        return res.status(404).json({ error: "Template not found" });
      }

      const template = await storage.upsertEmailTemplate(key, {
        name: defaultTmpl.name,
        subject: parsed.data.subject,
        body: parsed.data.body,
        availableVariables: defaultTmpl.availableVariables,
      });

      return res.json(template);
    } catch (error) {
      console.error("Update template error:", error);
      return res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.post("/api/admin/email-templates/preview", requireAdmin, async (req, res) => {
    try {
      const parsed = templateUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid preview data" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const sampleData: Record<string, string> = {
        firstName: "John",
        lastName: "Smith",
        doorStyle: "Mexicano",
        totalDoors: "5",
        grandTotal: "\u00a31,850",
        deposit: "\u00a3925",
        balanceAmount: "\u00a3925",
        depositPaid: "\u00a3925",
        balanceDue: "\u00a3925",
        fittingDate: "Monday 16 Feb",
        resumeUrl: "https://example.com/resume/abc123",
        galleryUrl: `${baseUrl}/gallery`,
        paymentLink: "https://example.com/pay",
        reviewLink: "https://example.com/review",
        googleReviewUrl: process.env.GOOGLE_REVIEWS_URL || "https://g.page/r/review",
      };

      let subject = parsed.data.subject;
      let body = parsed.data.body;
      for (const [key, value] of Object.entries(sampleData)) {
        subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }

      const html = EMAIL_WRAPPER(body);

      return res.json({ subject, html });
    } catch (error) {
      return res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  app.post("/api/admin/customers/:id/send-template", requireAdmin, async (req, res) => {
    try {
      const { templateKey } = req.body;
      if (!templateKey) {
        return res.status(400).json({ error: "Template key required" });
      }

      const customer = await storage.getQuoteSubmissionById(req.params.id as string);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const template = await storage.getEmailTemplate(templateKey);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      const doorLabel = (() => {
        const s = DOOR_STYLES[customer.doorStyle as keyof typeof DOOR_STYLES];
        return s?.name || customer.doorStyle;
      })();

      const variables: Record<string, string> = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        doorStyle: doorLabel,
        totalDoors: String(customer.totalDoors),
        grandTotal: `\u00a3${customer.grandTotal.toLocaleString()}`,
        deposit: `\u00a3${customer.depositDue.toLocaleString()}`,
        depositPaid: `\u00a3${customer.depositDue.toLocaleString()}`,
        balanceDue: `\u00a3${(customer.grandTotal - customer.depositDue).toLocaleString()}`,
        balanceAmount: `\u00a3${(customer.grandTotal - customer.depositDue).toLocaleString()}`,
        fittingDate: customer.preferredTiming || "TBC",
        resumeUrl: "",
        paymentLink: "",
        reviewLink: process.env.FACEBOOK_REVIEW_URL || "https://www.facebook.com/doorsondemand/reviews",
        googleReviewUrl: process.env.GOOGLE_REVIEWS_URL || "https://g.page/r/review",
      };

      let subject = template.subject;
      let body = template.body;
      for (const [key, value] of Object.entries(variables)) {
        subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }

      const html = EMAIL_WRAPPER(body);
      await sendEmail(customer.email, subject, html);

      await storage.createEmailLog({
        quoteId: customer.id,
        recipientEmail: customer.email,
        recipientName: `${customer.firstName} ${customer.lastName}`,
        emailType: templateKey,
        subject,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Send template error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.patch("/api/admin/customers/:id/unsubscribe", requireAdmin, async (req, res) => {
    try {
      const customer = await storage.getQuoteSubmissionById(req.params.id as string);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const { unsubscribed } = req.body;
      await storage.setUnsubscribed(customer.email, !!unsubscribed);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  app.patch("/api/admin/customers/:id/discount", requireAdmin, async (req, res) => {
    try {
      const { discountPercent } = req.body;
      const percent = parseFloat(discountPercent);
      if (isNaN(percent) || percent < 0 || percent > 50) {
        return res.status(400).json({ error: "Discount must be between 0 and 50%" });
      }

      const original = await storage.getQuoteSubmissionById(req.params.id as string);
      if (!original) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const updated = await storage.applyDiscount(req.params.id as string, percent);
      if (!updated) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const previousPercent = original.discountPercent || 0;
      if (percent > 0 && percent !== previousPercent) {
        const originalTotal = original.originalGrandTotal ?? original.grandTotal;
        const doorLabel = DOOR_STYLES[updated.doorStyle as keyof typeof DOOR_STYLES]?.name || updated.doorStyle;

        let resumeUrl: string | undefined;
        if (updated.resumeToken) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          resumeUrl = `${baseUrl}/resume/${updated.resumeToken}`;
        }

        const discountTemplate = await storage.getEmailTemplate('discount_notification');
        const email = generateDiscountEmail({
          firstName: updated.firstName,
          doorStyle: doorLabel,
          totalDoors: updated.totalDoors,
          originalTotal,
          discountPercent: percent,
          newTotal: updated.grandTotal,
          newDeposit: updated.depositDue,
          resumeUrl,
        }, discountTemplate ? { subject: discountTemplate.subject, body: discountTemplate.body } : undefined);

        const sent = await sendEmail(updated.email, email.subject, email.html);
        if (sent) {
          await storage.createEmailLog({
            quoteId: updated.id,
            recipientEmail: updated.email,
            recipientName: `${updated.firstName} ${updated.lastName}`,
            emailType: "discount_notification",
            subject: email.subject,
          });
        }
      }

      return res.json({ success: true, grandTotal: updated.grandTotal, depositDue: updated.depositDue });
    } catch (error) {
      console.error("Apply discount error:", error);
      return res.status(500).json({ error: "Failed to apply discount" });
    }
  });

  app.post("/api/admin/customers/:id/tags", requireAdmin, async (req, res) => {
    try {
      const { tag } = req.body;
      if (!tag || typeof tag !== "string") {
        return res.status(400).json({ error: "Tag is required" });
      }
      const result = await storage.addTagToQuote(req.params.id as string, tag.toLowerCase().trim());
      if (!result) {
        return res.status(404).json({ error: "Customer not found" });
      }
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: "Failed to add tag" });
    }
  });

  app.delete("/api/admin/customers/:id/tags/:tag", requireAdmin, async (req, res) => {
    try {
      const result = await storage.removeTagFromQuote(req.params.id as string, req.params.tag as string);
      if (!result) {
        return res.status(404).json({ error: "Customer not found" });
      }
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: "Failed to remove tag" });
    }
  });

  app.get("/api/admin/tags", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getQuoteSubmissions();
      const tagSet = new Set<string>();
      for (const q of all) {
        for (const t of (q.tags || [])) {
          tagSet.add(t);
        }
      }
      return res.json(Array.from(tagSet).sort());
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.patch("/api/admin/customers/:id/whatsapp-followed-up", requireAdmin, async (req, res) => {
    try {
      const customer = await storage.getQuoteSubmissionById(req.params.id as string);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const { whatsappFollowedUp } = req.body;
      await storage.toggleWhatsappFollowedUp(req.params.id as string, !!whatsappFollowedUp);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update WhatsApp follow-up status" });
    }
  });

  app.delete("/api/admin/customers/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteQuoteSubmission(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  app.get("/api/gallery", async (_req, res) => {
    try {
      const items = await storage.getGalleryItems();
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch gallery items" });
    }
  });

  app.post("/api/admin/gallery", requireAdmin, async (req, res) => {
    try {
      const { caption, location, beforeImagePath, afterImagePath, mediaType, sortOrder } = req.body;
      if (!caption || !beforeImagePath || !afterImagePath) {
        return res.status(400).json({ error: "Caption, before media, and after media are required" });
      }
      const item = await storage.createGalleryItem({
        caption,
        location: location || null,
        beforeImagePath,
        afterImagePath,
        mediaType: mediaType || "image",
        sortOrder: sortOrder || 0,
      });
      return res.json(item);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create gallery item" });
    }
  });

  app.delete("/api/admin/gallery/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteGalleryItem(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Gallery item not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete gallery item" });
    }
  });

  app.get("/api/testimonials", async (_req, res) => {
    try {
      const items = await storage.getTestimonials(true);
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.get("/api/admin/testimonials", requireAdmin, async (_req, res) => {
    try {
      const items = await storage.getTestimonials(false);
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/admin/testimonials", requireAdmin, async (req, res) => {
    try {
      const { customerName, text, starRating, location, jobDate, isVisible, sortOrder } = req.body;
      if (!customerName || !text) {
        return res.status(400).json({ error: "Customer name and text are required" });
      }
      const rating = parseInt(starRating) || 5;
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Star rating must be between 1 and 5" });
      }
      const item = await storage.createTestimonial({
        customerName,
        text,
        starRating: rating,
        location: location || null,
        jobDate: jobDate || null,
        isVisible: isVisible !== false,
        sortOrder: parseInt(sortOrder) || 0,
      });
      return res.json(item);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create testimonial" });
    }
  });

  app.patch("/api/admin/testimonials/:id", requireAdmin, async (req, res) => {
    try {
      const { customerName, text, starRating, location, jobDate, isVisible, sortOrder } = req.body;
      const updateData: Record<string, unknown> = {};
      if (customerName !== undefined) updateData.customerName = customerName;
      if (text !== undefined) updateData.text = text;
      if (starRating !== undefined) {
        const rating = parseInt(starRating);
        if (rating < 1 || rating > 5) return res.status(400).json({ error: "Star rating must be between 1 and 5" });
        updateData.starRating = rating;
      }
      if (location !== undefined) updateData.location = location || null;
      if (jobDate !== undefined) updateData.jobDate = jobDate || null;
      if (isVisible !== undefined) updateData.isVisible = isVisible;
      if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder) || 0;
      const updated = await storage.updateTestimonial(req.params.id, updateData as any);
      if (!updated) return res.status(404).json({ error: "Testimonial not found" });
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update testimonial" });
    }
  });

  app.delete("/api/admin/testimonials/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTestimonial(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Testimonial not found" });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete testimonial" });
    }
  });

  app.post("/api/admin/create-custom-payment-link", requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        customerId: z.string().min(1),
        amountPence: z.number().int().positive(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      }
      const { customerId, amountPence } = parsed.data;

      const customer = await storage.getQuoteSubmissionById(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const stripe = await getUncachableStripeClient();
      const product = await stripe.products.create({
        name: "Deposit top-up – Doors On Demand",
        description: `Top-up payment for ${customer.firstName} ${customer.lastName}`,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amountPence,
        currency: "gbp",
      });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        after_completion: {
          type: "redirect",
          redirect: { url: `${baseUrl}/balance-paid` },
        },
      });

      return res.json({ url: paymentLink.url });
    } catch (error) {
      console.error("Create custom payment link error:", error);
      return res.status(500).json({ error: "Failed to create payment link" });
    }
  });

  app.get("/api/admin/calendar", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getQuoteSubmissions();
      const events = all
        .filter(c => (c.pipelineStage === "booked" || c.pipelineStage === "completed") && c.preferredTiming)
        .map(c => {
          const timing = c.preferredTiming!.trim();
          let start: string | null = null;
          let end: string | null = null;

          // Use depositPaidAt or completedAt as reference to determine correct year for historical records
          const referenceDate = c.completedAt || c.depositPaidAt || undefined;
          const parsedStart = parseCalendarDisplayDate(timing, referenceDate);
          if (parsedStart) {
            start = parsedStart.toISOString().split('T')[0];
            const parsedEnd = parseCalendarEndDisplayDate(timing, referenceDate);
            if (parsedEnd) {
              const exclusiveEnd = new Date(parsedEnd);
              exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
              end = exclusiveEnd.toISOString().split('T')[0];
            } else {
              const days = c.estimatedDays || 1;
              const endDate = new Date(parsedStart);
              endDate.setDate(endDate.getDate() + days);
              end = endDate.toISOString().split('T')[0];
            }
          } else {
            const isoMatch = timing.match(/(\d{4}-\d{2}-\d{2})/);
            if (isoMatch) {
              const d = new Date(isoMatch[1]);
              if (!isNaN(d.getTime())) {
                start = isoMatch[1];
                const days = c.estimatedDays || 1;
                const endDate = new Date(d);
                endDate.setDate(endDate.getDate() + days);
                end = endDate.toISOString().split('T')[0];
              }
            }
          }

          return {
            id: c.id,
            title: `${c.firstName} ${c.lastName}`,
            start,
            end,
            rawTiming: c.preferredTiming,
            customerId: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            address: [c.addressLine1, c.addressLine2, c.city].filter(Boolean).join(', ') || c.postcode,
            totalDoors: c.totalDoors,
            estimatedDays: c.estimatedDays,
            grandTotal: c.grandTotal,
            doorStyle: c.doorStyle,
            pipelineStage: c.pipelineStage,
            mobile: c.mobile,
          };
        })
        .filter(e => e.start !== null);
      return res.json(events);
    } catch (error) {
      console.error("Calendar endpoint error:", error);
      return res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  seedDefaultTemplates();
  seedDefaultGalleryItems();
}

async function sendCampaignNow(campaignId: string, subject: string, htmlBody: string, targetStatus: string, req: Request, includeTags: string[] = [], excludeTags: string[] = []): Promise<number> {
  let recipients;
  if (targetStatus === "all") {
    recipients = await storage.getQuoteSubmissions();
  } else {
    recipients = await storage.getQuoteSubmissionsByStatus(targetStatus);
  }

  recipients = recipients.filter(r => !r.unsubscribed);

  if (includeTags.length > 0) {
    recipients = recipients.filter(r => {
      const tags = r.tags || [];
      return includeTags.some(t => tags.includes(t));
    });
  }
  if (excludeTags.length > 0) {
    recipients = recipients.filter(r => {
      const tags = r.tags || [];
      return !excludeTags.some(t => tags.includes(t));
    });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const seen = new Set<string>();
  let sentCount = 0;

  for (const recipient of recipients) {
    if (seen.has(recipient.email)) continue;
    seen.add(recipient.email);

    const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
    const personalizedBody = htmlBody
      .replace(/\{\{firstName\}\}/g, recipient.firstName)
      .replace(/\{\{lastName\}\}/g, recipient.lastName)
      .replace(/\{\{name\}\}/g, `${recipient.firstName} ${recipient.lastName}`)
      + `<div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;"><a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:12px;">Unsubscribe from future emails</a></div>`;

    try {
      await sendEmail(recipient.email, subject, personalizedBody);
      await storage.createEmailLog({
        campaignId,
        quoteId: recipient.id,
        recipientEmail: recipient.email,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        emailType: "campaign",
        subject,
      });
      sentCount++;
    } catch (err) {
      console.error(`Failed to send campaign email to ${recipient.email}:`, err);
    }
  }

  await storage.markCampaignSent(campaignId, sentCount);
  return sentCount;
}

export { sendCampaignNow, DEFAULT_TEMPLATES };
