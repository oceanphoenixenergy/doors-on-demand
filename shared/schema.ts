import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quoteSubmissions = pgTable("quote_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  postcode: text("postcode").notNull(),
  addressLine1: text("address_line1").default(""),
  addressLine2: text("address_line2").default(""),
  city: text("city").default(""),
  distanceMiles: real("distance_miles").notNull(),
  doorStyle: text("door_style").notNull(),
  doorFinish: text("door_finish").notNull(),
  totalDoors: integer("total_doors").notNull(),
  glazedDoors: integer("glazed_doors").notNull(),
  glazedStyle: text("glazed_style"),
  fireDoors: integer("fire_doors").notNull(),
  bathroomLocks: integer("bathroom_locks").notNull(),
  handleModel: text("handle_model").notNull(),
  handleFinish: text("handle_finish").notNull(),
  grandTotal: real("grand_total").notNull(),
  depositDue: real("deposit_due").notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  intent: text("intent").notNull(),
  preferredTiming: text("preferred_timing"),
  notes: text("notes"),
  question: text("question"),
  status: text("status").default("quoted").notNull(),
  unsubscribed: boolean("unsubscribed").default(false).notNull(),
  depositPaidAt: timestamp("deposit_paid_at"),
  completedAt: timestamp("completed_at"),
  followUpSentAt: timestamp("follow_up_sent_at"),
  followUp2SentAt: timestamp("follow_up2_sent_at"),
  followUp3SentAt: timestamp("follow_up3_sent_at"),
  followUp4SentAt: timestamp("follow_up4_sent_at"),
  resumeToken: text("resume_token"),
  whatsappFollowedUp: boolean("whatsapp_followed_up").default(false).notNull(),
  discountPercent: real("discount_percent").default(0).notNull(),
  originalGrandTotal: real("original_grand_total"),
  funnelStage: text("funnel_stage").default("lead"),
  dispositionStatus: text("disposition_status"),
  dispositionNotes: text("disposition_notes"),
  dispositionDate: timestamp("disposition_date"),
  followUpDate: timestamp("follow_up_date"),
  leadSource: text("lead_source").default("calculator"),
  tags: text("tags").array().default([]),
  pipelineStage: text("pipeline_stage").default("new_lead"),
  wizardStep: text("wizard_step"),
});

export const insertQuoteSubmissionSchema = createInsertSchema(quoteSubmissions).omit({
  id: true,
  timestamp: true,
  status: true,
  unsubscribed: true,
  depositPaidAt: true,
  completedAt: true,
  followUpSentAt: true,
  followUp2SentAt: true,
  followUp3SentAt: true,
  followUp4SentAt: true,
  resumeToken: true,
  whatsappFollowedUp: true,
  discountPercent: true,
  originalGrandTotal: true,
  funnelStage: true,
  dispositionStatus: true,
  dispositionNotes: true,
  dispositionDate: true,
  followUpDate: true,
  leadSource: true,
  tags: true,
  pipelineStage: true,
  wizardStep: true,
});

export type InsertQuoteSubmission = z.infer<typeof insertQuoteSubmissionSchema>;
export type QuoteSubmission = typeof quoteSubmissions.$inferSelect;

export const postcodeCheckSchema = z.object({
  postcode: z.string().min(2).max(10),
});

export const quickDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Please enter a valid email"),
  mobile: z.string().min(10, "Please enter a valid mobile number"),
});

export const addressDetailsSchema = z.object({
  lastName: z.string().min(1, "Last name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional().default(""),
  city: z.string().min(1, "Town/city is required"),
});

export const customerDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  mobile: z.string().min(10, "Please enter a valid mobile number"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional().default(""),
  city: z.string().min(1, "Town/city is required"),
});

export const doorStyleSchema = z.enum([
  "mexicano",
  "iseo",
  "aston",
  "7-panel",
  "dx30",
  "4-panel-shaker",
  "rustic-edwardian"
]);

