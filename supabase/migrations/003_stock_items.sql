-- Estoque doméstico (itens comprados ficam aqui)
-- Rode após 002_no_auth_open_access.sql

CREATE TABLE IF NOT EXISTS stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_lower TEXT GENERATED ALWAYS AS (lower(nome)) STORED,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  unidade TEXT NOT NULL DEFAULT 'un',
  categoria TEXT NOT NULL DEFAULT 'outros',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, nome_lower)
);

CREATE INDEX IF NOT EXISTS idx_stock_items_household ON stock_items(household_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_qty ON stock_items(household_id, quantidade);

ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_all" ON stock_items;
CREATE POLICY "stock_all" ON stock_items FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE stock_items;
