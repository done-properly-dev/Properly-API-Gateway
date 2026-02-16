import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { insertMatterSchema, insertTaskSchema, insertReferralSchema, insertDocumentSchema, insertPlaybookArticleSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import * as resendService from "./services/resend";
import * as twilioService from "./services/twilio";
import * as diditService from "./services/didit";
import * as appleMapsService from "./services/apple-maps";

const onboardingUpdateSchema = z.object({
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  voiMethod: z.string().optional(),
  voiStatus: z.string().optional(),
  onboardingStep: z.number().optional(),
  onboardingComplete: z.boolean().optional(),
}).strict();

function paramId(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      supabaseToken?: string;
    }
  }
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const token = authHeader.slice(7);
  const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

  if (error || !authUser) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.userId = authUser.id;
  req.supabaseToken = token;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.slice(7);
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    let user = await storage.getUser(authUser.id);

    if (!user) {
      const metadata = authUser.user_metadata || {};
      user = await storage.createUser({
        id: authUser.id,
        email: authUser.email || "",
        password: "supabase-managed",
        name: metadata.name || authUser.email?.split("@")[0] || "User",
        role: metadata.role || "CLIENT",
      });
    }

    const { password: _, ...safe } = user;
    res.json(safe);
  });

  app.post("/api/auth/profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.slice(7);
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { name, role } = req.body;

    let user = await storage.getUser(authUser.id);
    if (user) {
      user = await storage.updateUser(authUser.id, { name, role });
    } else {
      user = await storage.createUser({
        id: authUser.id,
        email: authUser.email || "",
        password: "supabase-managed",
        name: name || authUser.email?.split("@")[0] || "User",
        role: role || "CLIENT",
      });
    }

    if (!user) return res.status(500).json({ message: "Failed to create profile" });
    const { password: _, ...safe } = user;
    res.json(safe);
  });

  // ─── Demo Login ───
  const DEMO_ACCOUNTS: Record<string, { name: string; role: string }> = {
    "sarah@example.com": { name: "Sarah Johnson", role: "CLIENT" },
    "james@buyer.com.au": { name: "James Mitchell", role: "CLIENT" },
    "mike@broker.com.au": { name: "Mike Thompson", role: "BROKER" },
    "admin@legaleagles.com.au": { name: "Legal Eagles", role: "CONVEYANCER" },
    "admin@properly.com.au": { name: "Admin", role: "ADMIN" },
  };

  const DEMO_SUPABASE_EMAIL_MAP: Record<string, string> = {
    "sarah@example.com": "demo-buyer@properly-app.com.au",
    "james@buyer.com.au": "demo-buyer2@properly-app.com.au",
    "mike@broker.com.au": "demo-broker@properly-app.com.au",
    "admin@legaleagles.com.au": "demo-conveyancer@properly-app.com.au",
    "admin@properly.com.au": "demo-admin@properly-app.com.au",
  };

  const DEMO_MIDWAY_CONFIG: Record<string, { onboardingStep: number; onboardingComplete: boolean; phone: string; address: string; state: string; postcode: string; voiStatus: string }> = {
    "james@buyer.com.au": {
      onboardingStep: 2,
      onboardingComplete: false,
      phone: "0412 345 678",
      address: "42 Wallaby Way, Sydney",
      state: "NSW",
      postcode: "2000",
      voiStatus: "not_started",
    },
  };

  const DEMO_MATTERS: Record<string, { address: string; transactionType: string; settlementDate: string; status: string; milestonePercent: number; pillarPreSettlement: string; pillarExchange: string; currentPillar: string; contractPrice: number; depositAmount: number; depositPaid: boolean }> = {
    "james@buyer.com.au": {
      address: "14 Bronte Road, Bondi Junction NSW 2022",
      transactionType: "Purchase",
      settlementDate: "2026-04-15",
      status: "Active",
      milestonePercent: 25,
      pillarPreSettlement: "complete",
      pillarExchange: "in_progress",
      currentPillar: "exchange",
      contractPrice: 1250000,
      depositAmount: 125000,
      depositPaid: true,
    },
  };

  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const demo = DEMO_ACCOUNTS[email];
      if (!demo) {
        return res.status(400).json({ message: "Not a demo account" });
      }

      const supabaseEmail = DEMO_SUPABASE_EMAIL_MAP[email] || email;
      const demoPassword = "DemoPass123!";

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
        email: supabaseEmail, 
        password: demoPassword 
      });

      const ensureLocalUser = async (supabaseUserId: string) => {
        let user = await storage.getUser(supabaseUserId);

        if (!user) {
          const existingByEmail = await storage.getUserByEmail(email);
          if (existingByEmail && existingByEmail.id !== supabaseUserId) {
            const oldId = existingByEmail.id;
            try {
              await db.execute(sql`UPDATE matters SET client_user_id = ${supabaseUserId} WHERE client_user_id = ${oldId}`);
              await db.execute(sql`UPDATE matters SET conveyancer_user_id = ${supabaseUserId} WHERE conveyancer_user_id = ${oldId}`);
              await db.execute(sql`UPDATE referrals SET broker_id = ${supabaseUserId} WHERE broker_id = ${oldId}`);
              await db.execute(sql`UPDATE notifications SET user_id = ${supabaseUserId} WHERE user_id = ${oldId}`);
              await db.execute(sql`UPDATE users SET id = ${supabaseUserId} WHERE id = ${oldId}`);
              user = await storage.getUser(supabaseUserId);
            } catch (e) {
              console.error("Failed to migrate user ID:", e);
            }
          }

          if (!user) {
            try {
              user = await storage.createUser({
                id: supabaseUserId,
                email,
                password: "supabase-managed",
                name: demo.name,
                role: demo.role,
              });
            } catch {
              user = await storage.getUserByEmail(email) || undefined;
            }
          }
        }

        if (user) {
          const midway = DEMO_MIDWAY_CONFIG[email];
          if (midway) {
            user = await storage.updateUser(user.id, midway) || user;
          }

          const matterConfig = DEMO_MATTERS[email];
          if (matterConfig && demo.role === 'CLIENT') {
            const existing = await storage.getMattersByClient(user.id);
            if (existing.length === 0) {
              const matter = await storage.createMatter({
                address: matterConfig.address,
                clientUserId: user.id,
                transactionType: matterConfig.transactionType,
                status: matterConfig.status,
                milestonePercent: matterConfig.milestonePercent,
                pillarPreSettlement: matterConfig.pillarPreSettlement,
                pillarExchange: matterConfig.pillarExchange,
                currentPillar: matterConfig.currentPillar,
                contractPrice: matterConfig.contractPrice,
                depositAmount: matterConfig.depositAmount,
                depositPaid: matterConfig.depositPaid,
                settlementDate: new Date(matterConfig.settlementDate),
              });

              await storage.createTask({
                matterId: matter.id,
                title: "Sign Contract of Sale",
                status: "COMPLETE",
                type: "SIGN",
                pillar: "pre_settlement",
                assignedTo: user.id,
              });
              await storage.createTask({
                matterId: matter.id,
                title: "Pay deposit to trust account",
                status: "COMPLETE",
                type: "PAYMENT",
                pillar: "pre_settlement",
                assignedTo: user.id,
              });
              await storage.createTask({
                matterId: matter.id,
                title: "Complete identity verification (VOI)",
                status: "TODO",
                type: "ACTION",
                pillar: "exchange",
                assignedTo: user.id,
              });
              await storage.createTask({
                matterId: matter.id,
                title: "Upload proof of finance approval",
                status: "TODO",
                type: "UPLOAD",
                pillar: "exchange",
                assignedTo: user.id,
                dueDate: new Date("2026-03-01"),
              });
              await storage.createTask({
                matterId: matter.id,
                title: "Review Section 32 Vendor Statement",
                status: "TODO",
                type: "REVIEW",
                pillar: "exchange",
                assignedTo: user.id,
                dueDate: new Date("2026-03-10"),
              });
            }
          }
        }

        return user;
      };

      if (!signInError && signInData.session) {
        await ensureLocalUser(signInData.user.id);
        return res.json({ session: signInData.session });
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: supabaseEmail,
        password: demoPassword,
        options: { data: { name: demo.name, role: demo.role } },
      });

      if (signUpError) {
        return res.status(400).json({ message: signUpError.message });
      }

      if (signUpData.session) {
        await ensureLocalUser(signUpData.user!.id);
        return res.json({ session: signUpData.session });
      }

      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ 
        email: supabaseEmail, 
        password: demoPassword 
      });
      if (retryError) {
        return res.status(400).json({ message: retryError.message });
      }

      await ensureLocalUser(retryData.user.id);
      return res.json({ session: retryData.session });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Matters ───
  app.get("/api/matters", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });

      let result;
      if (user.role === "CLIENT") {
        result = await storage.getMattersByClient(user.id);
      } else if (user.role === "CONVEYANCER") {
        result = await storage.getMattersByConveyancer(user.id);
      } else {
        result = await storage.getAllMatters();
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/matters/:id", requireAuth, async (req, res) => {
    try {
      const matter = await storage.getMatter(paramId(req, "id"));
      if (!matter) return res.status(404).json({ message: "Matter not found" });
      res.json(matter);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/matters", requireAuth, async (req, res) => {
    try {
      const parsed = insertMatterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const matter = await storage.createMatter(parsed.data);
      res.status(201).json(matter);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/matters/:id", requireAuth, async (req, res) => {
    try {
      const matter = await storage.updateMatter(paramId(req, "id"), req.body);
      if (!matter) return res.status(404).json({ message: "Matter not found" });
      res.json(matter);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Tasks ───
  app.get("/api/matters/:matterId/tasks", requireAuth, async (req, res) => {
    try {
      const result = await storage.getTasksByMatter(paramId(req, "matterId"));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const parsed = insertTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const task = await storage.createTask(parsed.data);
      res.status(201).json(task);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.updateTask(paramId(req, "id"), req.body);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Documents ───
  app.get("/api/matters/:matterId/documents", requireAuth, async (req, res) => {
    try {
      const result = await storage.getDocumentsByMatter(paramId(req, "matterId"));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/documents", requireAuth, async (req, res) => {
    try {
      const parsed = insertDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const doc = await storage.createDocument(parsed.data);
      res.status(201).json(doc);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteDocument(paramId(req, "id"));
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Referrals ───
  app.get("/api/referrals", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });

      let result;
      if (user.role === "BROKER") {
        result = await storage.getReferralsByBroker(user.id);
      } else {
        result = await storage.getAllReferrals();
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/referrals", requireAuth, async (req, res) => {
    try {
      const parsed = insertReferralSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const referral = await storage.createReferral(parsed.data);
      res.status(201).json(referral);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Notifications (Admin) ───
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const result = await storage.getNotifications();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const notification = await storage.updateNotification(paramId(req, "id"), req.body);
      if (!notification) return res.status(404).json({ message: "Notification not found" });
      res.json(notification);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Onboarding ───
  app.patch("/api/auth/onboarding", requireAuth, async (req, res) => {
    try {
      const parsed = onboardingUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const updates = { ...parsed.data };
      if (updates.voiStatus === 'verified') {
        delete updates.voiStatus;
      }
      const user = await storage.updateUser(req.userId!, updates);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Playbook Articles ───
  app.get("/api/playbook", async (req, res) => {
    try {
      const { category, pillar } = req.query;
      let result;
      if (typeof category === "string") {
        result = await storage.getPlaybookArticlesByCategory(category);
      } else if (typeof pillar === "string") {
        result = await storage.getPlaybookArticlesByPillar(pillar);
      } else {
        result = await storage.getPlaybookArticles();
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/playbook/:slug", async (req, res) => {
    try {
      const article = await storage.getPlaybookArticleBySlug(paramId(req, "slug"));
      if (!article) return res.status(404).json({ message: "Article not found" });
      res.json(article);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Service Status ───
  app.get("/api/services/status", requireAuth, async (req, res) => {
    res.json({
      resend: resendService.isConfigured(),
      twilio: twilioService.isConfigured(),
      didit: diditService.isConfigured(),
      appleMaps: appleMapsService.isConfigured(),
    });
  });

  // ─── Email (Resend) — Admin only for arbitrary sends ───
  app.post("/api/email/send", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Only admins can send arbitrary emails" });
      }
      if (!resendService.isConfigured()) {
        return res.status(503).json({ message: "Email service not configured. Add RESEND_API_KEY." });
      }
      const schema = z.object({ to: z.string().email(), subject: z.string().min(1), html: z.string().min(1), text: z.string().optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const result = await resendService.sendEmail(parsed.data);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/email/welcome", requireAuth, async (req, res) => {
    try {
      if (!resendService.isConfigured()) {
        return res.status(503).json({ message: "Email service not configured" });
      }
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      const result = await resendService.sendWelcomeEmail(user.email, user.name);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── SMS (Twilio) — Scoped to authenticated user's own phone ───
  app.post("/api/sms/send", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Only admins can send arbitrary SMS" });
      }
      if (!twilioService.isConfigured()) {
        return res.status(503).json({ message: "SMS service not configured. Add Twilio credentials." });
      }
      const schema = z.object({ to: z.string().min(8), body: z.string().min(1).max(1600) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const result = await twilioService.sendSms(parsed.data);
      res.json({ sid: result.sid, status: result.status });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/sms/verification-code", requireAuth, async (req, res) => {
    try {
      if (!twilioService.isConfigured()) {
        return res.status(503).json({ message: "SMS service not configured" });
      }
      const user = await storage.getUser(req.userId!);
      if (!user || !user.phone) {
        return res.status(400).json({ message: "No phone number on file. Update your profile first." });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const result = await twilioService.sendVerificationCode(user.phone, code);
      res.json({ sid: result.sid, status: result.status, codeLength: 6 });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── In-App Chat (Twilio-backed, in-memory for MVP) ───
  app.get("/api/chat/:matterId", requireAuth, async (req, res) => {
    const messages = twilioService.getChatMessages(paramId(req, "matterId"));
    res.json(messages);
  });

  app.post("/api/chat/:matterId", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      const { body } = req.body;
      const message = twilioService.addChatMessage(
        paramId(req, "matterId"),
        user.id,
        user.name,
        body
      );
      res.json(message);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Identity Verification (Didit v3) ───
  app.post("/api/verification/start", requireAuth, async (req, res) => {
    try {
      if (!diditService.isConfigured()) {
        return res.status(503).json({ message: "Identity verification service not configured. Add DIDIT_API_KEY." });
      }
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });

      const appUrl = process.env.VITE_APP_URL || `${req.protocol}://${req.get('host')}`;
      const callbackUrl = `${appUrl}/client/onboarding?voi=complete`;

      const session = await diditService.createVerificationSession(
        req.userId!,
        callbackUrl,
        { email: user.email, name: user.name, phone: user.phone || undefined }
      );

      await storage.updateUser(req.userId!, {
        voiStatus: 'pending',
        voiSessionId: session.sessionId,
      });

      res.json(session);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/verification/status/:sessionId", requireAuth, async (req, res) => {
    try {
      if (!diditService.isConfigured()) {
        return res.status(503).json({ message: "Identity verification service not configured" });
      }
      const user = await storage.getUser(req.userId!);
      if (!user || user.voiSessionId !== req.params.sessionId) {
        return res.status(403).json({ message: "Not authorised to view this session" });
      }
      const result = await diditService.getVerificationStatus(req.params.sessionId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/verification/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['x-signature-v2'] as string;
      const timestamp = req.headers['x-timestamp'] as string;
      const body = typeof req.body === 'string' ? req.body : req.body.toString();

      if (signature && timestamp) {
        if (!diditService.verifyWebhookSignature(body, signature, timestamp)) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      } else {
        const callbackSecret = process.env.DIDIT_CALLBACK_SECRET;
        if (callbackSecret) {
          const providedSecret = req.headers['x-didit-secret'] || req.query.secret;
          if (providedSecret !== callbackSecret) {
            return res.status(403).json({ message: "Invalid callback secret" });
          }
        }
      }

      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : JSON.parse(req.body.toString());
      const { session_id, status, vendor_data } = payload;

      if (vendor_data && (status === 'Approved' || status === 'approved')) {
        const user = await storage.getUser(vendor_data);
        if (user) {
          await storage.updateUser(vendor_data, { voiStatus: 'verified' });
        }
      } else if (vendor_data && (status === 'Declined' || status === 'declined')) {
        const user = await storage.getUser(vendor_data);
        if (user) {
          await storage.updateUser(vendor_data, { voiStatus: 'failed' });
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Apple Maps Token ───
  app.get("/api/maps/token", requireAuth, async (req, res) => {
    try {
      if (!appleMapsService.isConfigured()) {
        return res.status(503).json({ message: "Apple Maps not configured. Add Apple Maps credentials." });
      }
      const token = appleMapsService.generateMapToken();
      res.json({ token });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
