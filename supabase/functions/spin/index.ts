import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Ambil hadiah aktif
  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .eq("status", "active")
    .gt("quantity", 0);

  if (!prizes || prizes.length === 0) {
    return Response.json({ error: "No prizes" }, { status: 400 });
  }

  // Hitung total weight
  const total = prizes.reduce(
    (s, p) => s + p.quantity,
    0
  );

  let rand = Math.random() * total;
  let selected = null;

  for (const p of prizes) {
    rand -= p.quantity;
    if (rand <= 0) {
      selected = p;
      break;
    }
  }

  if (!selected) selected = prizes[0];

  // Kurangi stok
  await supabase
    .from("prizes")
    .update({ quantity: selected.quantity - 1 })
    .eq("id", selected.id);

  return Response.json({
    id: selected.id,
    name: selected.name,
  });
});