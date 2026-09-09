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

  it("removes every legacy policy before creating only owner policies", () => {
    expect(migration).toContain("FROM pg_catalog.pg_policies AS policy_row");
    expect(migration).toContain("policy_row.schemaname = 'public'");
    expect(migration).toContain("policy_row.tablename = 'saved_builds'");
    expect(migration).toContain(
      "'DROP POLICY IF EXISTS %I ON public.saved_builds'",
    );

    const policies = migration.match(/CREATE POLICY[^;]+;/g) ?? [];
    expect(policies).toHaveLength(3);
    expect(policies.join("\n")).toContain('"Users can read own builds"');
    expect(policies.join("\n")).toContain('"Users can update own builds"');
    expect(policies.join("\n")).toContain('"Users can delete own builds"');
    expect(migration).toContain("FOR SELECT TO authenticated");
    expect(migration).not.toContain("FOR INSERT TO authenticated");
    expect(migration).toContain("FOR UPDATE TO authenticated");
    expect(migration).toContain("FOR DELETE TO authenticated");
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(4);
  });

  it("normalizes legacy grants to the exact authenticated privilege set", () => {
    expect(migration).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE public\.saved_builds\s+FROM PUBLIC, anon, authenticated;/,
    );
    expect(migration).toMatch(
      /REVOKE ALL PRIVILEGES\s+\(id, user_id, build_data, total_price, created_at, name, updated_at\)\s+ON TABLE public\.saved_builds\s+FROM PUBLIC, anon, authenticated;/,
    );

    const authenticatedGrants = (
      migration.match(/GRANT\s+[^;]+\s+TO authenticated;/g) ?? []
    ).map((statement) => statement.replace(/\s+/g, " "));
    expect(authenticatedGrants).toEqual([
      "GRANT SELECT, DELETE ON TABLE public.saved_builds TO authenticated;",
      "GRANT UPDATE (name) ON TABLE public.saved_builds TO authenticated;",
    ]);
    expect(migration).not.toMatch(/GRANT\s+[^;]+\s+TO (?:PUBLIC|anon);/i);
    expect(migration).toContain(
      "GRANT SELECT, INSERT ON TABLE public.saved_builds TO service_role;",
    );
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
