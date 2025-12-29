
CREATE TABLE stock_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_history_item_id ON stock_history(item_id);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at);
