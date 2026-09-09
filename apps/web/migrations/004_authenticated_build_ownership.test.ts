import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("./004_authenticated_build_ownership.sql", import.meta.url),
  "utf8",
);
const rollback = readFileSync(
  new URL("./rollback/004_remove_authenticated_build_ownership.sql", import.meta.url),
  "utf8",
);

describe("authenticated build ownership migration", () => {
  it("keeps anonymous rows nullable and cascades only authenticated ownership", () => {
    expect(migration).toContain("WHERE user_id IS NOT NULL");
    expect(migration).toContain(
      "FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE",
    );
    expect(migration).not.toMatch(/UPDATE public\.saved_builds\s+SET user_id/i);
  });

  it("keeps owner access while restricting canonical writes to the server", () => {
    expect(migration).toContain("FOR SELECT TO authenticated");
    expect(migration).not.toContain("FOR INSERT TO authenticated");
    expect(migration).toContain("FOR UPDATE TO authenticated");
    expect(migration).toContain("FOR DELETE TO authenticated");
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(4);
    expect(migration).toContain("REVOKE ALL ON public.saved_builds FROM anon");
    expect(migration).toContain(
      "REVOKE ALL ON public.saved_builds FROM authenticated",
    );
    expect(migration).toContain(
      "GRANT SELECT, DELETE ON public.saved_builds TO authenticated",
    );
    expect(migration).toContain(
      "GRANT UPDATE (name) ON public.saved_builds TO authenticated",
    );
    expect(migration).not.toMatch(/GRANT[^;]*\bINSERT\b[^;]*TO authenticated/i);
    expect(migration).not.toMatch(/GRANT UPDATE ON public\.saved_builds/i);
    expect(migration).not.toMatch(/GRANT .*saved_builds TO anon/i);
  });

  it("replaces the user foreign key without assuming its generated name", () => {
    expect(migration).toContain("FROM pg_constraint AS constraint_row");
    expect(migration).toContain("column_row.attname = 'user_id'");
    expect(migration).toContain("constraint_row.confrelid = 'auth.users'::regclass");
    expect(migration).not.toContain(
      "DROP CONSTRAINT IF EXISTS saved_builds_user_id_fkey",
    );
  });

  it("prevents ownership reassignment and maintains updated_at", () => {
    expect(migration).toContain("OLD.user_id IS DISTINCT FROM NEW.user_id");
    expect(migration).toContain("BEFORE UPDATE OF user_id");
    expect(migration).toContain("SET updated_at = created_at");
    expect(migration).toContain("BEFORE UPDATE ON public.saved_builds");
  });

  it("has a data-preserving rollback", () => {
    expect(rollback).toContain("ON DELETE SET NULL");
    expect(rollback).not.toMatch(/DROP TABLE|DELETE FROM|TRUNCATE/i);
  });
});
