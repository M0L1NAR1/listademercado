import { NextResponse } from "next/server";
import { mapOffProduct } from "@/lib/product-search";
import type { ProductSuggestion } from "@/lib/product-types";

const OFF_SEARCH_URL =
  "https://world.openfoodfacts.org/cgi/search.pl";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return NextResponse.json({ products: [] });
  }

  try {
    const params = new URLSearchParams({
      search_terms: q,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "10",
      tagtype_0: "countries",
      tag_contains_0: "contains",
      tag_0: "brazil",
      fields: "product_name,categories_tags",
      lc: "pt",
    });

    const res = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      headers: {
        "User-Agent": "ListaDeMercado/1.0 (contato@lista-mercado.app)",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ products: [] });
    }

    const data = (await res.json()) as {
      products?: { product_name?: string; categories_tags?: string[] }[];
    };

    const products: ProductSuggestion[] = (data.products ?? [])
      .filter((p) => p.product_name?.trim())
      .map((p) => ({
        ...mapOffProduct(p.product_name!, p.categories_tags ?? []),
        source: "openfoodfacts" as const,
      }));

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
