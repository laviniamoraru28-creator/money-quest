import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {limitedBody} from '@/lib/security/limited-body';
import {ADULT_COOKIE, CHALLENGE_COOKIE, ADULT_TTL, adultChallenge, adultProof, solveAdultChallenge} from '@/lib/support/adult-gate';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'no-store'};
const options = {httpOnly: true, sameSite: 'strict' as const, maxAge: ADULT_TTL, path: '/'};
export async function GET(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({}, {status: 403, headers});
  const challenge = adultChallenge();
  const response = NextResponse.json({a: challenge.a, b: challenge.b}, {headers});
  response.cookies.set(CHALLENGE_COOKIE, challenge.cookie, {...options, secure: new URL(request.url).protocol === 'https:'});
  return response;
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const accepted = [new URL(request.url).origin, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean);
  if (!origin || !accepted.includes(origin)) return NextResponse.json({}, {status: 403, headers});
  const jar = await cookies();
  let valid = false;
  try {
    const input = JSON.parse(await limitedBody(request, 256));
    valid = solveAdultChallenge(jar.get(CHALLENGE_COOKIE)?.value, input.answer, input.adult);
  } catch {/* Invalid or oversized requests cannot unlock payments. */}
  const response = NextResponse.json({verified: valid}, {status: valid ? 200 : 400, headers});
  response.cookies.set(CHALLENGE_COOKIE, '', {...options, maxAge: 0});
  if (valid) response.cookies.set(ADULT_COOKIE, adultProof(), {...options, secure: origin.startsWith('https:')});
  return response;
}
