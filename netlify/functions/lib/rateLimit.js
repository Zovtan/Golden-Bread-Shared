













const buckets = new Map();
let lastSweep = Date.now();


function maybeSweep(now, windowMs) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
}



export function getClientIp(event) {
  const h = event.headers || {};
  return (
    h["x-nf-client-connection-ip"] ||
    (h["x-forwarded-for"] || "").split(",")[0].trim() ||
    "unknown");

}




export function rateLimit(key, { windowMs = 60_000, max = 30 } = {}) {
  const now = Date.now();
  maybeSweep(now, windowMs);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (bucket.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}


export function tooManyRequestsResponse(retryAfter) {
  return {
    statusCode: 429,
    headers: { "Retry-After": String(retryAfter) },
    body: JSON.stringify({ error: "Terlalu banyak permintaan. Silakan coba lagi sebentar lagi." })
  };
}




export function enforceRateLimit(event, name, opts) {
  const ip = getClientIp(event);
  const { allowed, retryAfter } = rateLimit(`${name}:${ip}`, opts);
  return allowed ? null : tooManyRequestsResponse(retryAfter);
}