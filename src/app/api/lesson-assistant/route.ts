import { NextRequest, NextResponse } from "next/server";
import { getAssistantLesson } from "@/lib/lesson-assistant/lesson-context";
import { makeVisitorCookie, visitorCookie, visitorFromCookie } from "@/lib/lesson-assistant/privacy";
import { parseRequest } from "@/lib/lesson-assistant/protocol";
import { openAIProvider } from "@/lib/lesson-assistant/provider";
import { answerLesson } from "@/lib/lesson-assistant/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const limitBytes = 8192;

function configFromEnv() {
  const env = process.env;
  const { MQ_AI_OPENAI_KEY: key, MQ_AI_SIGNING_SECRET: secret, MQ_AI_REDIS_REST_URL: url,
    MQ_AI_REDIS_REST_TOKEN: token, MQ_AI_LEDGER_MARKER: marker, MQ_AI_ALLOWED_ORIGIN: origin } = env;
  const fx = Number(env.MQ_AI_GBP_PER_USD_BUFFERED);
  const reviewedUntil = Date.parse(env.MQ_AI_CONFIGURATION_EXPIRES ?? "");
  const now = Date.now();
  if (env.MQ_AI_ENABLED !== "true" || env.MQ_AI_PROVIDER !== "openai" ||
    !key || !secret || secret.length < 32 || !token || !marker || marker.length < 24 ||
    !url || !/^https:\/\/[a-z0-9-]+\.upstash\.io\/?$/.test(url) ||
    !origin || !/^https:\/\/[a-z0-9.-]+(?::\d+)?$/.test(origin) ||
    !Number.isFinite(fx) || fx < 0.9 || fx > 5 ||
    !(reviewedUntil > now && reviewedUntil - now <= 31 * 86_400_000)) return null;
  return { key, origin, secret, fx, ledger: { url, token, marker } };
}

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function GET(request: NextRequest) {
  const config = configFromEnv();
  if (!config) return json({ ready: false });
  if (request.headers.get("sec-fetch-site") !== "same-origin") return json({ ready: false }, 403);
  const response = json({ ready: true });
  if (!visitorFromCookie(config.secret, request.cookies.get(visitorCookie)?.value ?? "")) {
    const now = new Date();
    const nextDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    response.cookies.set(visitorCookie, makeVisitorCookie(config.secret), {
      httpOnly: true, secure: true, sameSite: "strict", path: "/api/lesson-assistant",
      expires: new Date(nextDay),
    });
  }
  return response;
}

async function readBody(request: Request) {
  if (Number(request.headers.get("content-length")) > limitBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;

  let size = 0;
  let text = "";
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limitBytes) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const config = configFromEnv();
  if (!config) return json({ status: "disabled" }, 503);
  if (request.headers.get("origin") !== config.origin ||
    request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") {
    return json({ status: "unavailable" }, 403);
  }

  const visitor = visitorFromCookie(config.secret, request.cookies.get(visitorCookie)?.value ?? "");
  if (!visitor) return json({ status: "unavailable" }, 403);
  const input = parseRequest(await readBody(request));
  if (!input) return json({ status: "unavailable" }, 400);

  try {
    const lesson = await getAssistantLesson(input.lessonId, input.locale);
    if (!lesson) return json({ status: "unavailable" }, 404);
    const result = await answerLesson(config, openAIProvider(config.key), input, lesson, visitor);
    if ("status" in result && (result.status === "monthly" || result.status === "daily")) return json(result, 429);
    return json(result);
  } catch {
    console.error("[lesson-assistant] request failed");
    return json({ status: "unavailable" }, 503);
  }
}
