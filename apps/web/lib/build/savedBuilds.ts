import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateBuildPrice } from "@/lib/build/totals";
import { parseBuildSelection } from "@/lib/components/validation";
import type { BuildSelection } from "@/types/component";

type SavedBuildClient = Pick<SupabaseClient, "from">;

export interface OwnedBuildSummary {
  id: string;
  name: string | null;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnedBuild extends OwnedBuildSummary {
  build: BuildSelection;
}

export type SavedBuildResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isBuildId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function normalizeBuildName(
  value: unknown,
): SavedBuildResult<string> {
  if (typeof value !== "string") {
    return { success: false, error: "El nombre de la configuración no es válido." };
  }

  const name = value.trim();
  if (name.length === 0) {
    return { success: false, error: "El nombre de la configuración es obligatorio." };
  }
  if ([...name].length > 80) {
    return { success: false, error: "El nombre puede tener hasta 80 caracteres." };
  }
  if (CONTROL_CHARACTER_PATTERN.test(name)) {
    return { success: false, error: "El nombre contiene caracteres no permitidos." };
  }

  return { success: true, data: name };
}

function parseNullableName(value: unknown): string | null | undefined {
  if (value === null) return null;
  const result = normalizeBuildName(value);
  return result.success ? result.data : undefined;
}

function parseSummary(value: unknown): OwnedBuildSummary | null {
  if (!isRecord(value)) return null;
  const name = parseNullableName(value.name);
  if (
    !isBuildId(value.id) ||
    name === undefined ||
    typeof value.total_price !== "number" ||
    !Number.isSafeInteger(value.total_price) ||
    value.total_price < 0 ||
    !isTimestamp(value.created_at) ||
    !isTimestamp(value.updated_at)
  ) {
    return null;
  }

  return {
    id: value.id,
    name,
    totalPrice: value.total_price,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function parseOwnedBuild(value: unknown): OwnedBuild | null {
  const summary = parseSummary(value);
  if (!summary || !isRecord(value)) return null;
  const build = parseBuildSelection(value.build_data);
  return build ? { ...summary, build } : null;
}

/** List only rows visible to the authenticated request under owner RLS. */
export async function listOwnedBuilds(
  supabase: SavedBuildClient,
): Promise<SavedBuildResult<OwnedBuildSummary[]>> {
  const { data, error } = await supabase
    .from("saved_builds")
    .select("id, name, total_price, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return { success: false, error: "No pudimos cargar tus configuraciones." };
  }

  const builds = data.map(parseSummary);
  if (builds.some((build) => build === null)) {
    return { success: false, error: "Una configuración guardada tiene datos inválidos." };
  }

  return { success: true, data: builds as OwnedBuildSummary[] };
}

/** Read one exact build through the authenticated owner's RLS visibility. */
export async function readOwnedBuild(
  supabase: SavedBuildClient,
  id: unknown,
): Promise<SavedBuildResult<OwnedBuild | null>> {
  if (!isBuildId(id)) return { success: true, data: null };

  const { data, error } = await supabase
    .from("saved_builds")
    .select("id, name, build_data, total_price, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { success: false, error: "No pudimos cargar la configuración." };
  }
  if (!data) return { success: true, data: null };

  const build = parseOwnedBuild(data);
  return build
    ? { success: true, data: build }
    : { success: false, error: "La configuración guardada tiene datos inválidos." };
}

export async function renameOwnedBuild(
  supabase: SavedBuildClient,
  id: unknown,
  value: unknown,
): Promise<SavedBuildResult<{ id: string; name: string }>> {
  if (!isBuildId(id)) {
    return { success: false, error: "La configuración no existe." };
  }
  const normalized = normalizeBuildName(value);
  if (!normalized.success) return normalized;

  const { data, error } = await supabase
    .from("saved_builds")
    .update({ name: normalized.data })
    .eq("id", id)
    .select("id, name")
    .maybeSingle();

  if (error) {
    return { success: false, error: "No pudimos renombrar la configuración." };
  }
  if (!data || !isBuildId(data.id) || data.name !== normalized.data) {
    return { success: false, error: "La configuración no existe." };
  }

  return { success: true, data: { id: data.id, name: data.name } };
}

/** Duplicate only a stored snapshot selected through owner-visible RLS data. */
export async function duplicateOwnedBuild(
  supabase: SavedBuildClient,
  id: unknown,
  ownerId: string,
): Promise<SavedBuildResult<{ id: string }>> {
  if (!isBuildId(id) || !isBuildId(ownerId)) {
    return { success: false, error: "La configuración no existe." };
  }

  const source = await readOwnedBuild(supabase, id);
  if (!source.success) return source;
  if (!source.data) {
    return { success: false, error: "La configuración no existe." };
  }

  const { data, error } = await supabase
    .from("saved_builds")
    .insert({
      user_id: ownerId,
      name: source.data.name,
      build_data: source.data.build,
      total_price: calculateBuildPrice(source.data.build),
    })
    .select("id")
    .single();

  if (error || !data || !isBuildId(data.id)) {
    return { success: false, error: "No pudimos duplicar la configuración." };
  }

  return { success: true, data: { id: data.id } };
}

export async function deleteOwnedBuild(
  supabase: SavedBuildClient,
  id: unknown,
): Promise<SavedBuildResult<{ id: string }>> {
  if (!isBuildId(id)) {
    return { success: false, error: "La configuración no existe." };
  }

  const { data, error } = await supabase
    .from("saved_builds")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: "No pudimos eliminar la configuración." };
  }
  if (!data || !isBuildId(data.id)) {
    return { success: false, error: "La configuración no existe." };
  }

  return { success: true, data: { id: data.id } };
}
