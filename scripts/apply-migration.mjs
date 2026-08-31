import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const databaseUrl = process.env.DATABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const projectRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  const migrationFiles = [
    "001_initial_schema.sql",
    "002_no_auth_open_access.sql",
    "003_stock_items.sql",
  ];

function buildDatabaseUrl() {
  if (databaseUrl) return databaseUrl;
  if (!dbPassword || !projectRef) return null;

  const region = process.env.SUPABASE_DB_REGION ?? "sa-east-1";
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
}

async function verifyKeys() {
  if (!url || !publishableKey) {
    throw new Error("Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY");
  }

  const supabase = createClient(url, publishableKey);
  const { error } = await supabase.from("households").select("id").limit(1);

  if (error?.code === "PGRST205") {
    console.log("✓ Chaves API válidas (tabelas ainda não existem)");
    return false;
  }

  if (error) {
    throw new Error(`Erro ao verificar API: ${error.message}`);
  }

  console.log("✓ Schema já aplicado");
  return true;
}

async function applyMigration() {
  const conn = buildDatabaseUrl();
  if (!conn) {
    console.log("\n⚠ Para aplicar a migration automaticamente, adicione no .env.local:");
    console.log("   SUPABASE_DB_PASSWORD=sua_senha_do_banco");
    console.log("   (Supabase Dashboard → Settings → Database → Database password)");
    console.log("\n   Ou cole a connection string completa em DATABASE_URL");
    return false;
  }

  const db = postgres(conn, { max: 1, ssl: "require" });

  try {
    for (const file of migrationFiles) {
      console.log(`→ Aplicando ${file}...`);
      const sql = readFileSync(
        resolve(__dirname, `../supabase/migrations/${file}`),
        "utf8"
      );

      const statements = sql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("--"));

      for (const statement of statements) {
        if (!statement) continue;
        try {
          await db.unsafe(statement);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (
            msg.includes("already exists") ||
            msg.includes("duplicate key") ||
            msg.includes("is already member of publication") ||
            msg.includes("does not exist")
          ) {
            console.log(`  ↷ Ignorado: ${msg.slice(0, 80)}...`);
            continue;
          }
          throw err;
        }
      }
    }

    console.log("✓ Migrations aplicadas com sucesso!");
    return true;
  } finally {
    await db.end();
  }
}

async function verifyAfter() {
  if (!url || !publishableKey) return;
  const supabase = createClient(url, publishableKey);
  const { error } = await supabase.from("households").select("id").limit(1);
  if (!error) {
    console.log("✓ Tabela households acessível via API");
  } else {
    console.log("✗ Verificação falhou:", error.message);
  }
}

async function main() {
  const exists = await verifyKeys();
  if (exists) return;

  if (secretKey) {
    console.log("✓ Secret key configurada");
  }

  const applied = await applyMigration();
  if (applied) await verifyAfter();
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
