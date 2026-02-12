import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  CreateItemSchema,
  UpdateItemSchema,
  CreateSaleSchema,
  CreateDailyStockRecordSchema,
  UpdateUserMetadataSchema,
  type Item,
  type Sale,
  type StockHistory,
  type SalesReport,
  type StockReport,
  type UserMetadata,
  type DailyStockRecord,
  type LoginHistory,
} from "@/shared/types";

interface User {
  id: string;
  email: string;
  google_user_data: {
    name?: string;
    picture?: string;
  };
}

type Variables = {
  user: User | null;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("/*", cors());

// ============================================================================
// Authentication Routes
// ============================================================================

app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  // Get or create user metadata
  let metadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  if (!metadata) {
    // Check if this is the first user in the system
    const userCount = (await db
      .prepare("SELECT COUNT(*) as count FROM user_metadata")
      .first()) as { count: number } | null;

    const isFirstUser = !userCount || userCount.count === 0;

    // Create user metadata - first user automatically becomes admin
    const name = user.google_user_data.name || user.email.split("@")[0];
    metadata = (await db
      .prepare(
        "INSERT INTO user_metadata (user_id, email, name, is_admin) VALUES (?, ?, ?, ?) RETURNING *"
      )
      .bind(user.id, user.email, name, isFirstUser ? 1 : 0)
      .first()) as UserMetadata;
  }

  // Record login event
  const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  const userAgent = c.req.header("user-agent") || "unknown";
  const name = metadata.name || user.google_user_data.name || user.email.split("@")[0];

  await db
    .prepare(
      "INSERT INTO login_history (user_id, email, name, login_timestamp, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      user.id,
      user.email,
      name,
      new Date().toISOString(),
      ipAddress,
      userAgent
    )
    .run();

  return c.json({ ...user, metadata });
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ============================================================================
// User Management Routes (Admin only)
// ============================================================================

app.get("/api/admin/users", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  if (!currentUserMetadata?.is_admin) {
    return c.json({ error: "Access denied" }, 403);
  }

  const results = await db
    .prepare("SELECT * FROM user_metadata ORDER BY created_at DESC")
    .all();

  return c.json(results.results as UserMetadata[]);
});

app.put("/api/admin/users/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const id = c.req.param("id");

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  if (!currentUserMetadata?.is_admin) {
    return c.json({ error: "Access denied" }, 403);
  }

  const body = await c.req.json();
  const validation = UpdateUserMetadataSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: validation.error.errors }, 400);
  }

  const data = validation.data;
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.is_admin !== undefined) {
    updates.push("is_admin = ?");
    values.push(data.is_admin ? 1 : 0);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const result = await db
    .prepare(
      `UPDATE user_metadata SET ${updates.join(", ")} WHERE id = ? RETURNING *`
    )
    .bind(...values)
    .first();

  return c.json(result as UserMetadata);
});

app.delete("/api/admin/users/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const id = c.req.param("id");

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  if (!currentUserMetadata?.is_admin) {
    return c.json({ error: "Access denied" }, 403);
  }

  await db.prepare("DELETE FROM user_metadata WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

app.get("/api/admin/login-history", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  if (!currentUserMetadata?.is_admin) {
    return c.json({ error: "Access denied" }, 403);
  }

  const results = await db
    .prepare("SELECT * FROM login_history ORDER BY login_timestamp DESC LIMIT 100")
    .all();

  return c.json(results.results as LoginHistory[]);
});

// ============================================================================
// Daily Stock Record Routes
// ============================================================================

app.get("/api/daily-stock", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  let results;
  if (currentUserMetadata?.is_admin) {
    // Admin can see all records
    results = await db
      .prepare("SELECT * FROM daily_stock_records ORDER BY record_date DESC, created_at DESC")
      .all();
  } else {
    // Regular users see only their records
    results = await db
      .prepare(
        "SELECT * FROM daily_stock_records WHERE user_id = ? ORDER BY record_date DESC, created_at DESC"
      )
      .bind(user.id)
      .all();
  }

  return c.json(results.results as DailyStockRecord[]);
});

