import z from "zod";

// Item schemas
export const ItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number().int(),
  price: z.number(),
  low_stock_threshold: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  price: z.number().min(0, "Price must be non-negative"),
  low_stock_threshold: z.number().int().min(0).default(10),
});

export const UpdateItemSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
});

// Sale schemas
export const SaleSchema = z.object({
  id: z.number(),
  item_id: z.number(),
  item_name: z.string(),
  quantity_sold: z.number().int(),
  unit_price: z.number(),
  total_price: z.number(),
  payment_method: z.enum(["Mpesa", "Cash"]),
  sale_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateSaleSchema = z.object({
  item_id: z.number().int().positive("Item ID is required"),
  quantity_sold: z.number().int().positive("Quantity must be positive"),
  payment_method: z.enum(["Mpesa", "Cash"]),
});

// Stock history schemas
export const StockHistorySchema = z.object({
  id: z.number(),
  item_id: z.number(),
  item_name: z.string(),
  quantity_before: z.number().int(),
  quantity_after: z.number().int(),
  change_amount: z.number().int(),
  change_reason: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// User metadata schemas
export const UserMetadataSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  is_admin: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UpdateUserMetadataSchema = z.object({
  name: z.string().optional(),
  is_admin: z.boolean().optional(),
});

// Login history schemas
export const LoginHistorySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  login_timestamp: z.string(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Daily stock record schemas
export const DailyStockRecordSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  user_name: z.string(),
  record_date: z.string(),
  item_name: z.string(),
  open_stock: z.number().int(),
  added_stock: z.number().int(),
  total_stock: z.number().int(),
  closing_stock: z.number().int(),
  price: z.number(),
  daily_sale_amount: z.number(),
  profit_margin: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateDailyStockRecordSchema = z.object({
  record_date: z.string(),
  item_name: z.string().min(1, "Item name is required"),
  open_stock: z.number().int().min(0, "Open stock must be non-negative"),
  added_stock: z.number().int().min(0, "Added stock must be non-negative"),
  closing_stock: z.number().int().min(0, "Closing stock must be non-negative"),
  price: z.number().min(0, "Price must be non-negative"),
  profit_margin: z.number().nullable().optional(),
});

// Types
export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;
export type UpdateItem = z.infer<typeof UpdateItemSchema>;
export type Sale = z.infer<typeof SaleSchema>;
export type CreateSale = z.infer<typeof CreateSaleSchema>;
export type StockHistory = z.infer<typeof StockHistorySchema>;
export type UserMetadata = z.infer<typeof UserMetadataSchema>;
export type UpdateUserMetadata = z.infer<typeof UpdateUserMetadataSchema>;
export type DailyStockRecord = z.infer<typeof DailyStockRecordSchema>;
export type CreateDailyStockRecord = z.infer<typeof CreateDailyStockRecordSchema>;
export type LoginHistory = z.infer<typeof LoginHistorySchema>;

// Report types
export type SalesReport = {
  total_sales: number;
  total_revenue: number;
  sales_by_payment_method: {
    Mpesa: number;
    Cash: number;
  };
  sales: Sale[];
};

export type StockReport = {
  items: (Item & { stock_changes: StockHistory[] })[];
};
