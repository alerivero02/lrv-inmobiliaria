import { Router } from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

// GET /api/notifications/counts
router.get("/counts", (_req, res) => {
  const pending_visits = db
    .prepare("SELECT COUNT(*) n FROM visits WHERE status = 'pendiente'")
    .get().n;
  const pending_listings = db
    .prepare("SELECT COUNT(*) n FROM listings WHERE status = 'pending_review'")
    .get().n;
  return res.json({ pending_visits, pending_listings, total: pending_visits + pending_listings });
});

export default router;