app.post("/api/daily-stock", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const body = await c.req.json();
  const validation = CreateDailyStockRecordSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: validation.error.errors }, 400);
  }

  const data = validation.data;
  const userMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata;

  const userName = userMetadata?.name || user.google_user_data.name || user.email;

  // Calculate total stock and daily sale amount
  const totalStock = data.open_stock + data.added_stock;
  const dailySaleAmount = (totalStock - data.closing_stock) * data.price;

  const result = await db
    .prepare(
      `INSERT INTO daily_stock_records 
       (user_id, user_name, record_date, item_name, open_stock, added_stock, 
        total_stock, closing_stock, price, daily_sale_amount, profit_margin) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .bind(
      user.id,
      userName,
      data.record_date,
      data.item_name,
      data.open_stock,
      data.added_stock,
      totalStock,
      data.closing_stock,
      data.price,
      dailySaleAmount,
      data.profit_margin || null
    )
    .first();

  return c.json(result as DailyStockRecord);
});

app.get("/api/daily-stock/:date", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const date = c.req.param("date");

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const results = await db
    .prepare(
      "SELECT * FROM daily_stock_records WHERE user_id = ? AND record_date = ? ORDER BY created_at DESC"
    )
    .bind(user.id, date)
    .all();

  return c.json(results.results as DailyStockRecord[]);
});

app.delete("/api/daily-stock/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const id = c.req.param("id");

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const record = (await db
    .prepare("SELECT * FROM daily_stock_records WHERE id = ?")
    .bind(id)
    .first()) as DailyStockRecord | null;

  if (!record) {
    return c.json({ error: "Record not found" }, 404);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  // Only allow deletion if it's the user's own record or if they're an admin
  if (record.user_id !== user.id && !currentUserMetadata?.is_admin) {
    return c.json({ error: "Access denied" }, 403);
  }

  await db.prepare("DELETE FROM daily_stock_records WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

// ============================================================================
// Legacy Item Routes (Protected)
// ============================================================================

app.get("/api/items", authMiddleware, async (c) => {
  const db = c.env.DB;
  const results = await db.prepare("SELECT * FROM items ORDER BY name").all();
  return c.json(results.results as Item[]);
});

app.get("/api/items/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const result = await db
    .prepare("SELECT * FROM items WHERE id = ?")
    .bind(id)
    .first();

  if (!result) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json(result as Item);
});

app.post("/api/items", authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const validation = CreateItemSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: validation.error.errors }, 400);
  }

  const data = validation.data;
  const result = await db
    .prepare(
      "INSERT INTO items (name, quantity, price, low_stock_threshold) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .bind(data.name, data.quantity, data.price, data.low_stock_threshold)
    .first();

  const item = result as Item;
  await db
    .prepare(
      "INSERT INTO stock_history (item_id, item_name, quantity_before, quantity_after, change_amount, change_reason) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(item.id, item.name, 0, item.quantity, item.quantity, "Initial stock")
    .run();

  return c.json(item);
});

app.put("/api/items/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const validation = UpdateItemSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: validation.error.errors }, 400);
  }

  const currentItem = (await db
    .prepare("SELECT * FROM items WHERE id = ?")
    .bind(id)
    .first()) as Item | null;

  if (!currentItem) {
    return c.json({ error: "Item not found" }, 404);
  }

  const data = validation.data;
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.quantity !== undefined) {
    updates.push("quantity = ?");
    values.push(data.quantity);
  }
  if (data.price !== undefined) {
    updates.push("price = ?");
    values.push(data.price);
  }
  if (data.low_stock_threshold !== undefined) {
    updates.push("low_stock_threshold = ?");
    values.push(data.low_stock_threshold);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const result = await db
    .prepare(`UPDATE items SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first();

  const updatedItem = result as Item;

  if (data.quantity !== undefined && data.quantity !== currentItem.quantity) {
    await db
      .prepare(
        "INSERT INTO stock_history (item_id, item_name, quantity_before, quantity_after, change_amount, change_reason) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        updatedItem.id,
        updatedItem.name,
        currentItem.quantity,
        updatedItem.quantity,
        updatedItem.quantity - currentItem.quantity,
        "Manual adjustment"
      )
      .run();
  }

  return c.json(updatedItem);
});

app.delete("/api/items/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  const item = (await db
    .prepare("SELECT * FROM items WHERE id = ?")
    .bind(id)
    .first()) as Item | null;

  if (!item) {
    return c.json({ error: "Item not found" }, 404);
  }

  await db.prepare("DELETE FROM items WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

// ============================================================================
// Legacy Sales Routes (Protected)
// ============================================================================

app.get("/api/sales", authMiddleware, async (c) => {
  const db = c.env.DB;
  const results = await db
    .prepare("SELECT * FROM sales ORDER BY sale_date DESC")
    .all();
  return c.json(results.results as Sale[]);
});

app.post("/api/sales", authMiddleware, async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const validation = CreateSaleSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: validation.error.errors }, 400);
  }

  const data = validation.data;

  const item = (await db
    .prepare("SELECT * FROM items WHERE id = ?")
    .bind(data.item_id)
    .first()) as Item | null;

  if (!item) {
    return c.json({ error: "Item not found" }, 404);
  }

  if (item.quantity < data.quantity_sold) {
    return c.json({ error: "Insufficient stock" }, 400);
  }

  const total_price = item.price * data.quantity_sold;
  const sale_date = new Date().toISOString();

  const sale = (await db
    .prepare(
      "INSERT INTO sales (item_id, item_name, quantity_sold, unit_price, total_price, payment_method, sale_date) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(
      data.item_id,
      item.name,
      data.quantity_sold,
      item.price,
      total_price,
      data.payment_method,
      sale_date
    )
    .first()) as Sale;

  const new_quantity = item.quantity - data.quantity_sold;
  await db
    .prepare("UPDATE items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(new_quantity, data.item_id)
    .run();

  await db
    .prepare(
      "INSERT INTO stock_history (item_id, item_name, quantity_before, quantity_after, change_amount, change_reason) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(
      item.id,
      item.name,
      item.quantity,
      new_quantity,
      -data.quantity_sold,
      `Sale #${sale.id}`
    )
    .run();

  return c.json(sale);
});

