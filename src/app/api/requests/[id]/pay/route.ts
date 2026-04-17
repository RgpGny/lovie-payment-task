import { type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { authenticateForTransition, runTransition } from "@/lib/transitions";

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { error, actor } = await authenticateForTransition(supabase);
  if (error) return error;
  return runTransition(supabase, id, "pay", actor);
}
