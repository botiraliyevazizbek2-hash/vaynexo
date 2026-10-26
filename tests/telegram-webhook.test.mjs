import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectTelegram, registerTelegram, run, WEBHOOK_URL } from '../scripts/telegram-webhook.mjs';

const env = { TELEGRAM_BOT_TOKEN: '123:test-token', TELEGRAM_WEBHOOK_SECRET: 'test-secret' };
const me = { is_bot: true, username: 'VaynexoBot' };
const info = { url: WEBHOOK_URL, allowed_updates: ['message', 'callback_query'] };

function fake({ user = me, initial = info, status = 200, authorizedStatus = 200, anonymousStatus = 401,
  malformedStatus = 400, final = info } = {}) {
  const calls = [];
  let registered = false;
  return {
    calls,
    fetchImpl: async (url, request) => {
      calls.push({ url, request });
      if (url === WEBHOOK_URL) {
        const hasSecret = !!request.headers['X-Telegram-Bot-Api-Secret-Token'];
        return Response.json({ ok: true }, { status: !hasSecret ? anonymousStatus
          : request.body === '{' ? malformedStatus : authorizedStatus });
      }
      if (status !== 200) return Response.json({ ok: false, error_code: status }, { status });
      if (url.endsWith('/getMe')) return Response.json({ ok: true, result: user });
      if (url.endsWith('/getWebhookInfo')) return Response.json({ ok: true, result: registered ? final : initial });
      assert.ok(url.endsWith('/setWebhook'));
      registered = true;
      return Response.json({ ok: true, result: true });
    },
  };
}

test('inspection distinguishes absent, wrong, and registered webhook; does not mutate Telegram', async () => {
  for (const [url, expected] of [['', 'webhook_not_registered'], ['https://other.invalid/route', 'webhook_url_mismatch'], [WEBHOOK_URL, 'registered']]) {
    const f = fake({ initial: { ...info, url } });
    assert.equal((await inspectTelegram({ env, ...f })).state, expected);
    assert.equal(f.calls.length, 2);
    assert.ok(f.calls.every(c => !c.url.endsWith('/setWebhook')));
  }
});

test('missing message updates are detected while Telegram defaults are accepted', async () => {
  assert.equal((await inspectTelegram({ env, ...fake({ initial: { ...info, allowed_updates: ['callback_query'] } }) })).state, 'update_types_missing');
  assert.equal((await inspectTelegram({ env, ...fake({ initial: { url: WEBHOOK_URL } }) })).state, 'registered');
  assert.equal((await inspectTelegram({ env, ...fake({ initial: { ...info, allowed_updates: [] } }) })).state, 'registered');
});

test('a historical delivery error is reported without falsely declaring a current outage', async () => {
  const result = await inspectTelegram({ env, ...fake({ initial: { ...info, last_error_message: 'Wrong response: 401 Unauthorized', last_error_date: 100 } }) });
  assert.equal(result.state, 'registered');
  assert.equal(result.lastDeliveryErrorHttpStatus, '401');
  assert.equal(result.lastDeliveryErrorAt, 100);
});

test('wrong bot identity prevents registration', async () => {
  const f = fake({ user: { ...me, username: 'AnotherBot' } });
  await assert.rejects(registerTelegram({ env, ...f }), { code: 'wrong_bot_identity' });
  assert.equal(f.calls.length, 1);
});

test('missing/invalid credentials fail before network calls', async () => {
  for (const broken of [{}, { TELEGRAM_BOT_TOKEN: 'bad' }, { ...env, TELEGRAM_WEBHOOK_SECRET: 'spaces invalid' }]) {
    const f = fake();
    await assert.rejects(registerTelegram({ env: broken, ...f }));
    assert.equal(f.calls.length, 0);
  }
});

test('HTTP authentication rejection is sanitized', async () => {
  const result = await run([], { env, ...fake({ status: 401 }) });
  assert.equal(result.state, 'bot_token_rejected');
  assert.ok(!JSON.stringify(result).includes(env.TELEGRAM_BOT_TOKEN));
});

test('network errors cannot print credential-bearing request URLs', async () => {
  const result = await run([], { env, fetchImpl: async url => { throw new Error(url); } });
  assert.equal(result.state, 'telegram_unreachable');
  assert.ok(!JSON.stringify(result).includes(env.TELEGRAM_BOT_TOKEN));
});

test('registration checks anonymous, authenticated, and malformed requests before changing webhook', async () => {
  const f = fake({ initial: { ...info, url: '' } });
  const result = await registerTelegram({ env, ...f });
  const call = f.calls.find(c => c.url.endsWith('/setWebhook'));
  const body = JSON.parse(call.request.body);
  assert.equal(body.url, WEBHOOK_URL);
  assert.equal(body.secret_token, env.TELEGRAM_WEBHOOK_SECRET);
  assert.equal(body.drop_pending_updates, false);
  assert.deepEqual(body.allowed_updates, ['message', 'callback_query']);
  assert.equal(result.state, 'registered');
  assert.equal(result.before.webhookPresent, false);
  assert.equal(result.handlerChecksPassed, true);
  assert.ok(!JSON.stringify(result).includes(env.TELEGRAM_WEBHOOK_SECRET));
  for (const call of f.calls.filter(c => c.url === WEBHOOK_URL)) {
    assert.equal(call.request.redirect, 'error');
    assert.equal(call.request.body === '{' || JSON.parse(call.request.body).message === undefined, true);
  }
});

test('failed endpoint checks never change the webhook', async () => {
  for (const failure of [{ anonymousStatus: 200 }, { authorizedStatus: 401 }, { malformedStatus: 500 }]) {
    const f = fake(failure);
    await assert.rejects(registerTelegram({ env, ...f }));
    assert.ok(!f.calls.some(c => c.url.endsWith('/setWebhook')));
  }
});

test('a failed registration verification is not reported as success', async () => {
  const f = fake({ final: { ...info, url: '' } });
  await assert.rejects(registerTelegram({ env, ...f }), { code: 'registration_not_confirmed' });
});

test('reports never claim an end-to-end Telegram reply was verified', async () => {
  const result = await run([], { env, ...fake() });
  assert.equal(result.liveReplyVerified, false);
  assert.equal(result.mode, 'inspect');
});
