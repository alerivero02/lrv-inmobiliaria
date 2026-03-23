import { Router } from "express";
import { get, all, isPostgres } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.use(verifyToken);

// GET /api/dashboard/stats
router.get("/stats", async (_req, res) => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const today = now.toISOString().split("T")[0];
  const weekDay = new Date(now);
  weekDay.setDate(now.getDate() - now.getDay());
  const weekStr = weekDay.toISOString().split("T")[0];

  const q = async (sql, ...p) => {
    const row = await get(sql, ...p);
    return row;
  };

  const cnt = (alias = "n") =>
    isPostgres ? `COUNT(*)::int AS ${alias}` : `COUNT(*) AS ${alias}`;

  const active_listings = Number((await q(`SELECT ${cnt()} FROM listings WHERE status = 'active'`))?.n ?? 0);
  const sold_listings = Number((await q(`SELECT ${cnt()} FROM listings WHERE status = 'sold'`))?.n ?? 0);
  const total_listed = Number(
    (await q(`SELECT ${cnt()} FROM listings WHERE status NOT IN ('archived')`))?.n ?? 0,
  );

  const visits_this_month = Number(
    (
      await q(
        isPostgres
          ? `SELECT ${cnt()} FROM visits WHERE to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM') = ?`
          : `SELECT ${cnt()} FROM visits WHERE strftime('%Y-%m', created_at) = ?`,
        month,
      )
    )?.n ?? 0,
  );
  const pending_visits = Number((await q(`SELECT ${cnt()} FROM visits WHERE status = 'pending'`))?.n ?? 0);
  const confirmed_visits_today = Number(
    (
      await q(
        isPostgres
          ? `SELECT ${cnt()} FROM visits WHERE status = 'confirmed' AND created_at::date = ?::date`
          : `SELECT ${cnt()} FROM visits WHERE status = 'confirmed' AND date(created_at) = date(?)`,
        today,
      )
    )?.n ?? 0,
  );
  const confirmed_visits_this_week = Number(
    (
      await q(
        isPostgres
          ? `SELECT ${cnt()} FROM visits WHERE status = 'confirmed' AND created_at::date >= ?::date`
          : `SELECT ${cnt()} FROM visits WHERE status = 'confirmed' AND date(created_at) >= date(?)`,
        weekStr,
      )
    )?.n ?? 0,
  );

  const sumCast = isPostgres ? "DOUBLE PRECISION" : "REAL";

  const income_this_month = Number(
    (
      await q(
        `SELECT COALESCE(SUM(amount),0) AS t FROM transactions WHERE type='income'  AND date LIKE ?`,
        `${month}%`,
      )
    )?.t ?? 0,
  );
  const expense_this_month = Number(
    (
      await q(
        `SELECT COALESCE(SUM(amount),0) AS t FROM transactions WHERE type='expense' AND date LIKE ?`,
        `${month}%`,
      )
    )?.t ?? 0,
  );

  const portfolioRow = await q(`
    SELECT
      COALESCE(SUM(CAST(price AS ${sumCast})), 0) AS portfolio_value,
      COALESCE(SUM(CAST(price AS ${sumCast}) * COALESCE(commission_buyer,  3.0) / 100.0), 0) AS commission_buyer_total,
      COALESCE(SUM(CAST(price AS ${sumCast}) * COALESCE(commission_seller, 3.0) / 100.0), 0) AS commission_seller_total,
      COALESCE(AVG(CAST(price AS ${sumCast})), 0) AS avg_price,
      COUNT(*) AS count_with_price
    FROM listings
    WHERE status = 'active'
      AND price IS NOT NULL
      AND CAST(price AS ${sumCast}) > 0
  `);

  const soldPortfolioRow = await q(`
    SELECT
      COALESCE(SUM(CAST(price AS ${sumCast})), 0) AS sold_portfolio_value,
      COALESCE(SUM(CAST(price AS ${sumCast}) * COALESCE(commission_buyer,  3.0) / 100.0), 0) AS sold_commission_buyer,
      COALESCE(SUM(CAST(price AS ${sumCast}) * COALESCE(commission_seller, 3.0) / 100.0), 0) AS sold_commission_seller
    FROM listings
    WHERE status = 'sold'
      AND price IS NOT NULL
      AND CAST(price AS ${sumCast}) > 0
  `);

  const portfolio_value = portfolioRow?.portfolio_value ?? 0;
  const commission_buyer_total = portfolioRow?.commission_buyer_total ?? 0;
  const commission_seller_total = portfolioRow?.commission_seller_total ?? 0;
  const potential_margin = commission_buyer_total + commission_seller_total;
  const avg_listing_price = portfolioRow?.avg_price ?? 0;
  const listings_with_price = portfolioRow?.count_with_price ?? 0;

  const sold_portfolio_value = soldPortfolioRow?.sold_portfolio_value ?? 0;
  const sold_commission_earned =
    (soldPortfolioRow?.sold_commission_buyer ?? 0) + (soldPortfolioRow?.sold_commission_seller ?? 0);

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
router.get("/visits-by-listing", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const rows = await all(
    `
    SELECT v.listing_id, l.title AS listing_title, COUNT(v.id) AS visits_count
    FROM visits v
    LEFT JOIN listings l ON v.listing_id = l.id
    WHERE v.listing_id IS NOT NULL
    GROUP BY v.listing_id, l.title
    ORDER BY visits_count DESC
    LIMIT ?
  `,
    limit,
  );

  return res.json(rows);
});

export default router;
