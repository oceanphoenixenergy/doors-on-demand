import { storage } from "./storage";
import { sendEmail } from "./gmail";
import { generateFollowUpEmail1, generateFollowUpEmail2, generateFollowUpEmail3, generateFollowUpEmail4, generateReviewRequestEmail, generateAbandonedQuoteRecoveryEmail } from "./marketingEmails";

let schedulerRunning = false;

export function startEmailScheduler(getBaseUrl: () => string) {
  if (schedulerRunning) return;
  schedulerRunning = true;

  setInterval(async () => {
    await processFollowUps(getBaseUrl());
    await processAbandonmentEmails(getBaseUrl());
    await processScheduledCampaigns(getBaseUrl());
  }, 5 * 60 * 1000);

  setTimeout(async () => {
    await processFollowUps(getBaseUrl());
    await processAbandonmentEmails(getBaseUrl());
    await processScheduledCampaigns(getBaseUrl());
  }, 30 * 1000);

  console.log("Email scheduler started (checks every 5 minutes)");
}

async function ensureResumeUrl(quote: any, baseUrl: string): Promise<string> {
  if (quote.resumeToken) {
    return `${baseUrl}/resume/${quote.resumeToken}`;
  }
  const wizardState = {
    firstName: quote.firstName,
    lastName: quote.lastName,
    email: quote.email,
    mobile: quote.mobile,
    postcode: quote.postcode,
    addressLine1: quote.addressLine1 || "",
    addressLine2: quote.addressLine2 || "",
    city: quote.city || "",
    doorStyle: quote.doorStyle,
    doorFinish: quote.doorFinish || "",
    totalDoors: quote.totalDoors,
    standardDoors: (quote.totalDoors || 0) - (quote.fireDoors || 0) - (quote.glazedDoors || 0),
    fireDoors: quote.fireDoors || 0,
    glazedDoors: quote.glazedDoors || 0,
    glazedStyle: quote.glazedStyle || null,
    bathroomLocks: quote.bathroomLocks || 0,
    handleModel: quote.handleModel || "",
    handleFinish: quote.handleFinish || "",
    grandTotal: quote.grandTotal,
    deposit: quote.depositDue,
  };
  const draft = await storage.createQuoteDraft(wizardState);
  await storage.updateQuoteResumeToken(quote.id, draft.token);
  return `${baseUrl}/resume/${draft.token}`;
}

async function processFollowUps(baseUrl: string) {
  try {
    const followUp1Template = await storage.getEmailTemplate('follow_up_1');
    const followUp2Template = await storage.getEmailTemplate('follow_up_2');
    const followUp3Template = await storage.getEmailTemplate('follow_up_3');
    const followUp4Template = await storage.getEmailTemplate('follow_up_4');

    const needsFollowUp1 = await storage.getQuotesNeedingFollowUp1();
    for (const quote of needsFollowUp1) {
      try {
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(quote.email)}`;
        const resumeUrl = await ensureResumeUrl(quote, baseUrl);
        const email = generateFollowUpEmail1(quote, unsubscribeUrl, followUp1Template ? { subject: followUp1Template.subject, body: followUp1Template.body } : undefined, resumeUrl);
        const sent = await sendEmail(quote.email, email.subject, email.html);
        if (sent) {
          await storage.updateFollowUpSent(quote.id, 1);
          await storage.createEmailLog({
            quoteId: quote.id,
            recipientEmail: quote.email,
            recipientName: `${quote.firstName} ${quote.lastName}`,
            emailType: "follow_up_1",
            subject: email.subject,
          });
          console.log(`Follow-up 1 sent to ${quote.email}`);
        }
      } catch (err) {
        console.error(`Failed follow-up 1 for ${quote.email}:`, err);
      }
    }

    const needsFollowUp2 = await storage.getQuotesNeedingFollowUp2();
    for (const quote of needsFollowUp2) {
      try {
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(quote.email)}`;
        const resumeUrl = await ensureResumeUrl(quote, baseUrl);
        const email = generateFollowUpEmail2(quote, unsubscribeUrl, followUp2Template ? { subject: followUp2Template.subject, body: followUp2Template.body } : undefined, resumeUrl);
        const sent = await sendEmail(quote.email, email.subject, email.html);
        if (sent) {
          await storage.updateFollowUpSent(quote.id, 2);
          await storage.createEmailLog({
            quoteId: quote.id,
            recipientEmail: quote.email,
            recipientName: `${quote.firstName} ${quote.lastName}`,
            emailType: "follow_up_2",
            subject: email.subject,
          });
          console.log(`Follow-up 2 sent to ${quote.email}`);
        }
      } catch (err) {
        console.error(`Failed follow-up 2 for ${quote.email}:`, err);
      }
    }

    const needsFollowUp3 = await storage.getQuotesNeedingFollowUp3();
    for (const quote of needsFollowUp3) {
      try {
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(quote.email)}`;
        const resumeUrl = await ensureResumeUrl(quote, baseUrl);
        const email = generateFollowUpEmail3(quote, unsubscribeUrl, followUp3Template ? { subject: followUp3Template.subject, body: followUp3Template.body } : undefined, resumeUrl);
        const sent = await sendEmail(quote.email, email.subject, email.html);
        if (sent) {
          await storage.updateFollowUpSent(quote.id, 3);
          await storage.createEmailLog({
            quoteId: quote.id,
            recipientEmail: quote.email,
            recipientName: `${quote.firstName} ${quote.lastName}`,
            emailType: "follow_up_3",
            subject: email.subject,
          });
          console.log(`Follow-up 3 sent to ${quote.email}`);
        }
      } catch (err) {
        console.error(`Failed follow-up 3 for ${quote.email}:`, err);
      }
    }

    const needsFollowUp4 = await storage.getQuotesNeedingFollowUp4();
    for (const quote of needsFollowUp4) {
      try {
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(quote.email)}`;
        const resumeUrl = await ensureResumeUrl(quote, baseUrl);
        const email = generateFollowUpEmail4(quote, unsubscribeUrl, followUp4Template ? { subject: followUp4Template.subject, body: followUp4Template.body } : undefined, resumeUrl);
        const sent = await sendEmail(quote.email, email.subject, email.html);
        if (sent) {
          await storage.updateFollowUpSent(quote.id, 4);
          await storage.createEmailLog({
            quoteId: quote.id,
            recipientEmail: quote.email,
            recipientName: `${quote.firstName} ${quote.lastName}`,
            emailType: "follow_up_4",
            subject: email.subject,
          });
          console.log(`Follow-up 4 sent to ${quote.email}`);
        }
      } catch (err) {
        console.error(`Failed follow-up 4 for ${quote.email}:`, err);
      }
    }
  } catch (error) {
    console.error("Follow-up processing error:", error);
  }
}

