-- Lista de Mercado - Schema inicial
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard/project/vbyoxcxvxminokenerky/sql

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Casas/famílias (casal compartilha)
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL DEFAULT 'Nossa Casa',
  codigo_convite TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Listas de compras
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT 'Lista de Mercado',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  total_gasto NUMERIC(10,2) DEFAULT 0,
  notas TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Itens da lista
CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  quantidade NUMERIC(10,2) DEFAULT 1,
  unidade TEXT DEFAULT 'un',
  categoria TEXT DEFAULT 'outros',
  preco_estimado NUMERIC(10,2),
  preco_pago NUMERIC(10,2),
  comprado BOOLEAN DEFAULT FALSE,
  comprado_por UUID REFERENCES auth.users(id),
  comprado_em TIMESTAMPTZ,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens frequentes (sugestões e histórico de preços)
CREATE TABLE IF NOT EXISTS item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nome_lower TEXT GENERATED ALWAYS AS (lower(nome)) STORED,
  categoria TEXT DEFAULT 'outros',
  preco_medio NUMERIC(10,2),
  vezes_comprado INT DEFAULT 1,
  ultima_compra TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, nome_lower)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_household ON shopping_lists(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_status ON shopping_lists(status);
CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_item_templates_household ON item_templates(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_completed ON shopping_lists(household_id, completed_at);

-- Função: gerar código de convite
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger: criar perfil ao registrar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: atualizar total da lista
CREATE OR REPLACE FUNCTION update_list_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shopping_lists
  SET total_gasto = (
    SELECT COALESCE(SUM(preco_pago), 0)
    FROM list_items
    WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
      AND comprado = TRUE
      AND preco_pago IS NOT NULL
  )
  WHERE id = COALESCE(NEW.list_id, OLD.list_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_item_price_change ON list_items;
CREATE TRIGGER on_item_price_change
  AFTER INSERT OR UPDATE OF preco_pago, comprado OR DELETE ON list_items
  FOR EACH ROW EXECUTE FUNCTION update_list_total();

-- Trigger: atualizar template de item ao comprar
CREATE OR REPLACE FUNCTION update_item_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comprado = TRUE AND (OLD IS NULL OR OLD.comprado = FALSE) THEN
    INSERT INTO item_templates (household_id, nome, categoria, preco_medio, vezes_comprado, ultima_compra)
    SELECT sl.household_id, NEW.nome, NEW.categoria,
      NEW.preco_pago,
      1,
      NOW()
    FROM shopping_lists sl
    WHERE sl.id = NEW.list_id
    ON CONFLICT (household_id, nome_lower)
    DO UPDATE SET
      preco_medio = CASE
        WHEN NEW.preco_pago IS NOT NULL THEN
          ROUND((item_templates.preco_medio * item_templates.vezes_comprado + NEW.preco_pago) / (item_templates.vezes_comprado + 1), 2)
        ELSE item_templates.preco_medio
      END,
      vezes_comprado = item_templates.vezes_comprado + 1,
      ultima_compra = NOW(),
      categoria = NEW.categoria;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_item_purchased ON list_items;
CREATE TRIGGER on_item_purchased
  AFTER UPDATE OF comprado ON list_items
  FOR EACH ROW EXECUTE FUNCTION update_item_template();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_templates ENABLE ROW LEVEL SECURITY;

-- Helper: usuário pertence ao household
CREATE OR REPLACE FUNCTION user_in_household(h_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = h_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policies: profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- Policies: households
CREATE POLICY "households_select_member" ON households FOR SELECT
  USING (user_in_household(id) OR created_by = auth.uid());
CREATE POLICY "households_insert" ON households FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "households_update_admin" ON households FOR UPDATE
  USING (user_in_household(id));

-- Policies: household_members
CREATE POLICY "members_select" ON household_members FOR SELECT
  USING (user_in_household(household_id) OR user_id = auth.uid());
CREATE POLICY "members_insert_self" ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_delete_self" ON household_members FOR DELETE
  USING (user_id = auth.uid());

-- Policies: shopping_lists
CREATE POLICY "lists_select" ON shopping_lists FOR SELECT
  USING (user_in_household(household_id));
CREATE POLICY "lists_insert" ON shopping_lists FOR INSERT
  WITH CHECK (user_in_household(household_id));
CREATE POLICY "lists_update" ON shopping_lists FOR UPDATE
  USING (user_in_household(household_id));
CREATE POLICY "lists_delete" ON shopping_lists FOR DELETE
  USING (user_in_household(household_id));

-- Policies: list_items
CREATE POLICY "items_select" ON list_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = list_id AND user_in_household(sl.household_id)
  ));
CREATE POLICY "items_insert" ON list_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = list_id AND user_in_household(sl.household_id)
  ));
CREATE POLICY "items_update" ON list_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = list_id AND user_in_household(sl.household_id)
  ));
CREATE POLICY "items_delete" ON list_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM shopping_lists sl
    WHERE sl.id = list_id AND user_in_household(sl.household_id)
  ));

-- Policies: item_templates
CREATE POLICY "templates_select" ON item_templates FOR SELECT
  USING (user_in_household(household_id));
CREATE POLICY "templates_insert" ON item_templates FOR INSERT
  WITH CHECK (user_in_household(household_id));
CREATE POLICY "templates_update" ON item_templates FOR UPDATE
  USING (user_in_household(household_id));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
