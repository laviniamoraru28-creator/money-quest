import assert from 'node:assert/strict';
import { AGENCY_MISSIONS } from '../src/lib/agency/missions';
import { getAssistantMission } from '../src/lib/lesson-assistant/lesson-context';
import { answerLesson } from '../src/lib/lesson-assistant/service';
import { openAIProvider, inputBound, microPounds } from '../src/lib/lesson-assistant/provider';
import { LOCALES } from '../src/i18n/config';

async function main() {
  const nativeFetch = globalThis.fetch;
  const localLedger = 'https://ledger.invalid';
  let requests = 0;
  let measured = 0;
  let failures = 0;
  const redis = await nativeFetch('https://diverse-ghost-204254.upstash.io', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: {Authorization: 'Bearer ' + process.env.MQ_AI_REDIS_REST_TOKEN, 'Content-Type': 'application/json'},
    body: JSON.stringify(['PING']),
  });
  console.log('Upstash PING HTTP', redis.status);
  const pingOk = redis.ok && (await redis.json()).result === 'PONG';
  if (!pingOk) failures++;
  const key = process.env.MQ_AI_OPENAI_KEY;
  assert.ok(key && key.startsWith('sk-'), 'Expected OpenAI project secret');
  globalThis.fetch = async (url, init) => {
    if (url === localLedger) return Response.json({result: 'ok'});
    assert.equal(url, 'https://api.openai.com/v1/chat/completions');
    const response = await nativeFetch(url, init);
    if (!response.ok) console.log('OpenAI HTTP', response.status);
    return response;
  };
  const provider = openAIProvider(key);
  try {
    for (const [, mission] of Array(3).fill(Object.values(AGENCY_MISSIONS)[0]).entries()) {
      const locale = LOCALES[0];
      const lesson = await getAssistantMission(mission.id, locale);
      assert.ok(lesson);
      const result = await answerLesson({secret: 'synthetic-only', fx: 1, ledger: {url: localLedger, token: 'fixture', marker: 'fixture'}}, async request => {
        assert.ok(++requests <= 6);
        assert.ok(measured + microPounds({input:inputBound(request), output:request.maxOutput}, 1) <= 20000, 'Five-pence test ceiling');
        const reply = await provider(request);
        const value = reply.value as {text?:string;kind?:string;choices?:unknown[];safe?:boolean}|null;
        console.log('phase',request.maxOutput,'parsed',!!value,'textLength',value?.text?.length,'choiceCount',value?.choices?.length,'safe',value?.safe,'input',reply.usage.input,'output',reply.usage.output);
        measured += microPounds(reply.usage, 1);
        return reply;
      }, {action: 'understand', lessonId: mission.id, locale, question: '', followUp: ''}, lesson, 'synthetic');
      console.log(mission.id, locale, 'status' in result ? result.status : 'reviewed');
      if ('status' in result) failures++;
    }
  } finally {
    console.log('Calls attempted:', requests, 'Confirmed usage at buffered GBP/USD=1 in micro-pounds:', measured);
    globalThis.fetch = nativeFetch;
  }
  assert.equal(failures, 0, 'Some synthetic checks did not pass');
}
main().catch(e => { console.error(e instanceof Error ? e.message.replace(/sk-\S+/g,'[redacted]') : 'Check failed'); process.exitCode=1; });
