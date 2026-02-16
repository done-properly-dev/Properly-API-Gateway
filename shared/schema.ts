import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  phone: text("phone"),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  voiStatus: text("voi_status").notNull().default("not_started"),
  voiMethod: text("voi_method"),
  voiSessionId: text("voi_session_id"),
  dateOfBirth: text("date_of_birth"),
  address: text("address"),
  state: text("state"),
  postcode: text("postcode"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const FIVE_PILLARS = [
  "pre_settlement",
  "exchange",
  "conditions",
  "pre_completion",
  "settlement",
] as const;

export type PillarKey = (typeof FIVE_PILLARS)[number];

export const matters = pgTable("matters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull(),
  clientUserId: varchar("client_user_id").notNull().references(() => users.id),
  conveyancerUserId: varchar("conveyancer_user_id").references(() => users.id),
  brokerId: varchar("broker_id").references(() => users.id),
  status: text("status").notNull().default("Draft"),
  milestonePercent: integer("milestone_percent").notNull().default(0),
  transactionType: text("transaction_type").notNull(),
  settlementDate: timestamp("settlement_date"),
  lastActive: timestamp("last_active").defaultNow(),
  pillarPreSettlement: text("pillar_pre_settlement").notNull().default("not_started"),
  pillarExchange: text("pillar_exchange").notNull().default("not_started"),
  pillarConditions: text("pillar_conditions").notNull().default("not_started"),
  pillarPreCompletion: text("pillar_pre_completion").notNull().default("not_started"),
  pillarSettlement: text("pillar_settlement").notNull().default("not_started"),
  currentPillar: text("current_pillar").notNull().default("pre_settlement"),
  contractPrice: integer("contract_price"),
  depositAmount: integer("deposit_amount"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  coolingOffDate: timestamp("cooling_off_date"),
  financeDate: timestamp("finance_date"),
  buildingPestDate: timestamp("building_pest_date"),
  smokeballMatterId: text("smokeball_matter_id"),
  pexaWorkspaceId: text("pexa_workspace_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMatterSchema = createInsertSchema(matters).omit({
  id: true,
  createdAt: true,
});
export type InsertMatter = z.infer<typeof insertMatterSchema>;
export type Matter = typeof matters.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matterId: varchar("matter_id").notNull().references(() => matters.id),
  title: text("title").notNull(),
  status: text("status").notNull(),
  dueDate: timestamp("due_date"),
  type: text("type").notNull(),
  pillar: text("pillar"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  description: text("description"),
  taskDocumentId: varchar("task_document_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matterId: varchar("matter_id").notNull().references(() => matters.id),
  name: text("name").notNull(),
  size: text("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  locked: boolean("locked").notNull().default(false),
  category: text("category"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  fileKey: text("file_key").unique(),
  mimeType: text("mime_type"),
  fileUrl: text("file_url"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brokerId: varchar("broker_id").notNull().references(() => users.id),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  notes: text("notes"),
  status: text("status").notNull(),
  commission: integer("commission").notNull().default(0),
  propertyAddress: text("property_address"),
  transactionType: text("transaction_type"),
  channel: text("channel").notNull().default("PORTAL"),
  qrToken: text("qr_token").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateName: text("template_name").notNull(),
  channel: text("channel").notNull(),
  active: boolean("active").notNull().default(true),
  recipientUserId: varchar("recipient_user_id").references(() => users.id),
  matterId: varchar("matter_id").references(() => matters.id),
  subject: text("subject"),
  body: text("body"),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().default("pending"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  channel: text("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  trigger: text("trigger").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({
  id: true,
  createdAt: true,
});
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;

export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => notificationTemplates.id),
  recipientUserId: varchar("recipient_user_id").references(() => users.id),
  matterId: varchar("matter_id").references(() => matters.id),
  channel: text("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type NotificationLog = typeof notificationLogs.$inferSelect;

export const playbookArticles = pgTable("playbook_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  pillar: text("pillar"),
  readTimeMinutes: integer("read_time_minutes").notNull().default(3),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlaybookArticleSchema = createInsertSchema(playbookArticles).omit({
  id: true,
  createdAt: true,
});
export type InsertPlaybookArticle = z.infer<typeof insertPlaybookArticleSchema>;
export type PlaybookArticle = typeof playbookArticles.$inferSelect;

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matterId: varchar("matter_id").references(() => matters.id),
  referralId: varchar("referral_id").references(() => referrals.id),
  brokerId: varchar("broker_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  properlyFee: integer("properly_fee").notNull().default(10000),
  netAmount: integer("net_amount").notNull(),
  status: text("status").notNull().default("pending"),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const organisations = pgTable("organisations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrganisationSchema = createInsertSchema(organisations).omit({
  id: true,
  createdAt: true,
});
export type InsertOrganisation = z.infer<typeof insertOrganisationSchema>;
export type Organisation = typeof organisations.$inferSelect;

export const organisationMembers = pgTable("organisation_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organisations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("MEMBER"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrganisationMemberSchema = createInsertSchema(organisationMembers).omit({
  id: true,
  createdAt: true,
});
export type InsertOrganisationMember = z.infer<typeof insertOrganisationMemberSchema>;
export type OrganisationMember = typeof organisationMembers.$inferSelect;
