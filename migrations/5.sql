
CREATE TABLE daily_stock_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  record_date DATE NOT NULL,
  item_name TEXT NOT NULL,
  open_stock INTEGER NOT NULL,
  added_stock INTEGER NOT NULL,
  total_stock INTEGER NOT NULL,
  closing_stock INTEGER NOT NULL,
  price REAL NOT NULL,
  daily_sale_amount REAL NOT NULL,
  profit_margin REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_stock_user_id ON daily_stock_records(user_id);
CREATE INDEX idx_daily_stock_date ON daily_stock_records(record_date);
CREATE INDEX idx_daily_stock_user_date ON daily_stock_records(user_id, record_date);
