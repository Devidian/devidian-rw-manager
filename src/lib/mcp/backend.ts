type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

const DEFAULT_BACKEND_URL = "https://rw-servers.omega-zirkel.de";

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

/** Base URL of the Rising World manager backend the MCP tools read from. */
export function backendBaseUrl(): string {
  const configured =
    runtimeEnv("RW_MANAGER_BACKEND_URL")?.trim() ||
    runtimeEnv("FIXED_BACKEND_URL")?.trim() ||
    DEFAULT_BACKEND_URL;
  return configured.replace(/\/+$/, "");
}

/** Anonymous GET against the manager backend. Only public data is reachable. */
export async function backendGet<T>(path: string): Promise<T> {
  const url = `${backendBaseUrl()}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Backend request failed (HTTP ${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

export function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}
