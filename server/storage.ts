import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, isNull, lte, ne, desc, sql, inArray } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;
import {
  quoteSubmissions, quoteDrafts, adminUsers, emailCampaigns, emailLogs, emailTemplates, galleryItems, testimonials,
  type InsertQuoteSubmission, type QuoteSubmission, type QuoteDraft,
  type AdminUser, type EmailCampaign, type InsertEmailCampaign, type EmailLog, type EmailTemplate,
  type GalleryItem, type InsertGalleryItem, type Testimonial, type InsertTestimonial
} from "@shared/schema";

export interface IStorage {
  createQuoteSubmission(data: InsertQuoteSubmission): Promise<QuoteSubmission>;
  upsertQuoteByEmail(data: InsertQuoteSubmission): Promise<QuoteSubmission>;
  updateQuoteSubmissionByEmail(email: string, data: Partial<InsertQuoteSubmission>): Promise<QuoteSubmission | undefined>;
  updateQuoteResumeToken(id: string, resumeToken: string): Promise<void>;
  getQuoteSubmissionByResumeToken(resumeToken: string): Promise<QuoteSubmission | undefined>;
  getQuoteSubmissions(): Promise<QuoteSubmission[]>;
  getQuoteSubmissionsByStatus(status: string): Promise<QuoteSubmission[]>;
  getQuoteSubmissionById(id: string): Promise<QuoteSubmission | undefined>;
  getQuoteSubmissionByEmail(email: string): Promise<QuoteSubmission | undefined>;
  updateQuoteStatus(id: string, status: string): Promise<void>;
  updateQuoteDepositPaid(id: string): Promise<void>;
  updateQuoteCompleted(id: string): Promise<void>;
  setUnsubscribed(email: string, unsubscribed: boolean): Promise<void>;
  toggleWhatsappFollowedUp(id: string, value: boolean): Promise<void>;
  applyDiscount(id: string, discountPercent: number): Promise<QuoteSubmission | undefined>;
  updateFollowUpSent(id: string, which: 1 | 2 | 3 | 4): Promise<void>;
  getQuotesNeedingFollowUp1(): Promise<QuoteSubmission[]>;
  getQuotesNeedingFollowUp2(): Promise<QuoteSubmission[]>;
  getQuotesNeedingFollowUp3(): Promise<QuoteSubmission[]>;
  getQuotesNeedingFollowUp4(): Promise<QuoteSubmission[]>;
  createQuoteDraft(wizardState: unknown): Promise<QuoteDraft>;
  getQuoteDraft(token: string): Promise<QuoteDraft | undefined>;
  updateQuoteDraftWizardState(token: string, wizardState: unknown): Promise<void>;
  getAdminUser(username: string): Promise<AdminUser | undefined>;
  createAdminUser(username: string, passwordHash: string): Promise<AdminUser>;
  createEmailCampaign(data: InsertEmailCampaign): Promise<EmailCampaign>;
  getEmailCampaigns(): Promise<EmailCampaign[]>;
  getScheduledCampaigns(): Promise<EmailCampaign[]>;
  markCampaignSent(id: string, sentCount: number): Promise<void>;
  createEmailLog(data: { campaignId?: string; quoteId?: string; recipientEmail: string; recipientName?: string; emailType: string; subject: string }): Promise<EmailLog>;
  getEmailLogs(): Promise<EmailLog[]>;
  getEmailLogsByQuote(quoteId: string): Promise<EmailLog[]>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined>;
  upsertEmailTemplate(templateKey: string, data: { name: string; subject: string; body: string; availableVariables: string }): Promise<EmailTemplate>;
  upsertLead(data: { firstName: string; email: string; mobile: string; postcode: string; distanceMiles: number; leadSource?: string; tags?: string[] }): Promise<QuoteSubmission>;
  updateFunnelStage(email: string, stage: string): Promise<void>;
  updateDisposition(id: string, data: { dispositionStatus: string | null; dispositionNotes: string | null; followUpDate: Date | null }): Promise<QuoteSubmission | undefined>;
  editQuote(id: string, data: { totalDoors?: number; fireDoors?: number; glazedDoors?: number; bathroomLocks?: number; grandTotal?: number; depositDue?: number; notes?: string | null; doorStyle?: string; doorFinish?: string; handleModel?: string; handleFinish?: string; glazedStyle?: string | null; estimatedDays?: number }): Promise<QuoteSubmission | undefined>;
  deleteQuoteSubmission(id: string): Promise<boolean>;
  addTagToQuote(id: string, tag: string): Promise<QuoteSubmission | undefined>;
  removeTagFromQuote(id: string, tag: string): Promise<QuoteSubmission | undefined>;
  setQuoteTags(id: string, tags: string[]): Promise<QuoteSubmission | undefined>;
  getQuotesByTag(tag: string): Promise<QuoteSubmission[]>;
  updatePipelineStage(id: string, pipelineStage: string): Promise<QuoteSubmission | undefined>;
  createMetaLead(data: { firstName: string; lastName?: string; email: string; mobile?: string; postcode?: string }): Promise<QuoteSubmission>;
  deduplicateQuotedSubmissions(): Promise<number>;
  getGalleryItems(): Promise<GalleryItem[]>;
  createGalleryItem(data: InsertGalleryItem): Promise<GalleryItem>;
  deleteGalleryItem(id: string): Promise<boolean>;
  updateWizardStep(id: string, step: string): Promise<void>;
  getLeadsNeedingAbandonmentEmail(): Promise<QuoteSubmission[]>;
  getTestimonials(visibleOnly?: boolean): Promise<Testimonial[]>;
  createTestimonial(data: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, data: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<boolean>;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async createQuoteSubmission(data: InsertQuoteSubmission): Promise<QuoteSubmission> {
    const [result] = await db.insert(quoteSubmissions).values(data).returning();
    return result;
  }

  async upsertQuoteByEmail(data: InsertQuoteSubmission): Promise<QuoteSubmission> {
    const normalizedEmail = data.email?.toLowerCase().trim();
    const dataWithNormalizedEmail = { ...data, email: normalizedEmail || data.email };
    if (normalizedEmail) {
      const all = await db.select().from(quoteSubmissions).where(sql`LOWER(${quoteSubmissions.email}) = ${normalizedEmail}`);
      if (all.length > 0) {
        const target = all.find(q => q.status === "quoted") || all[0];
        const [result] = await db.update(quoteSubmissions)
          .set({
            ...dataWithNormalizedEmail,
            status: "quoted",
            timestamp: new Date(),
            followUpSentAt: null,
            followUp2SentAt: null,
            followUp3SentAt: null,
            followUp4SentAt: null,
          })
          .where(eq(quoteSubmissions.id, target.id))
          .returning();
        return result;
      }
    }
    const [result] = await db.insert(quoteSubmissions).values(dataWithNormalizedEmail).returning();
    return result;
  }

  async updateQuoteSubmissionByEmail(email: string, data: Partial<InsertQuoteSubmission>): Promise<QuoteSubmission | undefined> {
    const existing = await this.getQuoteSubmissionByEmail(email);
    if (!existing) return undefined;
    const { ...updateData } = data as any;
    delete updateData.status;
    const [result] = await db.update(quoteSubmissions).set(updateData).where(eq(quoteSubmissions.id, existing.id)).returning();
    return result;
  }

  async updateQuoteResumeToken(id: string, resumeToken: string): Promise<void> {
    await db.update(quoteSubmissions).set({ resumeToken }).where(eq(quoteSubmissions.id, id));
  }

  async getQuoteSubmissionByResumeToken(resumeToken: string): Promise<QuoteSubmission | undefined> {
    const [result] = await db.select().from(quoteSubmissions).where(eq(quoteSubmissions.resumeToken, resumeToken));
    return result;
  }

  async getQuoteSubmissions(): Promise<QuoteSubmission[]> {
    return await db.select().from(quoteSubmissions).orderBy(desc(quoteSubmissions.timestamp));
  }

  async getQuoteSubmissionsByStatus(status: string): Promise<QuoteSubmission[]> {
    return await db.select().from(quoteSubmissions).where(eq(quoteSubmissions.status, status)).orderBy(desc(quoteSubmissions.timestamp));
  }

  async getQuoteSubmissionById(id: string): Promise<QuoteSubmission | undefined> {
    const [result] = await db.select().from(quoteSubmissions).where(eq(quoteSubmissions.id, id));
    return result;
  }

  async getQuoteSubmissionByEmail(email: string): Promise<QuoteSubmission | undefined> {
    const [result] = await db.select().from(quoteSubmissions).where(eq(quoteSubmissions.email, email)).orderBy(desc(quoteSubmissions.timestamp));
    return result;
  }

  async updateQuoteStatus(id: string, status: string): Promise<void> {
    await db.update(quoteSubmissions).set({ status }).where(eq(quoteSubmissions.id, id));
  }

  async updateQuoteDepositPaid(id: string): Promise<void> {
    const existing = await this.getQuoteSubmissionById(id);
    const currentTags = existing?.tags || [];
    const newTags = currentTags.includes("deposit_paid") ? currentTags : [...currentTags, "deposit_paid"];
    await db.update(quoteSubmissions).set({ status: "deposit_paid", depositPaidAt: new Date(), tags: newTags }).where(eq(quoteSubmissions.id, id));
  }

  async updateQuoteCompleted(id: string): Promise<void> {
    const existing = await this.getQuoteSubmissionById(id);
    const currentTags = existing?.tags || [];
    const tagsToAdd = ["completed", ...(currentTags.includes("deposit_paid") ? [] : ["deposit_paid"])];
    const newTags = Array.from(new Set([...currentTags, ...tagsToAdd]));
    await db.update(quoteSubmissions).set({ status: "completed", completedAt: new Date(), tags: newTags }).where(eq(quoteSubmissions.id, id));
  }

  async setUnsubscribed(email: string, unsubscribed: boolean): Promise<void> {
    await db.update(quoteSubmissions).set({ unsubscribed }).where(eq(quoteSubmissions.email, email));
  }

  async toggleWhatsappFollowedUp(id: string, value: boolean): Promise<void> {
    await db.update(quoteSubmissions).set({ whatsappFollowedUp: value }).where(eq(quoteSubmissions.id, id));
  }

  async applyDiscount(id: string, discountPercent: number): Promise<QuoteSubmission | undefined> {
    const customer = await this.getQuoteSubmissionById(id);
    if (!customer) return undefined;

    const originalTotal = customer.originalGrandTotal ?? customer.grandTotal;
    const discountedTotal = discountPercent > 0
      ? Math.round(originalTotal * (1 - discountPercent / 100))
      : originalTotal;
    const newDeposit = Math.ceil(discountedTotal / 2);

    const [updated] = await db.update(quoteSubmissions).set({
      discountPercent,
      originalGrandTotal: originalTotal,
      grandTotal: discountedTotal,
      depositDue: newDeposit,
    }).where(eq(quoteSubmissions.id, id)).returning();

    return updated;
  }

  async updateFollowUpSent(id: string, which: 1 | 2 | 3 | 4): Promise<void> {
    if (which === 1) {
      await db.update(quoteSubmissions).set({ followUpSentAt: new Date() }).where(eq(quoteSubmissions.id, id));
    } else if (which === 2) {
      await db.update(quoteSubmissions).set({ followUp2SentAt: new Date() }).where(eq(quoteSubmissions.id, id));
    } else if (which === 3) {
      await db.update(quoteSubmissions).set({ followUp3SentAt: new Date() }).where(eq(quoteSubmissions.id, id));
    } else {
      await db.update(quoteSubmissions).set({ followUp4SentAt: new Date() }).where(eq(quoteSubmissions.id, id));
    }
  }

  async getQuotesNeedingFollowUp1(): Promise<QuoteSubmission[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await db.select().from(quoteSubmissions).where(
      and(
        eq(quoteSubmissions.status, "quoted"),
        eq(quoteSubmissions.unsubscribed, false),
        isNull(quoteSubmissions.followUpSentAt),
        lte(quoteSubmissions.timestamp, oneDayAgo)
      )
    );
  }

  async getQuotesNeedingFollowUp2(): Promise<QuoteSubmission[]> {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return await db.select().from(quoteSubmissions).where(
      and(
        eq(quoteSubmissions.status, "quoted"),
        eq(quoteSubmissions.unsubscribed, false),
        isNull(quoteSubmissions.followUp2SentAt),
        lte(quoteSubmissions.timestamp, threeDaysAgo)
      )
    );
  }

  async getQuotesNeedingFollowUp3(): Promise<QuoteSubmission[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return await db.select().from(quoteSubmissions).where(
      and(
        eq(quoteSubmissions.status, "quoted"),
        eq(quoteSubmissions.unsubscribed, false),
        isNull(quoteSubmissions.followUp3SentAt),
        lte(quoteSubmissions.timestamp, sevenDaysAgo)
      )
    );
  }

  async getQuotesNeedingFollowUp4(): Promise<QuoteSubmission[]> {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    return await db.select().from(quoteSubmissions).where(
      and(
        eq(quoteSubmissions.status, "quoted"),
        eq(quoteSubmissions.unsubscribed, false),
        isNull(quoteSubmissions.followUp4SentAt),
        lte(quoteSubmissions.timestamp, fourteenDaysAgo)
      )
    );
  }

  async createQuoteDraft(wizardState: unknown): Promise<QuoteDraft> {
    const [result] = await db.insert(quoteDrafts).values({ wizardState }).returning();
    return result;
  }

  async getQuoteDraft(token: string): Promise<QuoteDraft | undefined> {
    const [result] = await db.select().from(quoteDrafts).where(eq(quoteDrafts.token, token));
    return result;
  }

  async updateQuoteDraftWizardState(token: string, wizardState: unknown): Promise<void> {
    await db.update(quoteDrafts).set({ wizardState }).where(eq(quoteDrafts.token, token));
  }

  async getAdminUser(username: string): Promise<AdminUser | undefined> {
    const [result] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return result;
  }

  async createAdminUser(username: string, passwordHash: string): Promise<AdminUser> {
    const [result] = await db.insert(adminUsers).values({ username, passwordHash }).returning();
    return result;
  }

  async createEmailCampaign(data: InsertEmailCampaign): Promise<EmailCampaign> {
    const [result] = await db.insert(emailCampaigns).values(data).returning();
    return result;
  }

  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getScheduledCampaigns(): Promise<EmailCampaign[]> {
    const now = new Date();
    return await db.select().from(emailCampaigns).where(
      and(
        isNull(emailCampaigns.sentAt),
        lte(emailCampaigns.scheduledAt, now)
      )
    );
  }

  async markCampaignSent(id: string, sentCount: number): Promise<void> {
    await db.update(emailCampaigns).set({ sentAt: new Date(), sentCount }).where(eq(emailCampaigns.id, id));
  }

  async createEmailLog(data: { campaignId?: string; quoteId?: string; recipientEmail: string; recipientName?: string; emailType: string; subject: string }): Promise<EmailLog> {
    const [result] = await db.insert(emailLogs).values(data).returning();
    return result;
  }

  async getEmailLogs(): Promise<EmailLog[]> {
    return await db.select().from(emailLogs).orderBy(desc(emailLogs.sentAt));
  }

  async getEmailLogsByQuote(quoteId: string): Promise<EmailLog[]> {
    return await db.select().from(emailLogs).where(eq(emailLogs.quoteId, quoteId)).orderBy(desc(emailLogs.sentAt));
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.templateKey);
  }