export const doorFinishSchema = z.enum(["unfinished", "prefinished"]);

export const DOOR_STYLES = {
  mexicano: {
    name: "Mexicano",
    finishes: ["unfinished", "prefinished"] as const,
    description: "Stunning horizontal grooves for a sleek, modern look",
    hasFireOption: true,
  },
  iseo: {
    name: "ISEO",
    finishes: ["prefinished"] as const,
    description: "Beautifully minimal with a striking vertical groove",
    hasFireOption: true,
  },
  aston: {
    name: "Aston",
    finishes: ["unfinished"] as const,
    description: "Elegant 3-panel design with timeless appeal",
    hasFireOption: false,
  },
  "7-panel": {
    name: "7 Panel",
    finishes: ["unfinished", "prefinished"] as const,
    description: "Charming cottage-style panels full of character",
    hasFireOption: true,
  },
  dx30: {
    name: "DX30",
    finishes: ["unfinished"] as const,
    description: "Classic 1930s charm with stylish vertical grooves",
    hasFireOption: false,
  },
  "4-panel-shaker": {
    name: "4 Panel Shaker Oak",
    finishes: ["unfinished", "prefinished"] as const,
    description: "Clean, understated elegance that suits any home",
    hasFireOption: true,
  },
  "rustic-edwardian": {
    name: "Rustic Edwardian 4 Panel",
    finishes: ["prefinished"] as const,
    description: "Beautiful natural grain with warm, rustic character",
    hasFireOption: false,
  },
} as const;

export const GLAZED_OPTIONS = {
  mexicano: [
    { id: "2xg", name: "2XG" },
    { id: "frosted", name: "Frosted" },
    { id: "6l", name: "6L" },
    { id: "pattern10", name: "Pattern 10" },
  ],
  iseo: [
    { id: "clear", name: "Clear" },
    { id: "frosted", name: "Frosted" },
    { id: "pattern10-clear", name: "Pattern 10 Clear" },
    { id: "pattern10-frosted", name: "Pattern 10 Frosted" },
  ],
  aston: [
    { id: "clear", name: "Clear" },
    { id: "frosted", name: "Frosted" },
  ],
  "7-panel": [
    { id: "clear", name: "Clear" },
    { id: "frosted", name: "Frosted" },
  ],
  dx30: [
    { id: "clear", name: "Clear" },
    { id: "frosted", name: "Frosted" },
  ],
  "4-panel-shaker": [
    { id: "clear", name: "Clear" },
    { id: "frosted", name: "Frosted" },
  ],
  "rustic-edwardian": [
    { id: "clear", name: "Clear" },
  ],
} as const;

export const quantitiesSchema = z.object({
  totalDoors: z.number().min(3, "Minimum order is 3 doors"),
  glazedDoors: z.number().min(0),
  fireDoors: z.number().min(0),
  bathroomLocks: z.number().min(0),
});

export const handlesSchema = z.object({
  handleModel: z.enum(["morley", "shellaston"]),
  handleFinish: z.enum(["satin-nickel", "matt-black", "polished-brass"]),
});

export type DoorStyle = z.infer<typeof doorStyleSchema>;
export type DoorFinish = z.infer<typeof doorFinishSchema>;
export type QuickDetails = z.infer<typeof quickDetailsSchema>;
export type AddressDetails = z.infer<typeof addressDetailsSchema>;
export type CustomerDetails = z.infer<typeof customerDetailsSchema>;
export type Quantities = z.infer<typeof quantitiesSchema>;
export type Handles = z.infer<typeof handlesSchema>;

export interface QuoteData {
  postcode: string;
  distanceMiles: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  doorStyle: DoorStyle;
  doorFinish: DoorFinish;
  totalDoors: number;
  glazedDoors: number;
  glazedStyle: string | null;
  fireDoors: number;
  doubleDoorSets: number;
  bathroomLocks: number;
  handleModel: string;
  handleFinish: string;
  doorSizes?: DoorSizeEntry[];
}

