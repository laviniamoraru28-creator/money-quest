import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const visitorCookie = "mq_assistant";
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const token = /^[\w-]+\.[\w-]+$/;

function sign(secret: string, scope: string, value: string) {
  return createHmac("sha256", secret).update(scope).update("\0").update(value).digest("base64url");
}

function seal(secret: string, scope: string, value: string) {
  const data = Buffer.from(value).toString("base64url");
  return `${data}.${sign(secret, scope, data)}`;
}

function unseal(secret: string, scope: string, value: string) {
  if (value.length > 3000 || !token.test(value)) return "";
  const [data, signature] = value.split(".");
  if (!data || !signature) return "";
  const expected = sign(secret, scope, data);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return "";
  return Buffer.from(data, "base64url").toString();
}

export function visitorFromCookie(secret: string, value: string) {
  const id = unseal(secret, "visitor", value);
  return uuid.test(id) ? id : "";
}

export function makeVisitorCookie(secret: string) {
  return seal(secret, "visitor", randomUUID());
}

export function counterId(secret: string, visitor: string, day: string) {
  return sign(secret, `counter:${day}`, visitor);
}

export function sealFollowUp(secret: string, scope: string, text: string) {
  return seal(secret, `turn:${scope}`, text.slice(0, 350));
}

export function readFollowUp(secret: string, scope: string, value: string) {
  return unseal(secret, `turn:${scope}`, value);
}

// Reject obvious identifiers before a question can leave Money Quest.
const personalPatterns = [
  /[\p{L}\d._%+-]+\s*@\s*[\p{L}\d.-]+\.[\p{L}]{2,}|https?:|www\./iu,
  /(?:\d[ .()+-]*){7,}/u,
  /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/iu,
  /(?<!\p{L})(?:my name is|i live (?:at|in)|my (?:address|school|password)|mă numesc|ma numesc|numele meu|locuiesc (?:la|în)|parola mea|me llamo|mi dirección|vivo en|je m'appelle|mon adresse|j'habite|ich heiße|ich wohne|meine adresse|mi chiamo|il mio indirizzo|mi nombre|meu nome|chamo-me|moro em|ik heet|ik woon|mijn adres|nazywam się|mieszkam|mój adres)(?!\p{L})/iu,
];

export function containsPersonalData(text: string) {
  const normalized = text.normalize("NFKC").replace(/[\p{Cf}\p{Cc}]/gu, " ");
  return personalPatterns.some((pattern) => pattern.test(normalized));
}
