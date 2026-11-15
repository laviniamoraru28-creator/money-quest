import { randomUUID } from "node:crypto";

export const monthlyLimit = 5_000_000; // Integer micro-pounds.
export const warningLimit = 4_000_000;
export const dailyLimit = 10;
export const ledgerReadyKey = "mq:assistant:ledger-ready";

export const reserveScript = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 'offline' end
if redis.call('EXISTS', KEYS[2]) == 1 then return 'offline' end
local count = tonumber(redis.call('GET', KEYS[3]) or '0')
if count >= tonumber(ARGV[2]) then return 'daily' end
local spent = tonumber(redis.call('HGET', KEYS[4], 'spend') or '0')
local reserved = tonumber(ARGV[3])
if spent + reserved > tonumber(ARGV[4]) then return 'monthly' end
if redis.call('SET', KEYS[5], reserved, 'NX', 'EX', 86400) == false then return 'offline' end
redis.call('INCR', KEYS[3])
redis.call('EXPIREAT', KEYS[3], ARGV[5])
redis.call('HINCRBY', KEYS[4], 'spend', reserved)
redis.call('EXPIRE', KEYS[4], 7776000)
return 'ok'
`;

export const settleScript = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 'offline' end
local reserved = redis.call('GET', KEYS[4])
if not reserved or redis.call('EXISTS', KEYS[3]) == 0 then return 'offline' end
local actual = tonumber(ARGV[2])
if actual > tonumber(reserved) then redis.call('SET', KEYS[2], 'usage-overrun') end
local spent = redis.call('HINCRBY', KEYS[3], 'spend', actual - tonumber(reserved))
redis.call('DEL', KEYS[4])
if spent >= tonumber(ARGV[3]) and redis.call('HSETNX', KEYS[3], 'warned', '1') == 1 then return 'warning' end
return 'ok'
`;

type LedgerConfig = { url: string; token: string; marker: string };

async function evaluate(config: LedgerConfig, script: string, keys: string[], args: (string | number)[]) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", script, keys.length, ...keys, ...args]),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(3500),
  });
  if (!response.ok) throw new Error("ledger-http");
  const { result, error } = await response.json();
  if (error || typeof result !== "string") throw new Error("ledger-result");
  return result;
}

const pauseKey = "mq:assistant:paused";
type Reservation = { monthKey: string; requestKey: string; amount: number };

export async function reserveBudget(config: LedgerConfig, visitorKey: string, amount: number, now: Date) {
  const day = now.toISOString().slice(0, 10);
  const monthKey = `mq:assistant:spend:${day.slice(0, 7)}`;
  const nextDay = Date.parse(`${day}T00:00:00Z`) / 1000 + 86_400;
  const requestKey = `mq:assistant:reservation:${randomUUID()}`;
  const result = await evaluate(config, reserveScript, [
    ledgerReadyKey, pauseKey, `mq:assistant:daily:${day}:${visitorKey}`, monthKey, requestKey,
  ], [config.marker, dailyLimit, amount, monthlyLimit, nextDay]);
  if (result === "daily" || result === "monthly" || result === "offline") return { result } as const;
  if (result !== "ok") throw new Error("ledger-reserve");
  return { result, reservation: { monthKey, requestKey, amount } } as const;
}

export async function settleBudget(config: LedgerConfig, reservation: Reservation, actual: number) {
  const result = await evaluate(config, settleScript, [
    ledgerReadyKey, pauseKey, reservation.monthKey, reservation.requestKey,
  ], [config.marker, actual, warningLimit]);
  if (result === "warning") console.warn("[lesson-assistant] £4 monthly usage threshold reached");
  if (actual > reservation.amount) console.error("[lesson-assistant] cost estimate exceeded, ledger suspended");
  if (result !== "ok" && result !== "warning") throw new Error("ledger-settle");
}
