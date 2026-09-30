import type { QuoteSubmission } from "@shared/schema";
import { DOOR_STYLES } from "@shared/schema";

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

const TEMPLATE_EMAIL_WRAPPER = (content: string) => `
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
</div>
</div>
</body>
</html>`;

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDoorStyleLabel(style: string): string {
  const styleConfig = DOOR_STYLES[style as keyof typeof DOOR_STYLES];
  return styleConfig?.name || style;
}

function getDoorFinishLabel(finish: string): string {
  return finish === "prefinished" ? "Pre-finished" : "Unfinished";
}

function getFullDoorLabel(style: string, finish: string): string {
  return `${getDoorStyleLabel(style)} (${getDoorFinishLabel(finish)})`;
}

function getHandleFinishLabel(finish: string): string {
  switch (finish) {
    case "satin-nickel": return "Satin Nickel";
    case "matt-black": return "Matt Black";
    case "polished-brass": return "Polished Brass";
    default: return finish;
  }
}

function getHandleModelLabel(model: string): string {
  return model.charAt(0).toUpperCase() + model.slice(1);
}

function getGlazedStyleLabel(doorStyle: string, glazedStyleId: string | null): string {
  if (!glazedStyleId) return "";
  
  const labels: Record<string, Record<string, string>> = {
    mexicano: {
      "2xg": "2XG",
      "frosted": "Frosted",
      "6l": "6L",
      "pattern10": "Pattern 10",
    },
    iseo: {
      "clear": "Clear",
      "frosted": "Frosted",
      "pattern10-clear": "Pattern 10 Clear",
      "pattern10-frosted": "Pattern 10 Frosted",
    },
    aston: {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    "7-panel": {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    dx30: {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    "4-panel-shaker": {
      "clear": "Clear",
      "frosted": "Frosted",
    },
    "rustic-edwardian": {
      "clear": "Clear",
    },
  };
  
  return labels[doorStyle]?.[glazedStyleId] || glazedStyleId;
}

export function generateCustomerQuoteEmail(quote: QuoteSubmission): { subject: string; html: string } {
  const standardDoors = quote.totalDoors - quote.fireDoors;
  
  const subject = `Your Door Quote - ${formatCurrency(quote.grandTotal)} | Doors On Demand`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Door Quote</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1F5EFF; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Doors On Demand</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Instant Door Quote</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0; font-size: 16px; color: #333;">Hi ${escapeHtml(quote.firstName)},</p>
              <p style="margin: 16px 0 0; font-size: 14px; color: #666; line-height: 1.6;">Thank you for your quote request. Here's a summary of your door configuration and pricing:</p>
            </td>
          </tr>
          
          <!-- Quote Details -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Door Style</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${getFullDoorLabel(quote.doorStyle, quote.doorFinish)}</span>
                        </td>
                      </tr>
                      ${standardDoors > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">${standardDoors} Standard Door${standardDoors !== 1 ? 's' : ''}</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">Supplied & Fitted</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${quote.fireDoors > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">${quote.fireDoors} Fire Door${quote.fireDoors !== 1 ? 's' : ''}</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">Supplied & Fitted</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${quote.glazedDoors > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Glazed Upgrade (${quote.glazedDoors} door${quote.glazedDoors !== 1 ? 's' : ''}${quote.glazedStyle ? ` - ${getGlazedStyleLabel(quote.doorStyle, quote.glazedStyle)}` : ''})</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">Included</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${quote.bathroomLocks > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Bathroom Lock${quote.bathroomLocks !== 1 ? 's' : ''} (${quote.bathroomLocks})</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">Included</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Handles</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${getHandleModelLabel(quote.handleModel)} - ${getHandleFinishLabel(quote.handleFinish)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Pricing -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1F5EFF; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="color: rgba(255,255,255,0.9); font-size: 14px;">Grand Total</span>
                        </td>
                        <td style="text-align: right;">
                          <span style="color: #ffffff; font-size: 28px; font-weight: 700;">${formatCurrency(quote.grandTotal)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px;">
                          <span style="color: rgba(255,255,255,0.8); font-size: 13px;">Deposit (50%)</span>
                        </td>
                        <td style="padding-top: 12px; text-align: right;">
                          <span style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">${formatCurrency(quote.depositDue)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Timeline -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f8f9fa; border-radius: 6px;">
                    <span style="color: #666; font-size: 13px;">Lead time: 2–3 weeks | Estimated fitting: ${quote.estimatedDays} day${quote.estimatedDays !== 1 ? 's' : ''}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                ${quote.intent === 'proceed' 
                  ? "We'll message you on WhatsApp to confirm the final details (sizes, handing, fire requirements) and send your deposit link."
                  : "We'll reply to your question via WhatsApp as soon as possible."}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 13px; color: #666;">We prefer WhatsApp for quicker responses</p>
              <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || '447854015863'}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Chat on WhatsApp</a>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  return { subject, html };
}

export function generateBusinessNotificationEmail(quote: QuoteSubmission): { subject: string; html: string } {
  const standardDoors = quote.totalDoors - quote.fireDoors;
  const intentLabel = quote.intent === 'proceed' ? 'Ready to Proceed' : 'Has a Question';
  
  const subject = `New Quote Submission - ${quote.firstName} (${formatCurrency(quote.grandTotal)}) - ${intentLabel}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: ${quote.intent === 'proceed' ? '#22c55e' : '#f59e0b'}; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">New Quote Submission</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${intentLabel}</p>
            </td>
          </tr>
          
          <!-- Customer Details -->
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">Customer Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0;"><strong style="color: #333;">Name:</strong> <span style="color: #666;">${escapeHtml(quote.firstName)} ${escapeHtml(quote.lastName)}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;"><strong style="color: #333;">Email:</strong> <a href="mailto:${escapeHtml(quote.email)}" style="color: #1F5EFF;">${escapeHtml(quote.email)}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;"><strong style="color: #333;">Mobile:</strong> <a href="tel:${escapeHtml(quote.mobile)}" style="color: #1F5EFF;">${escapeHtml(quote.mobile)}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;"><strong style="color: #333;">Postcode:</strong> <span style="color: #666;">${escapeHtml(quote.postcode)} (${quote.distanceMiles} miles)</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Quote Configuration -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">Quote Configuration</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0;"><strong style="color: #333;">Door Style:</strong> <span style="color: #666;">${getFullDoorLabel(quote.doorStyle, quote.doorFinish)}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;"><strong style="color: #333;">Total Doors:</strong> <span style="color: #666;">${quote.totalDoors}</span></td>
                      </tr>
                      ${standardDoors > 0 ? `<tr><td style="padding: 6px 0;"><strong style="color: #333;">Standard Doors:</strong> <span style="color: #666;">${standardDoors}</span></td></tr>` : ''}
                      ${quote.fireDoors > 0 ? `<tr><td style="padding: 6px 0;"><strong style="color: #333;">Fire Doors:</strong> <span style="color: #666;">${quote.fireDoors}</span></td></tr>` : ''}
                      ${quote.glazedDoors > 0 ? `<tr><td style="padding: 6px 0;"><strong style="color: #333;">Glazed Doors:</strong> <span style="color: #666;">${quote.glazedDoors}${quote.glazedStyle ? ` (${getGlazedStyleLabel(quote.doorStyle, quote.glazedStyle)})` : ''}</span></td></tr>` : ''}
                      ${quote.bathroomLocks > 0 ? `<tr><td style="padding: 6px 0;"><strong style="color: #333;">Bathroom Locks:</strong> <span style="color: #666;">${quote.bathroomLocks}</span></td></tr>` : ''}
                      <tr>
                        <td style="padding: 6px 0;"><strong style="color: #333;">Handles:</strong> <span style="color: #666;">${getHandleModelLabel(quote.handleModel)} - ${getHandleFinishLabel(quote.handleFinish)}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Pricing -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1F5EFF; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td><span style="color: rgba(255,255,255,0.9); font-size: 14px;">Grand Total</span></td>
                        <td style="text-align: right;"><span style="color: #ffffff; font-size: 24px; font-weight: 700;">${formatCurrency(quote.grandTotal)}</span></td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;"><span style="color: rgba(255,255,255,0.8); font-size: 13px;">Deposit (50%)</span></td>
                        <td style="padding-top: 8px; text-align: right;"><span style="color: rgba(255,255,255,0.9); font-size: 16px;">${formatCurrency(quote.depositDue)}</span></td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;"><span style="color: rgba(255,255,255,0.8); font-size: 13px;">Estimated Fitting</span></td>
                        <td style="padding-top: 8px; text-align: right;"><span style="color: rgba(255,255,255,0.9); font-size: 14px;">${quote.estimatedDays} day${quote.estimatedDays !== 1 ? 's' : ''}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Intent & Notes -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">Customer Intent</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    ${quote.intent === 'proceed' ? `
                    <p style="margin: 0 0 8px;"><strong style="color: #333;">Timing Preference:</strong> <span style="color: #666;">${quote.preferredTiming || 'Not specified'}</span></p>
                    ` : `
                    <p style="margin: 0 0 8px;"><strong style="color: #333;">Question:</strong></p>
                    <p style="margin: 0; padding: 12px; background-color: #fff; border-radius: 4px; color: #333; font-style: italic;">"${escapeHtml(quote.question || 'No question provided')}"</p>
                    `}
                    ${quote.notes ? `
                    <p style="margin: 16px 0 0;"><strong style="color: #333;">Additional Notes:</strong></p>
                    <p style="margin: 4px 0 0; color: #666;">${escapeHtml(quote.notes)}</p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Timestamp -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999;">Submitted: ${new Date(quote.timestamp).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  return { subject, html };
}

interface DepositNotificationData {
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerAddress: string;
  customerPostcode: string;
  doorStyle: string;
  totalDoors: string;
  doorSizes: string;
  fittingDate: string;
  grandTotal: string;
  depositPaid: string;
  balanceDue: string;
}

export function generateDepositNotificationEmail(data: DepositNotificationData): { subject: string; html: string } {
  const subject = `Deposit Paid - ${escapeHtml(data.customerName)} (${data.totalDoors} doors, \u00A3${data.grandTotal}) - ${escapeHtml(data.fittingDate)}`;

  const doorSizesRows = data.doorSizes
    ? data.doorSizes.split(',').map(s => s.trim()).filter(Boolean).map(size =>
        `<tr><td style="padding: 4px 0; color: #666; font-size: 14px;">${escapeHtml(size)}</td></tr>`
      ).join('')
    : '<tr><td style="padding: 4px 0; color: #999; font-size: 14px;">Not specified</td></tr>';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deposit Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background-color: #22c55e; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Deposit Payment Received</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">New booking confirmed</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">Customer Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Name:</strong> <span style="color: #666;">${escapeHtml(data.customerName)}</span></td></tr>
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Email:</strong> <a href="mailto:${escapeHtml(data.customerEmail)}" style="color: #1F5EFF;">${escapeHtml(data.customerEmail)}</a></td></tr>
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Mobile:</strong> <a href="tel:${escapeHtml(data.customerMobile)}" style="color: #1F5EFF;">${escapeHtml(data.customerMobile)}</a></td></tr>
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Address:</strong> <span style="color: #666;">${escapeHtml(data.customerAddress)}</span></td></tr>
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Postcode:</strong> <span style="color: #666;">${escapeHtml(data.customerPostcode)}</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 24px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Door Style:</strong> <span style="color: #666;">${escapeHtml(data.doorStyle)}</span></td></tr>
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Total Doors:</strong> <span style="color: #666;">${escapeHtml(data.totalDoors)}</span></td></tr>
                      <tr><td style="padding: 6px 0;"><strong style="color: #333;">Fitting Date:</strong> <span style="color: #666;">${escapeHtml(data.fittingDate)}</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 24px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">Door Sizes</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${doorSizesRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1F5EFF; border-radius: 6px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td><span style="color: rgba(255,255,255,0.9); font-size: 14px;">Quote Total</span></td>
                        <td style="text-align: right;"><span style="color: #ffffff; font-size: 24px; font-weight: 700;">\u00A3${escapeHtml(data.grandTotal)}</span></td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;"><span style="color: rgba(255,255,255,0.8); font-size: 13px;">Deposit Paid</span></td>
                        <td style="padding-top: 8px; text-align: right;"><span style="color: rgba(255,255,255,0.9); font-size: 16px;">\u00A3${escapeHtml(data.depositPaid)}</span></td>
                      </tr>
                      <tr>
                        <td style="padding-top: 8px;"><span style="color: rgba(255,255,255,0.8); font-size: 13px;">Balance Due</span></td>
                        <td style="padding-top: 8px; text-align: right;"><span style="color: rgba(255,255,255,0.9); font-size: 16px;">\u00A3${escapeHtml(data.balanceDue)}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999;">Payment received: ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

interface PaymentConfirmationData {
  customerName: string;
  customerEmail: string;
  fittingDate: string;
  totalDoors: string;
  doorStyle: string;
  grandTotal: string;
  depositPaid: string;
  balanceDue: string;
}

export function generatePaymentConfirmationEmail(data: PaymentConfirmationData, customTemplate?: { subject: string; body: string }): { subject: string; html: string } {
  if (customTemplate) {
    const variables: Record<string, string> = {
      firstName: data.customerName.split(' ')[0],
      fittingDate: data.fittingDate,
      totalDoors: data.totalDoors,
      doorStyle: data.doorStyle,
      depositPaid: `\u00A3${data.depositPaid}`,
      balanceDue: `\u00A3${data.balanceDue}`,
    };
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return { subject, html: TEMPLATE_EMAIL_WRAPPER(body) };
  }

  const subject = `Booking Confirmed - ${escapeHtml(data.fittingDate)} | Doors On Demand`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #22c55e; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Booking Confirmed</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your deposit has been received</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0; font-size: 16px; color: #333;">Hi ${escapeHtml(data.customerName.split(' ')[0])},</p>
              <p style="margin: 16px 0 0; font-size: 14px; color: #666; line-height: 1.6;">Thanks for booking with Doors On Demand. Your deposit has been received and your fitting date is confirmed.</p>
            </td>
          </tr>
          
          <!-- Booking Details -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Fitting Date</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 600;">${escapeHtml(data.fittingDate)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Total Doors</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${escapeHtml(data.totalDoors)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666; font-size: 14px;">Door Style</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${escapeHtml(data.doorStyle)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Payment Summary -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1F5EFF; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="color: rgba(255,255,255,0.9); font-size: 14px;">Deposit Paid</span>
                        </td>
                        <td style="text-align: right;">
                          <span style="color: #ffffff; font-size: 24px; font-weight: 700;">&pound;${escapeHtml(data.depositPaid)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px;">
                          <span style="color: rgba(255,255,255,0.8); font-size: 13px;">Balance Due on Completion</span>
                        </td>
                        <td style="padding-top: 12px; text-align: right;">
                          <span style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">&pound;${escapeHtml(data.balanceDue)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- What Happens Next -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">What happens next?</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #22c55e; font-size: 16px; vertical-align: middle;">&#10003;</span>
                    <span style="color: #666; font-size: 14px; margin-left: 8px;">Mark will be in touch via email or WhatsApp to confirm everything</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #22c55e; font-size: 16px; vertical-align: middle;">&#10003;</span>
                    <span style="color: #666; font-size: 14px; margin-left: 8px;">Mark will arrive on your fitting date</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #22c55e; font-size: 16px; vertical-align: middle;">&#10003;</span>
                    <span style="color: #666; font-size: 14px; margin-left: 8px;">Pay the remaining balance on completion</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 13px; color: #666;">Any questions? Message Mark on WhatsApp</p>
              <a href="https://wa.me/${process.env.WHATSAPP_NUMBER || '447854015863'}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Chat on WhatsApp</a>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

const FACEBOOK_REVIEWS_URL = "https://www.facebook.com/doorsondemand10/reviews";

interface QuotePreviewData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  postcode: string;
  doorStyle: string;
  doorFinish: string;
  totalDoors: number;
  fireDoors: number;
  glazedDoors: number;
  glazedStyle: string | null;
  bathroomLocks: number;
  handleModel: string;
  handleFinish: string;
  grandTotal: number;
  deposit: number;
}

export function generateQuotePreviewEmail(data: QuotePreviewData): { subject: string; html: string } {
  const subject = `New Quote Viewed - ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)} (${formatCurrency(data.grandTotal)})`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Viewed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #3b82f6; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Quote Viewed</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Someone is viewing their quote</p>
            </td>
          </tr>
          
          <!-- Customer Info -->
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333;">Customer Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>
                    <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
                    <p style="margin: 0 0 8px;"><strong>Mobile:</strong> ${escapeHtml(data.mobile)}</p>
                    <p style="margin: 0;"><strong>Postcode:</strong> ${escapeHtml(data.postcode)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quote Summary -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333;">Quote Summary</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px;"><strong>Door:</strong> ${getFullDoorLabel(data.doorStyle, data.doorFinish)}</p>
                    <p style="margin: 0 0 8px;"><strong>Total Doors:</strong> ${data.totalDoors}</p>
                    ${data.fireDoors > 0 ? `<p style="margin: 0 0 8px;"><strong>Fire Doors:</strong> ${data.fireDoors}</p>` : ''}
                    ${data.glazedDoors > 0 ? `<p style="margin: 0 0 8px;"><strong>Glazed Doors:</strong> ${data.glazedDoors}${data.glazedStyle ? ` (${getGlazedStyleLabel(data.doorStyle, data.glazedStyle)})` : ''}</p>` : ''}
                    ${data.bathroomLocks > 0 ? `<p style="margin: 0 0 8px;"><strong>Bathroom Locks:</strong> ${data.bathroomLocks}</p>` : ''}
                    <p style="margin: 0;"><strong>Handles:</strong> ${getHandleModelLabel(data.handleModel)} (${getHandleFinishLabel(data.handleFinish)})</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1F5EFF; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Quote Total</p>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 28px; font-weight: 700;">${formatCurrency(data.grandTotal)}</p>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">Deposit: ${formatCurrency(data.deposit)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <p style="margin: 0; font-size: 13px; color: #666; text-align: center;">
                This customer is viewing their quote. They haven't submitted yet - you may receive another email if they proceed.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999;">Viewed: ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  return { subject, html };
}

export function generateCustomerQuotePreviewEmail(data: QuotePreviewData, resumeUrl?: string, customTemplate?: { subject: string; body: string }): { subject: string; html: string } {
  const standardDoors = data.totalDoors - data.fireDoors - data.glazedDoors;

  if (customTemplate) {
    const doorLabel = getDoorStyleLabel(data.doorStyle);
    const variables: Record<string, string> = {
      firstName: data.firstName,
      doorStyle: doorLabel,
      totalDoors: String(data.totalDoors),
      grandTotal: formatCurrency(data.grandTotal),
      deposit: formatCurrency(data.deposit),
      resumeUrl: resumeUrl || '',
    };
    const subject = replaceVariables(customTemplate.subject, variables);
    const body = replaceVariables(customTemplate.body, variables);
    return { subject, html: TEMPLATE_EMAIL_WRAPPER(body) };
  }

  const subject = `Your Door Quote - ${formatCurrency(data.grandTotal)} | Doors On Demand`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Door Quote</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0099b3; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Doors On Demand</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Instant Door Quote</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0; font-size: 16px; color: #333;">Hi ${escapeHtml(data.firstName)},</p>
              <p style="margin: 16px 0 0; font-size: 14px; color: #666; line-height: 1.6;">Thanks for getting a quote with Doors On Demand. Here's a summary of your door package:</p>
            </td>
          </tr>
          
          <!-- Quote Details -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Door Style</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${getFullDoorLabel(data.doorStyle, data.doorFinish)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Total Doors</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${data.totalDoors}</span>
                        </td>
                      </tr>
                      ${standardDoors > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Standard Doors</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${standardDoors}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.fireDoors > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Fire Doors</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${data.fireDoors}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.glazedDoors > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Glazed Doors${data.glazedStyle ? ` (${getGlazedStyleLabel(data.doorStyle, data.glazedStyle)})` : ''}</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${data.glazedDoors}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${data.bathroomLocks > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Bathroom Locks</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${data.bathroomLocks}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                          <span style="color: #666; font-size: 14px;">Handles</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                          <span style="color: #333; font-size: 14px; font-weight: 500;">${getHandleModelLabel(data.handleModel)} - ${getHandleFinishLabel(data.handleFinish)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #666; font-size: 14px;">Premium latches & hinges</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #16a34a; font-size: 14px; font-weight: 500;">Included</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Pricing -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0099b3; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="color: rgba(255,255,255,0.9); font-size: 14px;">Grand Total (supplied & fitted)</span>
                        </td>
                        <td style="text-align: right;">
                          <span style="color: #ffffff; font-size: 28px; font-weight: 700;">${formatCurrency(data.grandTotal)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px;">
                          <span style="color: rgba(255,255,255,0.8); font-size: 13px;">Deposit to secure booking (50%)</span>
                        </td>
                        <td style="padding-top: 12px; text-align: right;">
                          <span style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">${formatCurrency(data.deposit)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Included -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">What's included</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">&#10003; &nbsp;Premium oak doors supplied</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">&#10003; &nbsp;Professional fitting by Mark</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">&#10003; &nbsp;Premium latches & ball bearing hinges</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">&#10003; &nbsp;Handles fitted to every door</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Continue Quote CTA -->
          ${resumeUrl ? `
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 16px; color: #333; font-weight: 600;">Ready to go ahead?</h2>
              <p style="margin: 0 0 20px; font-size: 14px; color: #666; line-height: 1.6;">Tap the button below to pick up where you left off &mdash; choose your door sizes, pick a fitting date, and pay your deposit to lock it all in.</p>
              <a href="${resumeUrl}" style="display: inline-block; padding: 16px 40px; background-color: #0099b3; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">Continue &amp; Book Your Fitting</a>
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 0 32px 24px;">
              <h2 style="margin: 0 0 16px; font-size: 16px; color: #333; font-weight: 600;">Ready to go ahead?</h2>
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">Head back to your quote to choose your door sizes, pick a fitting date, and pay your 50% deposit to secure your booking.</p>
            </td>
          </tr>
          `}

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 13px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Just 3 quick steps to book</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #0099b3; font-weight: 600; font-size: 14px;">1.</span>
                          <span style="color: #333; font-size: 14px;"> Tell us the width of each door</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #0099b3; font-weight: 600; font-size: 14px;">2.</span>
                          <span style="color: #333; font-size: 14px;"> Pick your fitting date from our live calendar</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #0099b3; font-weight: 600; font-size: 14px;">3.</span>
                          <span style="color: #333; font-size: 14px;"> Pay your 50% deposit to lock in your date</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Got a Question -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                Got a question? No problem &mdash; message me directly on WhatsApp. I'm always happy to help.
              </p>
            </td>
          </tr>

          <!-- WhatsApp CTA -->
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <a href="https://wa.me/447854015863" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Chat with Mark on WhatsApp</a>
            </td>
          </tr>

          <!-- Social Proof - Facebook Reviews -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px; border: 1px solid #e0f2fe;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 15px; color: #333; font-weight: 600;">Don't just take my word for it</p>
                    <p style="margin: 0 0 16px; font-size: 13px; color: #666; line-height: 1.5;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
                    <a href="${FACEBOOK_REVIEWS_URL}" style="display: inline-block; padding: 10px 20px; background-color: #1877F2; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Read my Facebook Reviews</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #666;">Doors On Demand</p>
              <p style="margin: 0; font-size: 12px; color: #999;">Professional internal door supply & fitting</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
