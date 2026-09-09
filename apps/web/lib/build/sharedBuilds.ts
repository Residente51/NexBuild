import { parseBuildSelection } from "@/lib/components/validation";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { BuildSelection } from "@/types/component";

export interface SharedBuild {
  build: BuildSelection;
  createdAt: string | null;
}

/** Shared UUID links remain server-only reads and never select owner identity. */
export async function readSharedBuild(id: string): Promise<SharedBuild | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("saved_builds")
      .select("build_data, created_at")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    const build = parseBuildSelection(data.build_data);
    return build ? { build, createdAt: data.created_at } : null;
  } catch (error) {
    console.error("Unable to load shared build:", error);
    return null;
  }
}
