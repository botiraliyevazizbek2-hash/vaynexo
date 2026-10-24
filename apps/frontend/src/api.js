export async function api(path, { token, body, method = "GET", key } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("/api" + path, {
      method,
      signal: controller.signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(
        typeof data.detail === "string" ? data.detail : "invalid_input",
      );
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
export const money = (n, lang = "uz") =>
  new Intl.NumberFormat({ uz: "uz-UZ", ru: "ru-RU", en: "en-US" }[lang]).format(
    n,
  ) + " UZS";