async function processAbandonmentEmails(baseUrl: string) {
  try {
    const template = await storage.getEmailTemplate('abandoned_quote_recovery');
    const leads = await storage.getLeadsNeedingAbandonmentEmail();
    for (const lead of leads) {
      try {
        if (!lead.email) continue;
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(lead.email)}`;
        let resumeUrl: string;
        if (lead.resumeToken) {
          resumeUrl = `${baseUrl}/resume/${lead.resumeToken}`;
        } else {
          const draft = await storage.createQuoteDraft({
            firstName: lead.firstName,
            email: lead.email,
            mobile: lead.mobile,
            postcode: lead.postcode,
          });
          await storage.updateQuoteResumeToken(lead.id, draft.token);
          resumeUrl = `${baseUrl}/resume/${draft.token}`;
        }
        const email = generateAbandonedQuoteRecoveryEmail(
          {
            firstName: lead.firstName,
            resumeUrl,
            doorStyle: lead.doorStyle || undefined,
            totalDoors: lead.totalDoors || undefined,
          },
          unsubscribeUrl,
          template ? { subject: template.subject, body: template.body } : undefined
        );
        const sent = await sendEmail(lead.email, email.subject, email.html);
        if (sent) {
          await storage.createEmailLog({
            quoteId: lead.id,
            recipientEmail: lead.email,
            recipientName: lead.firstName,
            emailType: "abandoned_quote_recovery",
            subject: email.subject,
          });
          console.log(`Abandonment recovery email sent to ${lead.email}`);
        }
      } catch (err) {
        console.error(`Failed abandonment email for ${lead.email}:`, err);
      }
    }
  } catch (error) {
    console.error("Abandonment email processing error:", error);
  }
}

async function processScheduledCampaigns(baseUrl: string) {
  try {
    const campaigns = await storage.getScheduledCampaigns();
    for (const campaign of campaigns) {
      let recipients;
      if (campaign.targetStatus === "all") {
        recipients = await storage.getQuoteSubmissions();
      } else {
        recipients = await storage.getQuoteSubmissionsByStatus(campaign.targetStatus);
      }
      recipients = recipients.filter(r => !r.unsubscribed);

      const seen = new Set<string>();
      let sentCount = 0;
      for (const recipient of recipients) {
        if (seen.has(recipient.email)) continue;
        seen.add(recipient.email);

        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
        const personalizedBody = campaign.htmlBody
          .replace(/\{\{firstName\}\}/g, recipient.firstName)
          .replace(/\{\{lastName\}\}/g, recipient.lastName)
          .replace(/\{\{name\}\}/g, `${recipient.firstName} ${recipient.lastName}`)
          + `<div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;"><a href="${unsubscribeUrl}" style="color:#9ca3af;font-size:12px;">Unsubscribe from future emails</a></div>`;

        try {
          await sendEmail(recipient.email, campaign.subject, personalizedBody);
          await storage.createEmailLog({
            campaignId: campaign.id,
            quoteId: recipient.id,
            recipientEmail: recipient.email,
            recipientName: `${recipient.firstName} ${recipient.lastName}`,
            emailType: "campaign",
            subject: campaign.subject,
          });
          sentCount++;
        } catch (err) {
          console.error(`Failed to send campaign to ${recipient.email}:`, err);
        }
      }

      await storage.markCampaignSent(campaign.id, sentCount);
      console.log(`Scheduled campaign "${campaign.subject}" sent to ${sentCount} recipients`);
    }
  } catch (error) {
    console.error("Scheduled campaign processing error:", error);
  }
}
