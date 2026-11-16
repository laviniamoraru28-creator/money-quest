import assert from "node:assert/strict";
import { execFile, spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { setTimeout } from "node:timers/promises";
import { ledgerReadyKey, reserveBudget, settleBudget } from "@/lib/lesson-assistant/budget";

const exec = promisify(execFile);

async function getLocalPort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function main() {
  if (spawnSync("redis-server", ["--version"]).status !== 0 || spawnSync("redis-cli", ["--version"]).status !== 0) {
    if (process.env.MQ_TEST_REQUIRE_REDIS === "true") throw new Error("Redis test tools are required");
    console.log("Skipped local Redis integration (redis-server and redis-cli are required).");
    return;
  }

  const port = await getLocalPort();
  const redis = spawn("redis-server", ["--bind", "127.0.0.1", "--port", String(port), "--save", "", "--appendonly", "no"]);
  const close = once(redis, "close");
  const command = async (...args: string[]) => {
    const { stdout } = await exec("redis-cli", ["-h", "127.0.0.1", "-p", String(port), "--json", ...args]);
    if (stdout.startsWith("error:")) throw new Error(stdout.trim());
    return JSON.parse(stdout);
  };

  const originalFetch = globalThis.fetch;
  const config = { url: "https://ledger.test", token: "test", marker: "local-test-marker" };
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await command("PING").catch(() => "") === "PONG") break;
      await setTimeout(25);
    }
    assert.equal(await command("PING"), "PONG");

    globalThis.fetch = (async (_url, init) => {
      const params: unknown[] = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ result: await command(...params.map(String)) }));
    }) as typeof fetch;
    const now = new Date();
    const monthKey = `mq:assistant:spend:${now.toISOString().slice(0, 7)}`;
    assert.equal((await reserveBudget(config, "visitor", 1000, now)).result, "offline");
    await command("SET", ledgerReadyKey, config.marker);
    const attempts = await Promise.all(Array.from({ length: 20 }, () => reserveBudget(config, "visitor", 1000, now)));
    assert.equal(attempts.filter((hold) => hold.result === "ok").length, 10);
    assert.equal(attempts.filter((hold) => hold.result === "daily").length, 10);
    assert.equal(await command("HGET", monthKey, "spend"), "10000");

    // Distinct visitors still share one monthly balance. Each fits alone.
    const competing = await Promise.all(Array.from({ length: 12 }, (_, index) => reserveBudget(config, `other-${index}`, 2_490_000, now)));
    assert.equal(competing.filter((hold) => hold.result === "ok").length, 2);
    assert.equal(competing.filter((hold) => hold.result === "monthly").length, 10);
    assert.equal(await command("HGET", monthKey, "spend"), "4990000");

    const held = competing.find((hold) => hold.result === "ok");
    assert.ok(held?.result === "ok");
    await settleBudget(config, held.reservation, 2_000_000);
    assert.equal(await command("HGET", monthKey, "spend"), "4500000");
    assert.equal(await command("HGET", monthKey, "warned"), "1");
    await assert.rejects(settleBudget(config, held.reservation, 2_000_000), /ledger-settle/);
    assert.equal(await command("HGET", monthKey, "spend"), "4500000");
    const discrepancy = await reserveBudget(config, "discrepancy", 1000, now);
    assert.ok(discrepancy.result === "ok");
    await settleBudget(config, discrepancy.reservation, 1001);
    assert.equal((await reserveBudget(config, "new-visitor", 1000, now)).result, "offline");
    console.log("Verified atomic daily and monthly limits with real Redis Lua, refund, warning, duplicate settlement and fail-closed suspension.");
  } finally {
    globalThis.fetch = originalFetch;
    redis.kill();
    await close;
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
