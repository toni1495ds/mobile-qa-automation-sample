// Small fake backend so the API tests can run without a real environment.
// Rules are my assumptions based on how the app works publicly:
// ~1 coin per 100 steps, steps converted on the same day, 20k steps daily limit.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT ?? 3333);
const STEPS_PER_COIN = 100;
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

const error = (code: string) => ({ error: code });

async function readBody(req: IncomingMessage): Promise<any> {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getUser(req: IncomingMessage): User | undefined {
  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  return users.get(tokens.get(token) ?? '');
}

const server = createServer(async (req, res) => {
  const url = req.url ?? '/';
  const method = req.method;

  if (method === 'GET' && url === '/health') return send(res, 200, { ok: true });

  // test-only endpoint to create users with some coins
  if (method === 'POST' && url === '/test/users') {
    const body = await readBody(req);
    const id = randomUUID();
    const user: User = { id, email: `qa+${id}@test.com`, password: 'Test1234!', coins: body.coins ?? 0, steps: {}, converted: {} };
    users.set(id, user);
    return send(res, 201, { id, email: user.email, password: user.password });
  }

  if (method === 'POST' && url === '/auth/login') {
    const { email, password } = await readBody(req);
    if (!email || !password) return send(res, 400, error('MISSING_FIELDS'));
    const user = [...users.values()].find((u) => u.email === email && u.password === password);
    if (!user) return send(res, 401, error('INVALID_CREDENTIALS'));
    const token = randomUUID();
    tokens.set(token, user.id);
    return send(res, 200, { token, userId: user.id });
  }

  const user = getUser(req);
  if (!user) return send(res, 401, error('UNAUTHORIZED'));

  const balanceMatch = url.match(/^\/users\/(.+)\/balance$/);
  if (method === 'GET' && balanceMatch) {
    // 404 instead of 403 so we don't confirm the other user exists
    if (balanceMatch[1] !== user.id) return send(res, 404, error('NOT_FOUND'));
    return send(res, 200, { coins: user.coins });
  }

  if (method === 'POST' && url === '/steps/sync') {
    const { date, steps } = await readBody(req);
    if (!Number.isInteger(steps) || steps < 0 || steps > 100_000) return send(res, 422, error('INVALID_STEPS'));
    user.steps[date] = Math.max(user.steps[date] ?? 0, steps);
    return send(res, 200, { date, steps: user.steps[date] });
  }

  if (method === 'POST' && url === '/steps/convert') {
    const { date } = await readBody(req);
    if (date !== today()) return send(res, 422, error('STEPS_EXPIRED'));
    const total = Math.min(user.steps[date] ?? 0, DAILY_LIMIT);
    const already = user.converted[date] ?? 0;
    const coins = Math.floor(total / STEPS_PER_COIN) - Math.floor(already / STEPS_PER_COIN);
    user.converted[date] = total;
    user.coins += coins;
    return send(res, 200, { coinsEarned: coins, balance: user.coins });
  }

  if (method === 'GET' && url === '/rewards') return send(res, 200, rewards);

  const redeemMatch = url.match(/^\/rewards\/(.+)\/redeem$/);
  if (method === 'POST' && redeemMatch) {
    const reward = rewards.find((r) => r.id === redeemMatch[1]);
    if (!reward) return send(res, 404, error('NOT_FOUND'));
    const key = `${user.id}:${req.headers['idempotency-key']}`;
    if (redemptions.has(key)) return send(res, 200, redemptions.get(key));
    if (user.coins < reward.cost) return send(res, 422, error('NOT_ENOUGH_COINS'));
    user.coins -= reward.cost;
    const result = { rewardId: reward.id, balance: user.coins };
    redemptions.set(key, result);
    return send(res, 201, result);
  }

  send(res, 404, error('NOT_FOUND'));
});

server.listen(PORT, () => console.log(`Mock API on http://localhost:${PORT}`));
