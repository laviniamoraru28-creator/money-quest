import {createHmac, randomBytes, randomInt, timingSafeEqual} from 'node:crypto';

export const ADULT_COOKIE = 'mq_support_adult';
export const CHALLENGE_COOKIE = 'mq_support_challenge';
export const ADULT_TTL = 180;
const runtime = globalThis as typeof globalThis & {mqAdultGateKey?: string};
const fallbackKey = runtime.mqAdultGateKey ||= randomBytes(32).toString('hex');
function sign(value: string) {
  return createHmac('sha256', process.env.MONEYQUEST_SUPPORT_WEBHOOK_SECRET || fallbackKey).update(`mq-adult-v1:${value}`).digest('hex');
}
function encode(value: object) {
  const data = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${data}.${sign(data)}`;
}
function decode(value: string | undefined, now: number): Record<string, unknown> | null {
  if (!value || value.length > 600) return null;
  const [data, signature, extra] = value.split('.');
  if (!data || extra || !signature || !/^[a-f0-9]{64}$/.test(signature)) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(data)))) return null;
  try {
    const result = JSON.parse(Buffer.from(data, 'base64url').toString());
    return typeof result.exp === 'number' && result.exp > now && result.exp <= now + ADULT_TTL * 1000 ? result : null;
  } catch {return null;}
}
export function adultChallenge(now = Date.now()) {
  const a = randomInt(12, 30), b = randomInt(3, 10);
  return {a, b, cookie: encode({kind: 'challenge', a, b, exp: now + ADULT_TTL * 1000, nonce: randomBytes(16).toString('hex')})};
}
export function solveAdultChallenge(cookie: string | undefined, answer: unknown, adult: unknown, now = Date.now()) {
  const data = decode(cookie, now);
  return data?.kind === 'challenge' && adult === true && typeof answer === 'string' && /^\d{2,3}$/.test(answer) && Number(answer) === Number(data.a) * Number(data.b);
}
export function adultProof(now = Date.now()) {return encode({kind: 'adult', exp: now + ADULT_TTL * 1000, nonce: randomBytes(16).toString('hex')});}
export function verifiedAdult(cookie: string | undefined, now = Date.now()) {return decode(cookie, now)?.kind === 'adult';}