// ============================================================================
// Legacy Report Routes (Protected)
// ============================================================================

app.get("/api/reports/sales", authMiddleware, async (c) => {
  const db = c.env.DB;
  const sales = (await db
    .prepare("SELECT * FROM sales ORDER BY sale_date DESC")
    .all()).results as Sale[];

  const total_revenue = sales.reduce((sum, sale) => sum + sale.total_price, 0);
  const mpesa_sales = sales.filter((s) => s.payment_method === "Mpesa");
  const cash_sales = sales.filter((s) => s.payment_method === "Cash");

  const report: SalesReport = {
    total_sales: sales.length,
    total_revenue,
    sales_by_payment_method: {
      Mpesa: mpesa_sales.reduce((sum, sale) => sum + sale.total_price, 0),
      Cash: cash_sales.reduce((sum, sale) => sum + sale.total_price, 0),
    },
    sales,
  };

  return c.json(report);
});

app.get("/api/reports/stock", authMiddleware, async (c) => {
  const db = c.env.DB;
  const items = (await db.prepare("SELECT * FROM items ORDER BY name").all())
    .results as Item[];

  const itemsWithHistory = await Promise.all(
    items.map(async (item) => {
      const history = (
        await db
          .prepare(
            "SELECT * FROM stock_history WHERE item_id = ? ORDER BY created_at DESC"
          )
          .bind(item.id)
          .all()
      ).results as StockHistory[];

      return {
        ...item,
        stock_changes: history,
      };
    })
  );

  const report: StockReport = {
    items: itemsWithHistory,
  };

  return c.json(report);
});

app.get("/api/items/:id/history", authMiddleware, async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  const results = await db
    .prepare(
      "SELECT * FROM stock_history WHERE item_id = ? ORDER BY created_at DESC"
    )
    .bind(id)
    .all();

  return c.json(results.results as StockHistory[]);
});

// ============================================================================
// Project Download Route (Admin only)
// ============================================================================

app.get("/api/admin/project-files", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  if (!currentUserMetadata?.is_admin) {
    return c.json({ error: "Access denied" }, 403);
  }

  // List of project files to include in the download
  const projectFiles = [
    'eslint.config.js',
    'index.html',
    'package.json',
    'postcss.config.js',
    'tailwind.config.js',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'tsconfig.worker.json',
    'vite.config.ts',
    'wrangler.json',
    'src/react-app/App.tsx',
    'src/react-app/main.tsx',
    'src/react-app/index.css',
    'src/react-app/vite-env.d.ts',
    'src/react-app/components/DashboardLayout.tsx',
    'src/react-app/components/ItemFormModal.tsx',
    'src/react-app/components/ProtectedRoute.tsx',
    'src/react-app/components/SaleFormModal.tsx',
    'src/react-app/hooks/useItems.ts',
    'src/react-app/hooks/useSales.ts',
    'src/react-app/pages/Admin.tsx',
    'src/react-app/pages/AuthCallback.tsx',
    'src/react-app/pages/DailyStock.tsx',
    'src/react-app/pages/Home.tsx',
    'src/react-app/pages/Inventory.tsx',
    'src/react-app/pages/Login.tsx',
    'src/react-app/pages/Reports.tsx',
    'src/react-app/pages/Sales.tsx',
    'src/shared/types.ts',
    'src/worker/index.ts',
  ];

  return c.json({ files: projectFiles });
});

app.post("/api/admin/project-files/content", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  if (!user) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const currentUserMetadata = (await db
    .prepare("SELECT * FROM user_metadata WHERE user_id = ?")
    .bind(user.id)
    .first()) as UserMetadata | null;

  if (!currentUserMetadata?.is_admin) {
    return c.json({ error: "Access denied" }, 403);
  }

  // Note: In Cloudflare Workers, we don't have access to source files at runtime.
  // This endpoint would need to be implemented differently in a production environment.
  // For now, return a placeholder that explains the limitation.

  return c.json({
    error: "File content access not available in worker environment",
    message: "To download the complete project, please use the Mocha platform's export feature or contact support."
  }, 501);
});

export default app;
