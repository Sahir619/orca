import type { Session } from 'electron'

/**
 * Outbound HTTP for main-process integrations.
 *
 * Why a port: the desktop uses Electron's `net.fetch`, which routes through Chromium's
 * network stack — it follows session/proxy state and avoids undici's stale keep-alive
 * sockets after a VPN path change, and it sends a Chrome user agent that some APIs
 * (Jira's XSRF check) depend on. None of that exists on a host with no Chromium.
 *
 * The Node default is `globalThis.fetch`. That is a real behavioural difference, not a
 * transparent swap, which is why this is a named port rather than a silent fallback:
 * a Node host reads proxy configuration from the environment instead of from Chromium,
 * and sends Node's user agent.
 */

export type MainHttpClient = {
  fetch(url: string, init?: RequestInit): Promise<Response>
  /** The Chromium session whose proxy state applies, or null on a host without one. */
  proxySession(): Session | null
}

const nodeHttpClient: MainHttpClient = {
  fetch: (url, init) => globalThis.fetch(url, init),
  proxySession: () => null
}

let current: MainHttpClient = nodeHttpClient

export function setMainHttpClient(client: MainHttpClient | null): void {
  current = client ?? nodeHttpClient
}

export function getMainHttpClient(): MainHttpClient {
  return current
}