export interface QuoteCalculation {
  standardDoors: number;
  standardTotal: number;
  fireTotal: number;
  glazingTotal: number;
  doubleDoorTotal: number;
  locksTotal: number;
  handleTotal: number;
  grandTotal: number;
  depositDue: number;
  estimatedDays: number;
}

// Door size options
export const IMPERIAL_DOOR_SIZES = [
  { mm: 457, inches: 18, cm: 45.7 },
  { mm: 533, inches: 21, cm: 53.3 },
  { mm: 610, inches: 24, cm: 61.0 },
  { mm: 686, inches: 27, cm: 68.6 },
  { mm: 711, inches: 28, cm: 71.1 },
  { mm: 762, inches: 30, cm: 76.2 },
  { mm: 813, inches: 32, cm: 81.3 },
  { mm: 838, inches: 33, cm: 83.8 },
] as const;

export const METRIC_DOOR_SIZES = [
  { mm: 526 },
  { mm: 626 },
  { mm: 726 },
  { mm: 826 },
  { mm: 926 },
] as const;

export const ROOM_TYPES = [
  "Lounge",
  "Kitchen",
  "Dining Room",
  "Hallway",
  "Garage",
  "Downstairs Toilet",
  "Cupboard",
  "Utility Room",
  "Bedroom 1",
  "Bedroom 2",
  "Bedroom 3",
  "Bedroom 4",
  "Bedroom 5",
  "Main Bathroom",
  "En-suite 1",
  "En-suite 2",
  "Wardrobe",
  "Office",
  "Other",
] as const;

export type RoomType = typeof ROOM_TYPES[number];

export interface DoorSizeEntry {
  room: string;
  widthMm: number;
  isFireDoor?: boolean;
  isGlazedDoor?: boolean;
  isDoubleDoor?: boolean;
  doubleDoorType?: 'french_set' | 'standard_pair';
  doubleDoorWidthMm?: number;
  isRebated?: boolean;
  wantsPairMaker?: boolean;
}

export const FRENCH_DOOR_WIDTHS = [914, 1067, 1168, 1220, 1372, 1524] as const;

export const FRENCH_DOOR_SET_PRICE = 840;
export const DOUBLE_DOOR_FITTING_CHARGE = 350;
export const RACK_BOLT_PRICE = 15;
export const PAIR_MAKER_PRICE_UNFINISHED = 33;
export const PAIR_MAKER_PRICE_PREFINISHED = 39;

export interface DoorSizesData {
  doorSizes: DoorSizeEntry[];
  isMetric: boolean;
}

export interface FittingDateData {
  selectedDate: string;
  displayDate: string;
}

export const quoteDrafts = pgTable("quote_drafts", {
  token: varchar("token").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  wizardState: jsonb("wizard_state").notNull(),
});

export type QuoteDraft = typeof quoteDrafts.$inferSelect;

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;

export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  targetStatus: text("target_status").notNull(),
  includeTags: text("include_tags").array().default([]),
  excludeTags: text("exclude_tags").array().default([]),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  sentCount: integer("sent_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  sentAt: true,
  sentCount: true,
  createdAt: true,
}).extend({
  includeTags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id"),
  quoteId: varchar("quote_id"),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  emailType: text("email_type").notNull(),
  subject: text("subject").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateKey: text("template_key").notNull().unique(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  availableVariables: text("available_variables").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;

export const galleryItems = pgTable("gallery_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caption: text("caption").notNull(),
  location: text("location"),
  beforeImagePath: text("before_image_path").notNull(),
  afterImagePath: text("after_image_path").notNull(),
  mediaType: text("media_type").default("image").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
});

export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  text: text("text").notNull(),
  starRating: integer("star_rating").notNull().default(5),
  location: text("location"),
  jobDate: text("job_date"),
  isVisible: boolean("is_visible").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
}).extend({
  starRating: z.number().int().min(1).max(5),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
