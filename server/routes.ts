import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { insertMatterSchema, insertTaskSchema, insertReferralSchema, insertDocumentSchema, insertPlaybookArticleSchema, insertPaymentSchema, insertOrganisationSchema, insertOrganisationMemberSchema, payments, organisations, organisationMembers } from "@shared/schema";
import crypto from "crypto";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as resendService from "./services/resend";
import * as twilioService from "./services/twilio";
import * as diditService from "./services/didit";
import * as appleMapsService from "./services/apple-maps";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const uniqueKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueKey}${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Accepted: PDF, JPEG, PNG, WebP, HEIC, DOC, DOCX`));
    }
  },
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

  const DEMO_MATTERS: Record<string, any> = {
    "james@buyer.com.au": {
      address: "14 Bronte Road, Bondi Junction NSW 2022",
      transactionType: "Purchase",
      settlementDate: "2026-04-15",
      status: "Active",
      milestonePercent: 25,
      pillarPreSettlement: "complete",
      pillarExchange: "in_progress",
      currentPillar: "exchange",
      contractPrice: 135000000,
      depositAmount: 15000000,
      depositPaid: true,
      coolingOffDate: new Date("2025-11-11"),
      financeDate: new Date("2025-12-20"),
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
            let demoMatter: any;
            if (existing.length === 0) {
              demoMatter = await storage.createMatter({
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
                coolingOffDate: matterConfig.coolingOffDate,
                financeDate: matterConfig.financeDate,
              });

              await storage.createTask({
                matterId: demoMatter.id,
                title: "Sign Contract of Sale",
                status: "COMPLETE",
                type: "SIGN",
                pillar: "pre_settlement",
                assignedTo: user.id,
              });
              await storage.createTask({
                matterId: demoMatter.id,
                title: "Pay deposit to trust account",
                status: "COMPLETE",
                type: "PAYMENT",
                pillar: "pre_settlement",
                assignedTo: user.id,
              });
              await storage.createTask({
                matterId: demoMatter.id,
                title: "Complete identity verification (VOI)",
                status: "TODO",
                type: "ACTION",
                pillar: "exchange",
                assignedTo: user.id,
              });
              await storage.createTask({
                matterId: demoMatter.id,
                title: "Upload proof of finance approval",
                status: "TODO",
                type: "UPLOAD",
                pillar: "exchange",
                assignedTo: user.id,
                dueDate: new Date("2026-03-01"),
              });
              await storage.createTask({
                matterId: demoMatter.id,
                title: "Review Section 32 Vendor Statement",
                status: "TODO",
                type: "REVIEW",
                pillar: "exchange",
                assignedTo: user.id,
                dueDate: new Date("2026-03-10"),
              });
            } else {
              demoMatter = existing[0];
              await storage.updateMatter(demoMatter.id, {
                contractPrice: matterConfig.contractPrice,
                depositAmount: matterConfig.depositAmount,
                coolingOffDate: matterConfig.coolingOffDate,
                financeDate: matterConfig.financeDate,
              });
            }

            const existingDocs = await storage.getDocumentsByMatter(demoMatter.id);
            if (existingDocs.length === 0) {
              await storage.createDocument({
                matterId: demoMatter.id,
                name: "Purchase Agreement.pdf",
                size: "2.4 MB",
                category: "contract",
                uploadedBy: user.id,
              });
              await storage.createDocument({
                matterId: demoMatter.id,
                name: "Pest Inspection.pdf",
                size: "1.1 MB",
                category: "inspection",
                uploadedBy: user.id,
              });
              await storage.createDocument({
                matterId: demoMatter.id,
                name: "Pool Safety.jpg",
                size: "850 KB",
                category: "compliance",
                uploadedBy: user.id,
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

  // File upload endpoint (multipart form)
  app.post("/api/documents/upload", requireAuth, (req, res) => {
    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File too large. Maximum size is 20MB." });
          }
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const { matterId, category, taskId } = req.body;
      if (!matterId) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "matterId is required" });
      }

      try {
        const matter = await storage.getMatter(matterId);
        if (!matter) {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ message: "Matter not found" });
        }

        const fileKey = req.file.filename;
        const doc = await storage.createDocument({
          matterId,
          name: req.file.originalname,
          size: formatFileSize(req.file.size),
          category: category || "document",
          uploadedBy: req.userId!,
          fileKey,
          mimeType: req.file.mimetype,
          fileUrl: `/api/documents/file/${fileKey}`,
        });

        // Auto-complete linked task if taskId provided
        if (taskId) {
          const task = await storage.updateTask(taskId, {
            status: "COMPLETE",
            taskDocumentId: doc.id,
          });
          if (task) {
            console.log(`Task ${taskId} auto-completed via document upload ${doc.id}`);
          }
        }

        res.status(201).json(doc);
      } catch (err: any) {
        if (req.file?.path) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: err.message });
      }
    });
  });

  // File download/view endpoint with ownership check
  app.get("/api/documents/file/:fileKey", requireAuth, async (req, res) => {
    try {
      const fileKey = req.params.fileKey;

      const sanitizedKey = path.basename(fileKey);
      if (sanitizedKey !== fileKey || fileKey.includes('..')) {
        return res.status(400).json({ message: "Invalid file key" });
      }

      const doc = await storage.getDocumentByFileKey(sanitizedKey);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });

      const matter = await storage.getMatter(doc.matterId);
      if (!matter) return res.status(404).json({ message: "Matter not found" });

      const hasAccess =
        user.role === 'ADMIN' ||
        user.role === 'BROKER' ||
        (user.role === 'CLIENT' && matter.clientUserId === user.id) ||
        (user.role === 'CONVEYANCER' && matter.conveyancerUserId === user.id);

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const filePath = path.join(UPLOADS_DIR, sanitizedKey);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      const ext = path.extname(sanitizedKey).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

      const contentType = mimeMap[ext] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);

      if (req.query.download === "true") {
        res.setHeader("Content-Disposition", `attachment; filename="${doc.name}"`);
      }

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(paramId(req, "id"));
      if (doc?.fileKey) {
        const filePath = path.join(UPLOADS_DIR, doc.fileKey);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
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
        const orgData = await storage.getOrganisationByUser(user.id);
        if (orgData && (orgData.member.role === "MANAGER" || orgData.member.role === "OWNER")) {
          const members = await storage.getOrganisationMembers(orgData.org.id);
          const memberIds = members.map(m => m.userId);
          const allReferrals: any[] = [];
          for (const memberId of memberIds) {
            const memberReferrals = await storage.getReferralsByBroker(memberId);
            allReferrals.push(...memberReferrals);
          }
          result = allReferrals;
        } else {
          result = await storage.getReferralsByBroker(user.id);
        }
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
      const data = { ...req.body };
      if (data.channel === "QR") {
        data.qrToken = crypto.randomBytes(16).toString("hex");
      }
      const parsed = insertReferralSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const referral = await storage.createReferral(parsed.data);
      res.status(201).json(referral);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── QR Code Public Endpoint ───
  app.get("/api/referrals/qr/:token", async (req, res) => {
    try {
      const token = paramId(req, "token");
      const referral = await storage.getReferralByQrToken(token);
      if (!referral) return res.status(404).json({ message: "Referral not found" });
      const broker = await storage.getUser(referral.brokerId);
      res.json({
        clientName: referral.clientName,
        brokerName: broker?.name || "Unknown",
        propertyAddress: referral.propertyAddress,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── SMS Referral Link ───
  app.post("/api/referrals/sms", requireAuth, async (req, res) => {
    try {
      const { clientName, clientPhone } = req.body;
      if (!clientName || !clientPhone) {
        return res.status(400).json({ message: "clientName and clientPhone are required" });
      }
      const qrToken = crypto.randomBytes(16).toString("hex");
      const referral = await storage.createReferral({
        brokerId: req.userId!,
        clientName,
        clientPhone,
        status: "Pending",
        channel: "SMS",
        qrToken,
      });
      const appUrl = process.env.VITE_APP_URL || "https://properly-app.com.au";
      const referralLink = `${appUrl}/referral/${qrToken}`;
      let smsSent = false;
      if (twilioService.isConfigured()) {
        try {
          await twilioService.sendSms({
            to: clientPhone,
            body: `G'day ${clientName}! You've been referred to Properly for your property settlement. Get started here: ${referralLink}`,
          });
          smsSent = true;
        } catch (smsErr: any) {
          console.error("SMS send failed:", smsErr.message);
        }
      }
      res.status(201).json({ referral, referralLink, smsSent });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Payments ───
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) return res.status(401).json({ message: "User not found" });
      let result;
      if (user.role === "ADMIN") {
        result = await db.select().from(payments);
      } else {
        result = await storage.getPaymentsByBroker(user.id);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const data = { ...req.body };
      data.brokerId = data.brokerId || req.userId!;
      const properlyFee = 10000;
      data.properlyFee = properlyFee;
      data.netAmount = (data.amount || 0) - properlyFee;
      const parsed = insertPaymentSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const payment = await storage.createPayment(parsed.data);
      res.status(201).json(payment);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      const payment = await storage.updatePayment(paramId(req, "id"), req.body);
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      res.json(payment);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Organisations ───
  app.get("/api/organisations/me", requireAuth, async (req, res) => {
    try {
      const orgData = await storage.getOrganisationByUser(req.userId!);
      if (!orgData) return res.status(404).json({ message: "No organisation found" });
      const members = await storage.getOrganisationMembers(orgData.org.id);
      res.json({ organisation: orgData.org, membership: orgData.member, members });
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
