export function getSupabaseEnv() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL
  )?.trim();

  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY
  )?.trim();

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
