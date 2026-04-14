import { Router } from "express";
import { get, isPostgres } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

// GET /api/notifications/counts
router.get("/counts", async (_req, res) => {
  const zeros = { pending_visits: 0, pending_listings: 0, total: 0 };
  try {
    const cnt = isPostgres ? "COUNT(*)::int AS n" : "COUNT(*) AS n";
    const rowVisits = await get(`SELECT ${cnt} FROM visits WHERE status = 'pending'`);
    const rowListings = await get(`SELECT ${cnt} FROM listings WHERE status = 'pending_review'`);
    const pending_visits = rowVisits?.n ?? 0;
    const pending_listings = rowListings?.n ?? 0;
    return res.json({ pending_visits, pending_listings, total: pending_visits + pending_listings });
  } catch (err) {
    console.error("[notifications/counts]", err);
    return res.json(zeros);
  }
});

export default router;
