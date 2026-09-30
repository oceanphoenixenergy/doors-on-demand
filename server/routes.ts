import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { validatePostcode } from "./postcodeUtils";
import { sendEmail } from "./gmail";
import { generateCustomerQuoteEmail, generateBusinessNotificationEmail, generateQuotePreviewEmail, generateCustomerQuotePreviewEmail, generatePaymentConfirmationEmail, generateDepositNotificationEmail } from "./emailTemplates";
import { insertQuoteSubmissionSchema, postcodeCheckSchema } from "@shared/schema";
import { getAvailableFittingDates, createFittingBooking } from "./googleCalendar";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { z } from "zod";

// Business notification email - set this to your email address
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/check-postcode", async (req, res) => {
    try {
      const parsed = postcodeCheckSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ valid: false, message: "Invalid postcode format" });
      }
      
      const result = validatePostcode(parsed.data.postcode);
      return res.json(result);
    } catch (error) {
      console.error("Postcode check error:", error);
      return res.status(500).json({ valid: false, message: "Unable to verify postcode" });
    }
  });

  // Meta (Facebook) Lead Form Webhook - Verification
  app.get("/api/meta/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "doors_on_demand_meta_verify";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Meta webhook verified");
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  });

  // Meta (Facebook) Lead Form Webhook - Receive Leads
  app.post("/api/meta/webhook", async (req, res) => {
    try {
      const body = req.body;
      console.log("Meta webhook received:", JSON.stringify(body));

      if (body.object === "page" && body.entry) {
        for (const entry of body.entry) {
          const changes = entry.changes || [];
          for (const change of changes) {
            if (change.field === "leadgen") {
              const leadgenId = change.value?.leadgen_id;
              const formId = change.value?.form_id;
              console.log(`Meta lead received: leadgen_id=${leadgenId}, form_id=${formId}`);

              const fieldData = change.value?.field_data || [];
              const leadData: Record<string, string> = {};
              for (const field of fieldData) {
                const name = (field.name || "").toLowerCase();
                const values = field.values || [];
                if (values.length > 0) {
                  if (name.includes("email")) leadData.email = values[0];
                  else if (name.includes("first") && name.includes("name")) leadData.firstName = values[0];
                  else if (name.includes("last") && name.includes("name")) leadData.lastName = values[0];
                  else if (name.includes("full") && name.includes("name")) {
                    const parts = values[0].split(" ");
                    leadData.firstName = parts[0] || "";
                    leadData.lastName = parts.slice(1).join(" ") || "";
                  }
                  else if (name.includes("phone") || name.includes("mobile")) leadData.mobile = values[0];
                  else if (name.includes("post") || name.includes("zip")) leadData.postcode = values[0];
                }
              }

              if (leadData.email) {
                const lead = await storage.createMetaLead({
                  firstName: leadData.firstName || "",
                  lastName: leadData.lastName || "",
                  email: leadData.email,
                  mobile: leadData.mobile || "",
                  postcode: leadData.postcode || "",
                });
                console.log(`Meta lead saved to CRM: ${lead.id} (${leadData.email})`);
              } else {
                console.log("Meta lead missing email, skipping");
              }
            }
          }
        }
      }

      return res.sendStatus(200);
    } catch (error) {
      console.error("Meta webhook error:", error);
      return res.sendStatus(200);
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const { firstName, email, mobile, postcode, distanceMiles, leadSource, tags } = req.body;
      if (!firstName || !email || !mobile || !postcode) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const lead = await storage.upsertLead({ firstName, email, mobile, postcode, distanceMiles: distanceMiles || 0, leadSource, tags });
      return res.status(201).json({ id: lead.id });
    } catch (error) {
      console.error("Lead capture error:", error);
      return res.status(500).json({ error: "Failed to save lead" });
    }
  });

  app.post("/api/funnel-stage", async (req, res) => {
    try {
      const { email, stage } = req.body;
      if (!email || !stage) {
        return res.status(400).json({ error: "Missing email or stage" });
      }
      await storage.updateFunnelStage(email, stage);
      return res.json({ success: true });
    } catch (error) {
      console.error("Funnel stage update error:", error);
      return res.status(500).json({ error: "Failed to update funnel stage" });
    }
  });

  const WIZARD_STEP_ORDER = [
    "Details",
    "Door Style",
    "Quantities",
    "Handles",
    "Quote & Proceed",
    "Door Sizes",
    "Fitting Date",
    "Address",
    "Payment page",
  ];

  app.patch("/api/quotes/:id/step", async (req, res) => {
    try {
      const { id } = req.params;
      const stepSchema = z.object({ step: z.string().min(1) });
      const parsed = stepSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Missing step" });
      }
      const newStep = parsed.data.step;
      const newIndex = WIZARD_STEP_ORDER.indexOf(newStep);
      if (newIndex === -1) {
        return res.status(400).json({ error: "Invalid step name" });
      }
      const existing = await storage.getQuoteSubmissionById(id);
      if (!existing) {
        return res.status(404).json({ error: "Quote not found" });
      }
      const currentIndex = existing.wizardStep ? WIZARD_STEP_ORDER.indexOf(existing.wizardStep) : -1;
      if (newIndex > currentIndex) {
        await storage.updateWizardStep(id, newStep);
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Wizard step update error:", error);
      return res.status(500).json({ error: "Failed to update wizard step" });
    }
  });

  app.post("/api/quotes", async (req, res) => {
    try {
      const parsed = insertQuoteSubmissionSchema.safeParse(req.body);
      
      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        return res.status(400).json({ 
          error: "Invalid quote data", 
          details: parsed.error.flatten() 
        });
      }
      
      const existing = await storage.updateQuoteSubmissionByEmail(parsed.data.email, parsed.data);
      const quote = existing || await storage.createQuoteSubmission(parsed.data);
      
      // Send emails asynchronously (don't block the response)
      (async () => {
        try {
          // Send quote email to customer
          const customerEmail = generateCustomerQuoteEmail(quote);
          await sendEmail(quote.email, customerEmail.subject, customerEmail.html);
          console.log(`Customer quote email sent to ${quote.email}`);
          
          // Send notification to business owner if email is configured
          if (BUSINESS_EMAIL) {
            const businessEmail = generateBusinessNotificationEmail(quote);
            await sendEmail(BUSINESS_EMAIL, businessEmail.subject, businessEmail.html);
            console.log(`Business notification sent to ${BUSINESS_EMAIL}`);
          } else {
            console.log("BUSINESS_EMAIL not configured, skipping business notification");
          }
        } catch (emailError) {
          console.error("Failed to send emails:", emailError);
        }
      })();
      
      return res.status(201).json(quote);
    } catch (error) {
      console.error("Quote submission error:", error);
      return res.status(500).json({ error: "Failed to save quote" });
    }
  });

  app.get("/api/quotes", async (req, res) => {
    try {
      const quotes = await storage.getQuoteSubmissions();
      return res.json(quotes);
    } catch (error) {
      console.error("Get quotes error:", error);
      return res.status(500).json({ error: "Failed to retrieve quotes" });
    }
  });

  app.post("/api/quote-preview", async (req, res) => {
    try {
      const previewData = req.body;
      
      const draft = await storage.createQuoteDraft(previewData.wizardState || previewData);
      const resumeToken = draft.token;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const resumeUrl = `${baseUrl}/resume/${resumeToken}`;

      let quoteId: string | undefined;
      try {
        const quoteSubmission = await storage.upsertQuoteByEmail({
          firstName: previewData.firstName || "",
          lastName: previewData.lastName || "",
          email: previewData.email || "",
          mobile: previewData.mobile || "",
          postcode: previewData.postcode || "",
          distanceMiles: previewData.distanceMiles || 0,
          doorStyle: previewData.doorStyle || "",
          doorFinish: previewData.doorFinish || "",
          totalDoors: previewData.totalDoors || 0,
          glazedDoors: previewData.glazedDoors || 0,
          glazedStyle: previewData.glazedStyle || null,
          fireDoors: previewData.fireDoors || 0,
          bathroomLocks: previewData.bathroomLocks || 0,
          handleModel: previewData.handleModel || "",
          handleFinish: previewData.handleFinish || "",
          grandTotal: previewData.grandTotal || 0,
          depositDue: previewData.deposit || 0,
          estimatedDays: previewData.estimatedDays || 1,
          intent: "quoted",
          preferredTiming: null,
          notes: null,
          question: null,
        });
        quoteId = quoteSubmission.id;
        console.log(`Quote submission upserted for ${previewData.email} (id: ${quoteId})`);

        await storage.updateQuoteResumeToken(quoteSubmission.id, resumeToken);
      } catch (quoteErr) {
        console.error("Failed to create quote submission from preview:", quoteErr);
      }
      
      (async () => {
        try {
          if (previewData.email) {
            const quotePreviewTemplate = await storage.getEmailTemplate('quote_preview');
            const customerEmail = generateCustomerQuotePreviewEmail(previewData, resumeUrl, quotePreviewTemplate ? { subject: quotePreviewTemplate.subject, body: quotePreviewTemplate.body } : undefined);
            await sendEmail(previewData.email, customerEmail.subject, customerEmail.html);
            console.log(`Customer quote preview email sent to ${previewData.email}`);

            if (quoteId) {
              try {
                await storage.createEmailLog({
                  quoteId,
                  recipientEmail: previewData.email,
                  recipientName: `${previewData.firstName || ""} ${previewData.lastName || ""}`.trim(),
                  emailType: "quote_preview",
                  subject: customerEmail.subject,
                });
              } catch (logErr) {
                console.error("Failed to log quote preview email:", logErr);
              }
            }
          }

          if (BUSINESS_EMAIL) {
            const previewEmail = generateQuotePreviewEmail(previewData);
            await sendEmail(BUSINESS_EMAIL, previewEmail.subject, previewEmail.html);
            console.log(`Quote preview notification sent to ${BUSINESS_EMAIL}`);
          }
        } catch (emailError) {
          console.error("Failed to send quote preview emails:", emailError);
        }
      })();
      
      return res.json({ success: true, resumeToken, quoteId });
    } catch (error) {
      console.error("Quote preview email error:", error);
      return res.status(500).json({ error: "Failed to send preview notification" });
    }
  });

  app.get("/api/quote-drafts/:token", async (req, res) => {
    try {
      const draft = await storage.getQuoteDraft(req.params.token);
      if (!draft) {
        return res.status(404).json({ error: "Quote not found or expired" });
      }

      let discountPercent = 0;
      const submission = await storage.getQuoteSubmissionByResumeToken(req.params.token);
      if (submission && submission.discountPercent > 0) {
        discountPercent = submission.discountPercent;
      }

      return res.json({ ...draft, discountPercent });
    } catch (error) {
      console.error("Get quote draft error:", error);
      return res.status(500).json({ error: "Failed to retrieve quote" });
    }
  });

  // Get available fitting dates from Google Calendar
  app.get("/api/available-dates", async (req, res) => {
    try {
      const weeksAhead = parseInt(req.query.weeks as string) || 6;
      const daysNeeded = parseInt(req.query.days as string) || 1;
      const availableDates = await getAvailableFittingDates(weeksAhead, daysNeeded);
      return res.json(availableDates);
    } catch (error) {
      console.error("Calendar availability error:", error);
      return res.status(500).json({ error: "Failed to fetch available dates" });
    }
  });

  // Get Stripe publishable key for client
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      return res.json({ publishableKey });
    } catch (error) {
      console.error("Stripe config error:", error);
      return res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  // Schema for checkout session validation
  const checkoutSessionSchema = z.object({
    depositAmount: z.number().positive().max(50000),
    customerEmail: z.string().email(),
    customerName: z.string().min(2).max(100),
    customerMobile: z.string().optional().default(""),
    customerPostcode: z.string().optional().default(""),
    customerAddress: z.string().optional().default(""),
    fittingDate: z.string().min(1),
    fittingDateISO: z.string().min(1),
    fittingEndDateISO: z.string().optional().default(""),
    doorSizesFormatted: z.string().optional().default(""),
    quoteDetails: z.object({
      totalDoors: z.number().int().min(3).max(50),
      doorStyle: z.string().min(1),
      grandTotal: z.number().positive(),
      bathroomLocks: z.number().int().min(0).max(50).optional().default(0),
    }),
  });

  // Create Stripe checkout session for deposit payment
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const parsed = checkoutSessionSchema.safeParse(req.body);
      
      if (!parsed.success) {
        console.error("Checkout validation error:", parsed.error);
        return res.status(400).json({ error: "Invalid checkout data" });
      }
      
      const { depositAmount, customerEmail, customerName, customerMobile, customerPostcode, customerAddress, quoteDetails, fittingDate, fittingDateISO, fittingEndDateISO, doorSizesFormatted } = parsed.data;
      
      // Validate deposit is approximately 50% of grand total (allow small rounding differences)
      const expectedDeposit = Math.ceil(quoteDetails.grandTotal / 2);
      if (Math.abs(depositAmount - expectedDeposit) > 1) {
        console.error("Deposit amount mismatch:", { depositAmount, expectedDeposit });
        return res.status(400).json({ error: "Invalid deposit amount" });
      }

      const stripe = await getUncachableStripeClient();
      
      // Create a checkout session for the deposit
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              unit_amount: Math.round(depositAmount * 100), // Convert to pence
              product_data: {
                name: 'Door Fitting Deposit',
                description: `50% deposit for ${quoteDetails?.totalDoors || ''} door fitting - ${fittingDate || 'Date TBC'}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          customerName,
          customerEmail,
          customerMobile: customerMobile || '',
          customerPostcode: customerPostcode || '',
          customerAddress: customerAddress || '',
          fittingDate,
          fittingDateISO,
          fittingEndDateISO: fittingEndDateISO || '',
          totalDoors: quoteDetails?.totalDoors?.toString() || '',
          doorStyle: quoteDetails?.doorStyle || '',
          grandTotal: quoteDetails?.grandTotal?.toString() || '',
          depositAmount: depositAmount.toString(),
          doorSizes: doorSizesFormatted || '',
          bathroomLocks: quoteDetails?.bathroomLocks?.toString() || '0',
        },
        success_url: `${req.protocol}://${req.get('host')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment-cancelled`,
      });

      return res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Checkout session error:", error);
      return res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  const processedPaymentSessions = new Set<string>();

  // Verify payment success
  app.get("/api/verify-payment/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      const isPaid = session.payment_status === 'paid';
      const metadata = session.metadata;

      if (isPaid && metadata?.fittingDateISO && !processedPaymentSessions.has(sessionId)) {
        processedPaymentSessions.add(sessionId);
        const depositPaid = metadata.depositAmount || (session.amount_total ? (session.amount_total / 100).toString() : '0');
        const grandTotal = metadata.grandTotal || '0';
        const balanceDue = (parseFloat(grandTotal) - parseFloat(depositPaid)).toFixed(0);
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        (async () => {
          let balancePaymentUrl: string | undefined;

          try {
            const balanceAmount = Math.round(parseFloat(balanceDue) * 100);
            if (balanceAmount > 0) {
              const product = await stripe.products.create({
                name: 'Door Fitting Balance Payment',
                description: `Balance payment for ${metadata.totalDoors || ''} door fitting - ${metadata.customerName || 'Customer'}`,
              });
              const price = await stripe.prices.create({
                product: product.id,
                unit_amount: balanceAmount,
                currency: 'gbp',
              });
              const paymentLink = await stripe.paymentLinks.create({
                line_items: [{ price: price.id, quantity: 1 }],
                after_completion: {
                  type: 'redirect',
                  redirect: { url: `${baseUrl}/balance-paid` },
                },
              });
              balancePaymentUrl = paymentLink.url;
              console.log(`Balance payment link created: ${balancePaymentUrl} for £${balanceDue}`);
            }
          } catch (linkError) {
            console.error("Failed to create balance payment link:", linkError);
          }

          try {
            const customerEmail = metadata.customerEmail || session.customer_email || '';
            if (customerEmail) {
              const quote = await storage.getQuoteSubmissionByEmail(customerEmail);
              if (quote) {
                await storage.updateQuoteDepositPaid(quote.id);
                console.log(`Updated quote ${quote.id} status to deposit_paid`);
              }
            }
          } catch (statusError) {
            console.error("Failed to update quote status:", statusError);
          }

          try {
            await createFittingBooking({
              customerName: metadata.customerName || 'Unknown',
              customerEmail: metadata.customerEmail || session.customer_email || '',
              mobile: metadata.customerMobile || undefined,
              postcode: metadata.customerPostcode || undefined,
              address: metadata.customerAddress || undefined,
              doorStyle: metadata.doorStyle || '',
              totalDoors: metadata.totalDoors || '',
              grandTotal,
              depositPaid,
              fittingDateISO: metadata.fittingDateISO,
              fittingEndDateISO: metadata.fittingEndDateISO || undefined,
              fittingDateDisplay: metadata.fittingDate || metadata.fittingDateISO,
              doorSizes: metadata.doorSizes || undefined,
              balancePaymentUrl,
              bathroomLocks: metadata.bathroomLocks || '0',
            });
          } catch (calendarError) {
            console.error("Failed to create calendar booking:", calendarError);
          }

          try {
            const customerEmail = metadata.customerEmail || session.customer_email || '';
            if (customerEmail) {
              const depositTemplate = await storage.getEmailTemplate('deposit_confirmation');
              const confirmationEmail = generatePaymentConfirmationEmail({
                customerName: metadata.customerName || 'Customer',
                customerEmail,
                fittingDate: metadata.fittingDate || metadata.fittingDateISO,
                totalDoors: metadata.totalDoors || '',
                doorStyle: metadata.doorStyle || '',
                grandTotal,
                depositPaid,
                balanceDue,
              }, depositTemplate ? { subject: depositTemplate.subject, body: depositTemplate.body } : undefined);
              await sendEmail(customerEmail, confirmationEmail.subject, confirmationEmail.html);
              console.log(`Payment confirmation email sent to ${customerEmail}`);

              if (BUSINESS_EMAIL) {
                try {
                  const depositNotification = generateDepositNotificationEmail({
                    customerName: metadata.customerName || 'Customer',
                    customerEmail,
                    customerMobile: metadata.customerMobile || '',
                    customerAddress: metadata.customerAddress || '',
                    customerPostcode: metadata.customerPostcode || '',
                    doorStyle: metadata.doorStyle || '',
                    totalDoors: metadata.totalDoors || '',
                    doorSizes: metadata.doorSizes || '',
                    fittingDate: metadata.fittingDate || metadata.fittingDateISO,
                    grandTotal,
                    depositPaid,
                    balanceDue,
                  });
                  await sendEmail(BUSINESS_EMAIL, depositNotification.subject, depositNotification.html);
                  console.log(`Deposit notification email sent to ${BUSINESS_EMAIL}`);
                } catch (notifError) {
                  console.error("Failed to send deposit notification to business:", notifError);
                }
              }

              const quote = await storage.getQuoteSubmissionByEmail(customerEmail);
              if (quote) {
                await storage.createEmailLog({
                  quoteId: quote.id,
                  emailType: 'deposit_confirmation',
                  subject: confirmationEmail.subject,
                  recipientEmail: customerEmail,
                });
              }
            }
          } catch (emailError) {
            console.error("Failed to send payment confirmation email:", emailError);
          }
        })();
      }

      return res.json({
        success: isPaid,
        status: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        metadata: session.metadata,
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      return res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.get("/api/email-preview", async (req, res) => {
    try {
      const sampleData = {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah@example.com",
        mobile: "07777 123456",
        postcode: "B74 2DH",
        doorStyle: "mexicano",
        doorFinish: "prefinished",
        totalDoors: 5,
        fireDoors: 1,
        glazedDoors: 1,
        glazedStyle: "frosted",
        bathroomLocks: 1,
        handleModel: "morley",
        handleFinish: "matt-black",
        grandTotal: 1720,
        deposit: 860,
        distanceMiles: 3.2,
      };
      const resumeUrl = `${req.protocol}://${req.get("host")}/resume/sample-preview-token`;
      const result = generateCustomerQuotePreviewEmail(sampleData as any, resumeUrl);
      res.setHeader("Content-Type", "text/html");
      return res.send(result.html);
    } catch (error) {
      console.error("Email preview error:", error);
      return res.status(500).json({ error: "Failed to generate email preview" });
    }
  });

  return httpServer;
}
