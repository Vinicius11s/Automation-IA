function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined);
  return value?.trim();
}

export function getSupabaseEnv() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");

  return { url, anonKey };
}

export function assertSupabaseEnv() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url) {
    throw new Error(
      "Missing env var: NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL)"
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY (ou SUPABASE_ANON_KEY)"
    );
  }

  return { url, anonKey };
}
