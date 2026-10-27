// Fake API for the tests. Rules are my guesses:
// 1 coin per 100 steps, only today's steps, max 20k steps a day.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = 3333;
const DAILY_LIMIT = 20_000;

type User = { id: string; email: string; password: string; coins: number; steps: Record<string, number>; converted: Record<string, number> };

const users = new Map<string, User>();
const tokens = new Map<string, string>();
const redemptions = new Map<string, object>();

const rewards = [
  { id: 'giftcard_5', name: 'Gift card 5€', cost: 10_000 },
  { id: 'cashout_15', name: 'Bank transfer 15€', cost: 30_000 },
];

const today = () => new Date().toISOString().slice(0, 10);

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

createServer(async (req, res) => {
  const { url, method } = req;

  if (url === '/health') return send(res, 200, { ok: true });

  // only for tests
  if (method === 'POST' && url === '/test/users') {
    const { coins = 0 } = await readBody(req);
    const id = randomUUID();
    const user = { id, email: `qa+${id}@test.com`, password: 'Test1234!', coins, steps: {}, converted: {} };
    users.set(id, user);
    return send(res, 201, { id, email: user.email, password: user.password });
  }

  if (method === 'POST' && url === '/auth/login') {
    const { email, password } = await readBody(req);
    const user = [...users.values()].find((u) => u.email === email && u.password === password);
    if (!user) return send(res, 401, { error: 'INVALID_CREDENTIALS' });
    const token = randomUUID();
    tokens.set(token, user.id);
    return send(res, 200, { token, userId: user.id });
  }

  const token = req.headers.authorization?.replace('Bearer ', '') ?? '';
  const user = users.get(tokens.get(token) ?? '');
  if (!user) return send(res, 401, { error: 'UNAUTHORIZED' });

  const balance = url?.match(/^\/users\/(.+)\/balance$/);
  if (method === 'GET' && balance) {
    // 404 and not 403, so we don't leak that the user exists
    if (balance[1] !== user.id) return send(res, 404, { error: 'NOT_FOUND' });
    return send(res, 200, { coins: user.coins });
  }

  if (method === 'POST' && url === '/steps/sync') {
    const { date, steps } = await readBody(req);
    if (!Number.isInteger(steps) || steps < 0) return send(res, 422, { error: 'INVALID_STEPS' });
    user.steps[date] = Math.max(user.steps[date] ?? 0, steps);
    return send(res, 200, { date, steps: user.steps[date] });
  }

  if (method === 'POST' && url === '/steps/convert') {
    const { date } = await readBody(req);
    if (date !== today()) return send(res, 422, { error: 'STEPS_EXPIRED' });
    const total = Math.min(user.steps[date] ?? 0, DAILY_LIMIT);
    const coins = Math.floor(total / 100) - Math.floor((user.converted[date] ?? 0) / 100);
    user.converted[date] = total;
    user.coins += coins;
    return send(res, 200, { coinsEarned: coins, balance: user.coins });
  }

  if (method === 'GET' && url === '/rewards') return send(res, 200, rewards);

  const redeem = url?.match(/^\/rewards\/(.+)\/redeem$/);
  const reward = redeem && rewards.find((r) => r.id === redeem[1]);
  if (method === 'POST' && reward) {
    const key = `${user.id}:${req.headers['idempotency-key']}`;
    if (redemptions.has(key)) return send(res, 200, redemptions.get(key));
    if (user.coins < reward.cost) return send(res, 422, { error: 'NOT_ENOUGH_COINS' });
    user.coins -= reward.cost;
    const result = { rewardId: reward.id, balance: user.coins };
    redemptions.set(key, result);
    return send(res, 201, result);
  }

  send(res, 404, { error: 'NOT_FOUND' });
}).listen(PORT, () => console.log(`Mock API on http://localhost:${PORT}`));
