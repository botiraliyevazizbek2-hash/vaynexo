/** Owner-run Telegram diagnostics. No public setup route; no credential output. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const WEBHOOK_URL = 'https://null-alpha-orcin.vercel.app/api/telegram/webhook';
export const EXPECTED_BOT = 'VaynexoBot';

export class ConfigurationError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function credentials(env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new ConfigurationError('missing_bot_token');
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new ConfigurationError('invalid_bot_token_format');
  return { token, secret: env.TELEGRAM_WEBHOOK_SECRET };
}

function client(token, fetchImpl) {
  return async (method, body = {}) => {
    let response;
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
        redirect: 'error',
      });
    } catch {
      throw new ConfigurationError('telegram_unreachable');
    }
    let result;
    try { result = await response.json(); } catch {
      throw new ConfigurationError('telegram_invalid_response');
    }
    if (!response.ok || result.ok !== true) {
      const status = Number(result.error_code || response.status);
      if (status === 401 || status === 404) throw new ConfigurationError('bot_token_rejected');
      if (status === 429) throw new ConfigurationError('telegram_rate_limited');
      throw new ConfigurationError('telegram_request_failed');
    }
    return result.result;
  };
}

function summarize(info) {
  if (!info || typeof info.url !== 'string') throw new ConfigurationError('telegram_invalid_response');
  const enabled = name => !Array.isArray(info.allowed_updates) || info.allowed_updates.length === 0
    || info.allowed_updates.includes(name);
  return {
    webhookPresent: info.url.length > 0,
    webhookMatches: info.url === WEBHOOK_URL,
    messagesEnabled: enabled('message'),
    callbacksEnabled: enabled('callback_query'),
    // The error may be historical. It is never treated as a current delivery failure by itself.
    lastDeliveryErrorHttpStatus: String(info.last_error_message || '').match(/\b[45]\d\d\b/)?.[0] ?? null,
    lastDeliveryErrorAt: Number.isSafeInteger(info.last_error_date) ? info.last_error_date : null,
  };
}

async function identity(api) {
  const bot = await api('getMe');
  if (bot?.is_bot !== true || bot.username?.toLowerCase() !== EXPECTED_BOT.toLowerCase()) {
    throw new ConfigurationError('wrong_bot_identity');
  }
}

function state(summary) {
  if (!summary.webhookPresent) return 'webhook_not_registered';
  if (!summary.webhookMatches) return 'webhook_url_mismatch';
  if (!summary.messagesEnabled || !summary.callbacksEnabled) return 'update_types_missing';
  return 'registered';
}

export async function inspectTelegram({ env = process.env, fetchImpl = fetch } = {}) {
  const { token } = credentials(env);
  const api = client(token, fetchImpl);
  await identity(api);
  const summary = summarize(await api('getWebhookInfo'));
  return { state: state(summary), expectedBot: EXPECTED_BOT, ...summary };
}

export async function registerTelegram({ env = process.env, fetchImpl = fetch } = {}) {
  const { token, secret } = credentials(env);
  if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
    throw new ConfigurationError('invalid_webhook_secret_format');
  }
  const api = client(token, fetchImpl);
  await identity(api);
  const before = summarize(await api('getWebhookInfo'));
  // Only send the webhook secret to the fixed, reviewed VAYNEXO origin.
  async function probe(received, body) {
    try {
      return await fetchImpl(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(received ? {
          'X-Telegram-Bot-Api-Secret-Token': received,
        } : {}) },
        body,
        signal: AbortSignal.timeout(10000),
        redirect: 'error',
      });
    } catch { throw new ConfigurationError('webhook_unreachable'); }
  }
  const anonymous = await probe(null, JSON.stringify({ update_id: 0 }));
  if (anonymous.status !== 401) throw new ConfigurationError('webhook_auth_guard_failed');
  const authorized = await probe(secret, JSON.stringify({ update_id: 0 }));
  if (!authorized.ok) throw new ConfigurationError('webhook_rejected_server_secret');
  const malformed = await probe(secret, '{');
  if (malformed.status !== 400) throw new ConfigurationError('webhook_invalid_json_guard_failed');
  await api('setWebhook', {
    url: WEBHOOK_URL,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  });
  const after = summarize(await api('getWebhookInfo'));
  if (state(after) !== 'registered') throw new ConfigurationError('registration_not_confirmed');
  return { state: 'registered', expectedBot: EXPECTED_BOT, before, ...after, handlerChecksPassed: true };
}

export async function run(args, options = {}) {
  const mode = args.includes('--register') ? 'register' : 'inspect';
  const reportAt = args.indexOf('--report');
  const reportPath = reportAt >= 0 ? args[reportAt + 1] : null;
  if (reportAt >= 0 && !reportPath) throw new ConfigurationError('missing_report_path');
  let report;
  try {
    report = await (mode === 'register' ? registerTelegram(options) : inspectTelegram(options));
  } catch (error) {
    report = { state: error instanceof ConfigurationError ? error.code : 'check_failed' };
  }
  // This allowlisted report contains no credentials, raw Telegram response, chat content, or user IDs.
  report = { ...report, checkedAt: new Date().toISOString(), mode, liveReplyVerified: false };
  if (reportPath) {
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  try {
    const report = await run(args);
    console.log(JSON.stringify(report, null, 2));
    // --report supports a one-time build diagnostic, even when configuration is incomplete.
    if (!args.includes('--report') && report.state !== 'registered') process.exitCode = 1;
  } catch {
    console.error('Telegram configuration check failed. No credentials were logged.');
    process.exitCode = 1;
  }
}
