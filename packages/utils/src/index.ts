export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const res = await fetch(`${base}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as any).error || "Request failed");
  }

  return data as T;
}