  async getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined> {
    const [result] = await db.select().from(emailTemplates).where(eq(emailTemplates.templateKey, templateKey));
    return result;
  }

  async upsertEmailTemplate(templateKey: string, data: { name: string; subject: string; body: string; availableVariables: string }): Promise<EmailTemplate> {
    const [result] = await db.insert(emailTemplates).values({
      templateKey,
      ...data,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: emailTemplates.templateKey,
      set: {
        name: data.name,
        subject: data.subject,
        body: data.body,
        availableVariables: data.availableVariables,
        updatedAt: new Date(),
      },
    }).returning();
    return result;
  }
  async upsertLead(data: { firstName: string; email: string; mobile: string; postcode: string; distanceMiles: number; leadSource?: string; tags?: string[] }): Promise<QuoteSubmission> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const defaultSource = data.leadSource || "calculator";
    const incomingTags = data.tags || ["calculator_lead"];
    const existing = await this.getQuoteSubmissionByEmail(normalizedEmail);
    if (existing) {
      const currentTags = existing.tags || [];
      const mergedSet = new Set([...currentTags, ...incomingTags]);
      const newTags = Array.from(mergedSet);
      const [result] = await db.update(quoteSubmissions).set({
        firstName: data.firstName,
        mobile: data.mobile,
        postcode: data.postcode,
        distanceMiles: data.distanceMiles,
        funnelStage: "details_captured",
        leadSource: existing.leadSource === "meta" ? "meta" : defaultSource,
        tags: newTags,
      }).where(eq(quoteSubmissions.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(quoteSubmissions).values({
      firstName: data.firstName,
      lastName: "",
      email: normalizedEmail,
      mobile: data.mobile,
      postcode: data.postcode,
      distanceMiles: data.distanceMiles,
      doorStyle: "",
      doorFinish: "",
      totalDoors: 0,
      glazedDoors: 0,
      fireDoors: 0,
      bathroomLocks: 0,
      handleModel: "",
      handleFinish: "",
      grandTotal: 0,
      depositDue: 0,
      estimatedDays: 0,
      intent: "lead",
      status: "lead",
      funnelStage: "details_captured",
      leadSource: defaultSource,
      tags: data.tags || ["calculator_lead"],
    }).returning();
    return result;
  }

  async updateFunnelStage(email: string, stage: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.getQuoteSubmissionByEmail(normalizedEmail);
    if (existing) {
      await db.update(quoteSubmissions).set({ funnelStage: stage }).where(eq(quoteSubmissions.id, existing.id));
    }
  }

  async updateDisposition(id: string, data: { dispositionStatus: string | null; dispositionNotes: string | null; followUpDate: Date | null }): Promise<QuoteSubmission | undefined> {
    const [result] = await db.update(quoteSubmissions).set({
      dispositionStatus: data.dispositionStatus,
      dispositionNotes: data.dispositionNotes,
      dispositionDate: new Date(),
      followUpDate: data.followUpDate,
    }).where(eq(quoteSubmissions.id, id)).returning();
    return result;
  }

  async editQuote(id: string, data: { totalDoors?: number; fireDoors?: number; glazedDoors?: number; bathroomLocks?: number; grandTotal?: number; depositDue?: number; notes?: string | null; doorStyle?: string; doorFinish?: string; handleModel?: string; handleFinish?: string; glazedStyle?: string | null; estimatedDays?: number }): Promise<QuoteSubmission | undefined> {
    const updateFields: Record<string, any> = {};
    if (data.totalDoors !== undefined) updateFields.totalDoors = data.totalDoors;
    if (data.fireDoors !== undefined) updateFields.fireDoors = data.fireDoors;
    if (data.glazedDoors !== undefined) updateFields.glazedDoors = data.glazedDoors;
    if (data.bathroomLocks !== undefined) updateFields.bathroomLocks = data.bathroomLocks;
    if (data.grandTotal !== undefined) updateFields.grandTotal = data.grandTotal;
    if (data.depositDue !== undefined) updateFields.depositDue = data.depositDue;
    if (data.notes !== undefined) updateFields.notes = data.notes;
    if (data.doorStyle !== undefined) updateFields.doorStyle = data.doorStyle;
    if (data.doorFinish !== undefined) updateFields.doorFinish = data.doorFinish;
    if (data.handleModel !== undefined) updateFields.handleModel = data.handleModel;
    if (data.handleFinish !== undefined) updateFields.handleFinish = data.handleFinish;
    if (data.glazedStyle !== undefined) updateFields.glazedStyle = data.glazedStyle;
    if (data.estimatedDays !== undefined) updateFields.estimatedDays = data.estimatedDays;
    if (Object.keys(updateFields).length === 0) return undefined;
    const [result] = await db.update(quoteSubmissions).set(updateFields).where(eq(quoteSubmissions.id, id)).returning();
    return result;
  }

  async deleteQuoteSubmission(id: string): Promise<boolean> {
    const result = await db.delete(quoteSubmissions).where(eq(quoteSubmissions.id, id)).returning();
    return result.length > 0;
  }

  async addTagToQuote(id: string, tag: string): Promise<QuoteSubmission | undefined> {
    const existing = await this.getQuoteSubmissionById(id);
    if (!existing) return undefined;
    const currentTags = existing.tags || [];
    if (currentTags.includes(tag)) return existing;
    const [result] = await db.update(quoteSubmissions).set({ tags: [...currentTags, tag] }).where(eq(quoteSubmissions.id, id)).returning();
    return result;
  }

  async removeTagFromQuote(id: string, tag: string): Promise<QuoteSubmission | undefined> {
    const existing = await this.getQuoteSubmissionById(id);
    if (!existing) return undefined;
    const currentTags = existing.tags || [];
    const [result] = await db.update(quoteSubmissions).set({ tags: currentTags.filter(t => t !== tag) }).where(eq(quoteSubmissions.id, id)).returning();
    return result;
  }

  async setQuoteTags(id: string, tags: string[]): Promise<QuoteSubmission | undefined> {
    const [result] = await db.update(quoteSubmissions).set({ tags }).where(eq(quoteSubmissions.id, id)).returning();
    return result;
  }

  async getQuotesByTag(tag: string): Promise<QuoteSubmission[]> {
    const all = await this.getQuoteSubmissions();
    return all.filter(q => (q.tags || []).includes(tag));
  }

  async updatePipelineStage(id: string, pipelineStage: string): Promise<QuoteSubmission | undefined> {
    const statusMap: Record<string, string> = {
      new_lead: "lead",
      quoted: "quoted",
      follow_up: "quoted",
      sizes_submitted: "quoted",
      booked: "deposit_paid",
      completed: "completed",
      lost: "quoted",
    };
    const newStatus = statusMap[pipelineStage] || "quoted";
    const updateData: Record<string, unknown> = { pipelineStage, status: newStatus };
    if (pipelineStage === "booked" && newStatus === "deposit_paid") {
      updateData.depositPaidAt = new Date();
      const existing = await this.getQuoteSubmissionById(id);
      const currentTags = existing?.tags || [];
      if (!currentTags.includes("deposit_paid")) {
        updateData.tags = [...currentTags, "deposit_paid"];
      }
    }
    if (pipelineStage === "completed") {
      updateData.completedAt = new Date();
      const existing = await this.getQuoteSubmissionById(id);
      const currentTags = existing?.tags || [];
      const tagsToAdd = ["completed", ...(currentTags.includes("deposit_paid") ? [] : ["deposit_paid"])];
      updateData.tags = Array.from(new Set([...currentTags, ...tagsToAdd]));
    }
    const [result] = await db.update(quoteSubmissions).set(updateData).where(eq(quoteSubmissions.id, id)).returning();
    return result;
  }

  async createMetaLead(data: { firstName: string; lastName?: string; email: string; mobile?: string; postcode?: string }): Promise<QuoteSubmission> {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await this.getQuoteSubmissionByEmail(normalizedEmail);
    if (existing) {
      const currentTags = existing.tags || [];
      const newTags = currentTags.includes("meta_lead") ? currentTags : [...currentTags, "meta_lead"];
      const [result] = await db.update(quoteSubmissions).set({
        firstName: data.firstName || existing.firstName,
        lastName: data.lastName || existing.lastName,
        mobile: data.mobile || existing.mobile,
        postcode: data.postcode || existing.postcode,
        leadSource: "meta",
        tags: newTags,
      }).where(eq(quoteSubmissions.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(quoteSubmissions).values({
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: normalizedEmail,
      mobile: data.mobile || "",
      postcode: data.postcode || "",
      distanceMiles: 0,
      doorStyle: "",
      doorFinish: "",
      totalDoors: 0,
      glazedDoors: 0,
      fireDoors: 0,
      bathroomLocks: 0,
      handleModel: "",
      handleFinish: "",
      grandTotal: 0,
      depositDue: 0,
      estimatedDays: 0,
      intent: "lead",
      status: "lead",
      funnelStage: "details_captured",
      leadSource: "meta",
      tags: ["meta_lead"],
    }).returning();
    return result;
  }

  async deduplicateQuotedSubmissions(): Promise<number> {
    const all = await db.select().from(quoteSubmissions).orderBy(desc(quoteSubmissions.timestamp));
    const statusPriority: Record<string, number> = { completed: 3, deposit_paid: 2, quoted: 1 };
    const kept = new Map<string, { id: string; priority: number }>();
    const toDelete: string[] = [];
    for (const q of all) {
      const email = q.email.toLowerCase().trim();
      const priority = statusPriority[q.status] || 0;
      const existing = kept.get(email);
      if (!existing) {
        kept.set(email, { id: q.id, priority });
      } else if (priority > existing.priority) {
        toDelete.push(existing.id);
        kept.set(email, { id: q.id, priority });
      } else {
        toDelete.push(q.id);
      }
    }
    if (toDelete.length > 0) {
      await db.delete(quoteSubmissions).where(inArray(quoteSubmissions.id, toDelete));
    }
    return toDelete.length;
  }

  async getGalleryItems(): Promise<GalleryItem[]> {
    return await db.select().from(galleryItems).orderBy(galleryItems.sortOrder, desc(galleryItems.createdAt));
  }

  async createGalleryItem(data: InsertGalleryItem): Promise<GalleryItem> {
    const [result] = await db.insert(galleryItems).values(data).returning();
    return result;
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const result = await db.delete(galleryItems).where(eq(galleryItems.id, id)).returning();
    return result.length > 0;
  }

  async updateWizardStep(id: string, step: string): Promise<void> {
    await db.update(quoteSubmissions).set({ wizardStep: step }).where(eq(quoteSubmissions.id, id));
  }

  async getLeadsNeedingAbandonmentEmail(): Promise<QuoteSubmission[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const STAGES_AT_OR_AFTER_QUOTE_VIEWED = ["quote_viewed", "quote_sent", "booked", "deposit_paid", "completed", "lost"];
    const allLeads = await db.select().from(quoteSubmissions).where(
      and(
        eq(quoteSubmissions.status, "lead"),
        eq(quoteSubmissions.unsubscribed, false),
        lte(quoteSubmissions.timestamp, oneHourAgo)
      )
    );
    const notYetQuoteViewed = allLeads.filter(q =>
      !q.funnelStage || !STAGES_AT_OR_AFTER_QUOTE_VIEWED.includes(q.funnelStage)
    );
    if (notYetQuoteViewed.length === 0) return [];
    const ids = notYetQuoteViewed.map(q => q.id);
    const logs = await db.select().from(emailLogs).where(
      and(
        eq(emailLogs.emailType, "abandoned_quote_recovery"),
        inArray(emailLogs.quoteId, ids)
      )
    );
    const alreadySentIds = new Set(logs.map(l => l.quoteId).filter(Boolean));
    return notYetQuoteViewed.filter(q => !alreadySentIds.has(q.id));
  }

  async getTestimonials(visibleOnly = false): Promise<Testimonial[]> {
    if (visibleOnly) {
      return await db.select().from(testimonials).where(eq(testimonials.isVisible, true)).orderBy(testimonials.sortOrder, desc(testimonials.createdAt));
    }
    return await db.select().from(testimonials).orderBy(testimonials.sortOrder, desc(testimonials.createdAt));
  }

  async createTestimonial(data: InsertTestimonial): Promise<Testimonial> {
    const [result] = await db.insert(testimonials).values(data).returning();
    return result;
  }

  async updateTestimonial(id: string, data: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [result] = await db.update(testimonials).set(data).where(eq(testimonials.id, id)).returning();
    return result;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    const result = await db.delete(testimonials).where(eq(testimonials.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
