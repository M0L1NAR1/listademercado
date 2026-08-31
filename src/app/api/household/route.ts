import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const envId = process.env.HOUSEHOLD_ID;

    if (envId) {
      const { data } = await admin
        .from("households")
        .select("*")
        .eq("id", envId)
        .maybeSingle();

      if (data) return NextResponse.json(data);
    }

    const { data: existing } = await admin
      .from("households")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (existing) return NextResponse.json(existing);

    const { data: created, error } = await admin
      .from("households")
      .insert({
        nome: "Nossa Casa",
        codigo_convite: "CASAL1",
        created_by: null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
