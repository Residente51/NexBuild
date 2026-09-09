"use server";

import {
  deleteOwnedBuild as deleteOwnedBuildRecord,
  duplicateOwnedBuild as duplicateOwnedBuildRecord,
  listOwnedBuilds as listOwnedBuildRecords,
  readOwnedBuild as readOwnedBuildRecord,
  renameOwnedBuild as renameOwnedBuildRecord,
} from "@/lib/build/savedBuilds";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const AUTHENTICATION_ERROR = "Debes iniciar sesión para administrar tus configuraciones.";

async function getOwnerContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { supabase, user };
}

export async function listOwnedBuilds() {
  const context = await getOwnerContext();
  if (!context) return { success: false as const, error: AUTHENTICATION_ERROR };
  return listOwnedBuildRecords(context.supabase);
}

export async function readOwnedBuild(id: string) {
  const context = await getOwnerContext();
  if (!context) return { success: false as const, error: AUTHENTICATION_ERROR };
  return readOwnedBuildRecord(context.supabase, id);
}

export async function renameOwnedBuild(id: string, name: string) {
  const context = await getOwnerContext();
  if (!context) return { success: false as const, error: AUTHENTICATION_ERROR };
  return renameOwnedBuildRecord(context.supabase, id, name);
}

export async function duplicateOwnedBuild(id: string) {
  const context = await getOwnerContext();
  if (!context) return { success: false as const, error: AUTHENTICATION_ERROR };
  return duplicateOwnedBuildRecord(
    context.supabase,
    createSupabaseAdminClient(),
    id,
    context.user.id,
  );
}

export async function deleteOwnedBuild(id: string) {
  const context = await getOwnerContext();
  if (!context) return { success: false as const, error: AUTHENTICATION_ERROR };
  return deleteOwnedBuildRecord(context.supabase, id);
}
