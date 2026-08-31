-- Acesso aberto sem login (app privado para o casal)
-- Rode após 001_initial_schema.sql

ALTER TABLE households ALTER COLUMN created_by DROP NOT NULL;

-- Remover policies antigas baseadas em auth
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "households_select_member" ON households;
DROP POLICY IF EXISTS "households_insert" ON households;
DROP POLICY IF EXISTS "households_update_admin" ON households;
DROP POLICY IF EXISTS "members_select" ON household_members;
DROP POLICY IF EXISTS "members_insert_self" ON household_members;
DROP POLICY IF EXISTS "members_delete_self" ON household_members;
DROP POLICY IF EXISTS "lists_select" ON shopping_lists;
DROP POLICY IF EXISTS "lists_insert" ON shopping_lists;
DROP POLICY IF EXISTS "lists_update" ON shopping_lists;
DROP POLICY IF EXISTS "lists_delete" ON shopping_lists;
DROP POLICY IF EXISTS "items_select" ON list_items;
DROP POLICY IF EXISTS "items_insert" ON list_items;
DROP POLICY IF EXISTS "items_update" ON list_items;
DROP POLICY IF EXISTS "items_delete" ON list_items;
DROP POLICY IF EXISTS "templates_select" ON item_templates;
DROP POLICY IF EXISTS "templates_insert" ON item_templates;
DROP POLICY IF EXISTS "templates_update" ON item_templates;

-- Policies abertas (app privado, URL só vocês conhecem)
CREATE POLICY "households_all" ON households FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "lists_all" ON shopping_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "items_all" ON list_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "templates_all" ON item_templates FOR ALL USING (true) WITH CHECK (true);

-- Desabilitar trigger de perfil (sem cadastro)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
