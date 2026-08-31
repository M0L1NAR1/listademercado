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

    const { data: existing, error: selectError } = await admin
      .from("households")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1);

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing?.[0]) return NextResponse.json(existing[0]);

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
      // Concorrência: outra requisição criou a casa primeiro
      if (error.code === "23505") {
        const { data: retry } = await admin
          .from("households")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1);

        if (retry?.[0]) return NextResponse.json(retry[0]);
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
