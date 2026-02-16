import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { insertMatterSchema, insertTaskSchema, insertReferralSchema, insertDocumentSchema, insertPlaybookArticleSchema } from "@shared/schema";
import { z } from "zod";

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
    "mike@broker.com.au": { name: "Mike Thompson", role: "BROKER" },
    "admin@legaleagles.com.au": { name: "Legal Eagles", role: "CONVEYANCER" },
    "admin@properly.com.au": { name: "Admin", role: "ADMIN" },
  };

  const DEMO_SUPABASE_EMAIL_MAP: Record<string, string> = {
    "sarah@example.com": "demo-buyer@properly-app.com.au",
    "mike@broker.com.au": "demo-broker@properly-app.com.au",
    "admin@legaleagles.com.au": "demo-conveyancer@properly-app.com.au",
    "admin@properly.com.au": "demo-admin@properly-app.com.au",
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

      if (!signInError && signInData.session) {
        let user = await storage.getUser(signInData.user.id);
        if (!user) {
          user = await storage.createUser({
            id: signInData.user.id,
            email,
            password: "supabase-managed",
            name: demo.name,
            role: demo.role,
          });
        }
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
        await storage.createUser({
          id: signUpData.user!.id,
          email,
          password: "supabase-managed",
          name: demo.name,
          role: demo.role,
        });
        return res.json({ session: signUpData.session });
      }

      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ 
        email: supabaseEmail, 
        password: demoPassword 
      });
      if (retryError) {
        return res.status(400).json({ message: retryError.message });
      }

      let user = await storage.getUser(retryData.user.id);
      if (!user) {
        user = await storage.createUser({
          id: retryData.user.id,
          email,
          password: "supabase-managed",
          name: demo.name,
          role: demo.role,
        });
      }
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
      const user = await storage.updateUser(req.userId!, parsed.data);
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

  return httpServer;
}
