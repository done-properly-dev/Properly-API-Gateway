import { eq, inArray, desc, and, gt } from "drizzle-orm";
import { db } from "./db";
import {
  users, matters, tasks, documents, referrals, notifications, playbookArticles,
  payments, organisations, organisationMembers, notificationTemplates, notificationLogs,
  otpCodes,
  type User, type InsertUser,
  type Matter, type InsertMatter,
  type Task, type InsertTask,
  type Document, type InsertDocument,
  type Referral, type InsertReferral,
  type Notification, type InsertNotification,
  type PlaybookArticle, type InsertPlaybookArticle,
  type Payment, type InsertPayment,
  type Organisation, type InsertOrganisation,
  type OrganisationMember, type InsertOrganisationMember,
  type NotificationTemplate, type InsertNotificationTemplate,
  type NotificationLog, type InsertNotificationLog,
  type OtpCode, type InsertOtpCode,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { id?: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getMattersByClient(clientUserId: string): Promise<Matter[]>;
  getMattersByConveyancer(conveyancerUserId: string): Promise<Matter[]>;
  getAllMatters(): Promise<Matter[]>;
  getMatter(id: string): Promise<Matter | undefined>;
  createMatter(matter: InsertMatter): Promise<Matter>;
  updateMatter(id: string, data: Partial<Matter>): Promise<Matter | undefined>;

  getTasksByMatter(matterId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | undefined>;

  getDocumentsByMatter(matterId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentByFileKey(fileKey: string): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;

  getReferralsByBroker(brokerId: string): Promise<Referral[]>;
  getAllReferrals(): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralByQrToken(qrToken: string): Promise<Referral | undefined>;
  updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined>;

  getPaymentsByBroker(brokerId: string): Promise<Payment[]>;
  getPaymentByMatter(matterId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<Payment>): Promise<Payment | undefined>;

  getOrganisation(id: string): Promise<Organisation | undefined>;
  createOrganisation(org: InsertOrganisation): Promise<Organisation>;
  getOrganisationMembers(orgId: string): Promise<OrganisationMember[]>;
  getOrganisationByUser(userId: string): Promise<{org: Organisation, member: OrganisationMember} | undefined>;
  createOrganisationMember(member: InsertOrganisationMember): Promise<OrganisationMember>;

  getNotifications(): Promise<Notification[]>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined>;

  getMatterBySmokeballId(smokeballMatterId: string): Promise<Matter | undefined>;
  getMatterByPexaId(pexaWorkspaceId: string): Promise<Matter | undefined>;

  getNotificationTemplates(): Promise<NotificationTemplate[]>;
  getNotificationTemplate(id: string): Promise<NotificationTemplate | undefined>;
  createNotificationTemplate(template: InsertNotificationTemplate): Promise<NotificationTemplate>;
  updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate | undefined>;
  deleteNotificationTemplate(id: string): Promise<void>;

  getNotificationLogs(): Promise<NotificationLog[]>;
  getNotificationLogsByMatter(matterId: string): Promise<NotificationLog[]>;
  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  updateNotificationLog(id: string, data: Partial<NotificationLog>): Promise<NotificationLog | undefined>;

  getPlaybookArticles(): Promise<PlaybookArticle[]>;
  getPlaybookArticleBySlug(slug: string): Promise<PlaybookArticle | undefined>;
  getPlaybookArticlesByCategory(category: string): Promise<PlaybookArticle[]>;
  getPlaybookArticlesByPillar(pillar: string): Promise<PlaybookArticle[]>;
  createPlaybookArticle(article: InsertPlaybookArticle): Promise<PlaybookArticle>;

  createOtpCode(data: InsertOtpCode): Promise<OtpCode>;
  getLatestOtpForUser(userId: string): Promise<OtpCode | undefined>;
  markOtpVerified(otpId: string): Promise<void>;
  enableTwoFactor(userId: string): Promise<void>;
  isTwoFactorEnabled(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: InsertUser & { id?: string }): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getMattersByClient(clientUserId: string): Promise<Matter[]> {
    return db.select().from(matters).where(eq(matters.clientUserId, clientUserId));
  }

  async getMattersByConveyancer(conveyancerUserId: string): Promise<Matter[]> {
    return db.select().from(matters).where(eq(matters.conveyancerUserId, conveyancerUserId));
  }

  async getAllMatters(): Promise<Matter[]> {
    return db.select().from(matters);
  }

  async getMatter(id: string): Promise<Matter | undefined> {
    const [matter] = await db.select().from(matters).where(eq(matters.id, id));
    return matter;
  }

  async createMatter(data: InsertMatter): Promise<Matter> {
    const [matter] = await db.insert(matters).values(data).returning();
    return matter;
  }

  async updateMatter(id: string, data: Partial<Matter>): Promise<Matter | undefined> {
    const [matter] = await db.update(matters).set(data).where(eq(matters.id, id)).returning();
    return matter;
  }

  async getTasksByMatter(matterId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.matterId, matterId));
  }

  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return task;
  }

  async getDocumentsByMatter(matterId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.matterId, matterId));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentByFileKey(fileKey: string): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.fileKey, fileKey));
    return doc;
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [doc] = await db.insert(documents).values(data).returning();
    return doc;
  }

  async updateDocument(id: string, data: Partial<Document>): Promise<Document | undefined> {
    const [doc] = await db.update(documents).set(data).where(eq(documents.id, id)).returning();
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getReferralsByBroker(brokerId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.brokerId, brokerId));
  }

  async getAllReferrals(): Promise<Referral[]> {
    return db.select().from(referrals);
  }

  async createReferral(data: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(data).returning();
    return referral;
  }

  async getReferralByQrToken(qrToken: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.qrToken, qrToken));
    return referral;
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined> {
    const [referral] = await db.update(referrals).set(data).where(eq(referrals.id, id)).returning();
    return referral;
  }

  async getPaymentsByBroker(brokerId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.brokerId, brokerId));
  }

  async getPaymentByMatter(matterId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.matterId, matterId));
    return payment;
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return payment;
  }

  async getOrganisation(id: string): Promise<Organisation | undefined> {
    const [org] = await db.select().from(organisations).where(eq(organisations.id, id));
    return org;
  }

  async createOrganisation(data: InsertOrganisation): Promise<Organisation> {
    const [org] = await db.insert(organisations).values(data).returning();
    return org;
  }

  async getOrganisationMembers(orgId: string): Promise<OrganisationMember[]> {
    return db.select().from(organisationMembers).where(eq(organisationMembers.orgId, orgId));
  }

  async getOrganisationByUser(userId: string): Promise<{org: Organisation, member: OrganisationMember} | undefined> {
    const [membership] = await db.select().from(organisationMembers).where(eq(organisationMembers.userId, userId));
    if (!membership) return undefined;
    const [org] = await db.select().from(organisations).where(eq(organisations.id, membership.orgId));
    if (!org) return undefined;
    return { org, member: membership };
  }

  async createOrganisationMember(data: InsertOrganisationMember): Promise<OrganisationMember> {
    const [member] = await db.insert(organisationMembers).values(data).returning();
    return member;
  }

  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.recipientUserId, userId));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return notification;
  }

  async getMatterBySmokeballId(smokeballMatterId: string): Promise<Matter | undefined> {
    const [matter] = await db.select().from(matters).where(eq(matters.smokeballMatterId, smokeballMatterId));
    return matter;
  }

  async getMatterByPexaId(pexaWorkspaceId: string): Promise<Matter | undefined> {
    const [matter] = await db.select().from(matters).where(eq(matters.pexaWorkspaceId, pexaWorkspaceId));
    return matter;
  }

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    return db.select().from(notificationTemplates);
  }

  async getNotificationTemplate(id: string): Promise<NotificationTemplate | undefined> {
    const [template] = await db.select().from(notificationTemplates).where(eq(notificationTemplates.id, id));
    return template;
  }

  async createNotificationTemplate(data: InsertNotificationTemplate): Promise<NotificationTemplate> {
    const [template] = await db.insert(notificationTemplates).values(data).returning();
    return template;
  }

  async updateNotificationTemplate(id: string, data: Partial<NotificationTemplate>): Promise<NotificationTemplate | undefined> {
    const [template] = await db.update(notificationTemplates).set(data).where(eq(notificationTemplates.id, id)).returning();
    return template;
  }

  async deleteNotificationTemplate(id: string): Promise<void> {
    await db.delete(notificationTemplates).where(eq(notificationTemplates.id, id));
  }

  async getNotificationLogs(): Promise<NotificationLog[]> {
    return db.select().from(notificationLogs).orderBy(desc(notificationLogs.createdAt));
  }

  async getNotificationLogsByMatter(matterId: string): Promise<NotificationLog[]> {
    return db.select().from(notificationLogs).where(eq(notificationLogs.matterId, matterId)).orderBy(desc(notificationLogs.createdAt));
  }

  async createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog> {
    const [log] = await db.insert(notificationLogs).values(data).returning();
    return log;
  }

  async updateNotificationLog(id: string, data: Partial<NotificationLog>): Promise<NotificationLog | undefined> {
    const [log] = await db.update(notificationLogs).set(data).where(eq(notificationLogs.id, id)).returning();
    return log;
  }

  async getPlaybookArticles(): Promise<PlaybookArticle[]> {
    return db.select().from(playbookArticles).where(eq(playbookArticles.published, true));
  }

  async getPlaybookArticleBySlug(slug: string): Promise<PlaybookArticle | undefined> {
    const [article] = await db.select().from(playbookArticles).where(eq(playbookArticles.slug, slug));
    return article;
  }

  async getPlaybookArticlesByCategory(category: string): Promise<PlaybookArticle[]> {
    return db.select().from(playbookArticles).where(eq(playbookArticles.category, category));
  }

  async getPlaybookArticlesByPillar(pillar: string): Promise<PlaybookArticle[]> {
    return db.select().from(playbookArticles).where(eq(playbookArticles.pillar, pillar));
  }

  async createPlaybookArticle(data: InsertPlaybookArticle): Promise<PlaybookArticle> {
    const [article] = await db.insert(playbookArticles).values(data).returning();
    return article;
  }

  async createOtpCode(data: InsertOtpCode): Promise<OtpCode> {
    const [otp] = await db.insert(otpCodes).values(data).returning();
    return otp;
  }

  async getLatestOtpForUser(userId: string): Promise<OtpCode | undefined> {
    const [otp] = await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.verified, false),
        gt(otpCodes.expiresAt, new Date())
      )
    ).orderBy(desc(otpCodes.createdAt)).limit(1);
    return otp;
  }

  async markOtpVerified(otpId: string): Promise<void> {
    await db.update(otpCodes).set({ verified: true }).where(eq(otpCodes.id, otpId));
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, userId));
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const [user] = await db.select({ twoFactorEnabled: users.twoFactorEnabled }).from(users).where(eq(users.id, userId));
    return user?.twoFactorEnabled ?? false;
  }
}

export const storage = new DatabaseStorage();
