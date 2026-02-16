import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users, matters, tasks, documents, referrals, notifications, playbookArticles,
  type User, type InsertUser,
  type Matter, type InsertMatter,
  type Task, type InsertTask,
  type Document, type InsertDocument,
  type Referral, type InsertReferral,
  type Notification, type InsertNotification,
  type PlaybookArticle, type InsertPlaybookArticle,
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

  getNotifications(): Promise<Notification[]>;
  updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined>;

  getPlaybookArticles(): Promise<PlaybookArticle[]>;
  getPlaybookArticleBySlug(slug: string): Promise<PlaybookArticle | undefined>;
  getPlaybookArticlesByCategory(category: string): Promise<PlaybookArticle[]>;
  getPlaybookArticlesByPillar(pillar: string): Promise<PlaybookArticle[]>;
  createPlaybookArticle(article: InsertPlaybookArticle): Promise<PlaybookArticle>;
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

  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications);
  }

  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return notification;
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
}

export const storage = new DatabaseStorage();
