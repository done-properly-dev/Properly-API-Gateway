import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { pool } from "./db";
import { insertUserSchema, insertMatterSchema, insertTaskSchema, insertReferralSchema, insertDocumentSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "properly-dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  // ─── Auth ───
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
      }
      const existing = await storage.getUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }
      const hashed = await bcrypt.hash(parsed.data.password, 10);
      const user = await storage.createUser({ ...parsed.data, password: hashed });
      req.session.userId = user.id;
      const { password: _, ...safe } = user;
      res.status(201).json(safe);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safe } = user;
    res.json(safe);
  });

  // ─── Matters ───
  app.get("/api/matters", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
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
      const matter = await storage.getMatter(req.params.id);
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
      const matter = await storage.updateMatter(req.params.id, req.body);
      if (!matter) return res.status(404).json({ message: "Matter not found" });
      res.json(matter);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Tasks ───
  app.get("/api/matters/:matterId/tasks", requireAuth, async (req, res) => {
    try {
      const result = await storage.getTasksByMatter(req.params.matterId);
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
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Documents ───
  app.get("/api/matters/:matterId/documents", requireAuth, async (req, res) => {
    try {
      const result = await storage.getDocumentsByMatter(req.params.matterId);
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
      await storage.deleteDocument(req.params.id);
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Referrals ───
  app.get("/api/referrals", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
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
      const notification = await storage.updateNotification(req.params.id, req.body);
      if (!notification) return res.status(404).json({ message: "Notification not found" });
      res.json(notification);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  return httpServer;
}
