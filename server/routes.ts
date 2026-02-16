import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { insertMatterSchema, insertTaskSchema, insertReferralSchema, insertDocumentSchema } from "@shared/schema";

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

  return httpServer;
}
