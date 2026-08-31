import { readFileSync } from "fs";
import { resolve } from "path";
import { NextResponse } from "next/server";
import postgres from "postgres";

export async function POST(request: Request) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const databaseUrl =
    process.env.DATABASE_URL ??
    (process.env.SUPABASE_DB_PASSWORD && process.env.SUPABASE_URL
      ? buildDatabaseUrl(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_DB_PASSWORD
        )
      : null);

  if (!databaseUrl) {
    return NextResponse.json(
      {
        error:
          "Defina DATABASE_URL ou SUPABASE_DB_PASSWORD nas variáveis de ambiente",
      },
      { status: 500 }
    );
  }

  const migrationFiles = [
    "001_initial_schema.sql",
    "002_no_auth_open_access.sql",
    "003_stock_items.sql",
  ];

  const db = postgres(databaseUrl, { max: 1, ssl: "require" });

  try {
    for (const file of migrationFiles) {
      const sql = readFileSync(
        resolve(process.cwd(), `supabase/migrations/${file}`),
        "utf8"
      );
      await db.unsafe(sql);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await db.end();
  }
}

function buildDatabaseUrl(supabaseUrl: string, password: string) {
  const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) return null;
  const region = process.env.SUPABASE_DB_REGION ?? "sa-east-1";
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
}
