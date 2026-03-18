import { Router } from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

// GET /api/dashboard/stats
router.get("/stats", (_req, res) => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const today = now.toISOString().split("T")[0];
  const weekDay = new Date(now);
  weekDay.setDate(now.getDate() - now.getDay());
  const weekStr = weekDay.toISOString().split("T")[0];

  const q = (sql, ...p) => db.prepare(sql).get(...p);

  const active_listings = q("SELECT COUNT(*) n FROM listings WHERE status = 'active'").n;
  const sold_listings = q("SELECT COUNT(*) n FROM listings WHERE status = 'sold'").n;
  const total_listed = q("SELECT COUNT(*) n FROM listings WHERE status NOT IN ('archived')").n;

  const visits_this_month = q(
    "SELECT COUNT(*) n FROM visits WHERE created_at LIKE ?",
    `${month}%`,
  ).n;
  const pending_visits = q("SELECT COUNT(*) n FROM visits WHERE status = 'pending'").n;
  const confirmed_visits_today = q(
    "SELECT COUNT(*) n FROM visits WHERE status = 'confirmed' AND created_at LIKE ?",
    `${today}%`,
  ).n;
  const confirmed_visits_this_week = q(
    "SELECT COUNT(*) n FROM visits WHERE status = 'confirmed' AND date(created_at) >= ?",
    weekStr,
  ).n;

  const income_this_month = q(
    "SELECT COALESCE(SUM(amount),0) t FROM transactions WHERE type='income'  AND date LIKE ?",
    `${month}%`,
  ).t;
  const expense_this_month = q(
    "SELECT COALESCE(SUM(amount),0) t FROM transactions WHERE type='expense' AND date LIKE ?",
    `${month}%`,
  ).t;

  // ── Métricas financieras del portfolio ──────────────────────────────
  // CAST(price AS REAL) garantiza aritmética numérica aunque el valor
  // esté almacenado como TEXT en registros legacy.
  // COALESCE en comisiones cubre filas anteriores a la migración de columnas.
  const portfolioRow = q(`
    SELECT
      COALESCE(SUM(CAST(price AS REAL)), 0)                                                         AS portfolio_value,
      COALESCE(SUM(CAST(price AS REAL) * COALESCE(commission_buyer,  3.0) / 100.0), 0)              AS commission_buyer_total,
      COALESCE(SUM(CAST(price AS REAL) * COALESCE(commission_seller, 3.0) / 100.0), 0)              AS commission_seller_total,
      COALESCE(AVG(CAST(price AS REAL)), 0)                                                         AS avg_price,
      COUNT(*)                                                                                       AS count_with_price
    FROM listings
    WHERE status = 'active'
      AND price IS NOT NULL
      AND CAST(price AS REAL) > 0
  `);

  const soldPortfolioRow = q(`
    SELECT
      COALESCE(SUM(CAST(price AS REAL)), 0)                                                         AS sold_portfolio_value,
      COALESCE(SUM(CAST(price AS REAL) * COALESCE(commission_buyer,  3.0) / 100.0), 0)              AS sold_commission_buyer,
      COALESCE(SUM(CAST(price AS REAL) * COALESCE(commission_seller, 3.0) / 100.0), 0)              AS sold_commission_seller
    FROM listings
    WHERE status = 'sold'
      AND price IS NOT NULL
      AND CAST(price AS REAL) > 0
  `);

  const portfolio_value = portfolioRow.portfolio_value;
  const commission_buyer_total = portfolioRow.commission_buyer_total;
  const commission_seller_total = portfolioRow.commission_seller_total;
  const potential_margin = commission_buyer_total + commission_seller_total;
  const avg_listing_price = portfolioRow.avg_price;
  const listings_with_price = portfolioRow.count_with_price;

  const sold_portfolio_value = soldPortfolioRow.sold_portfolio_value;
  const sold_commission_earned =
    soldPortfolioRow.sold_commission_buyer + soldPortfolioRow.sold_commission_seller;

  return res.json({
    active_listings,
    sold_listings,
    visits_this_month,
    pending_visits,
    confirmed_visits_today,
    confirmed_visits_this_week,
    income_this_month,
    expense_this_month,
    balance_this_month: income_this_month - expense_this_month,
    conversion_rate: total_listed > 0 ? Math.round((sold_listings / total_listed) * 100) : 0,
    // Portfolio financiero
    portfolio_value,
    commission_buyer_total,
    commission_seller_total,
    potential_margin,
    avg_listing_price,
    listings_with_price,
    sold_portfolio_value,
    sold_commission_earned,
  });
});

// GET /api/dashboard/visits-by-listing
router.get("/visits-by-listing", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const rows = db
    .prepare(`
    SELECT v.listing_id, l.title AS listing_title, COUNT(v.id) AS visits_count
    FROM visits v
    LEFT JOIN listings l ON v.listing_id = l.id
    WHERE v.listing_id IS NOT NULL
    GROUP BY v.listing_id
    ORDER BY visits_count DESC
    LIMIT ?
  `)
    .all(limit);

  return res.json(rows);
});

export default router;
