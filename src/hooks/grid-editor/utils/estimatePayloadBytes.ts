/** Size of a value once serialised to JSON, in bytes, as the server will receive it. */
export const estimatePayloadBytes = (payload: unknown): number =>
  new TextEncoder().encode(JSON.stringify(payload)).length;

/** Matches the server's request limit in the app this is based on. */
export const DEFAULT_MAX_PAYLOAD_BYTES = 50 * 1024 * 1024;

export const formatMegabytes = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
