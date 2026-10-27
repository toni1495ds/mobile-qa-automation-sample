import { test, expect } from '@playwright/test';
import { createUser, getCoins, redeem } from '../helpers';
import { rewardsSchema } from '../schemas';

test('rewards list has the expected format', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.get('/rewards', { headers: user.headers });

  expect(res.status()).toBe(200);
  rewardsSchema.parse(await res.json());
});

test('redeeming a gift card takes the right amount of coins @smoke', async ({ request }) => {
  const user = await createUser(request, 15_000);

  const res = await redeem(request, user, 'giftcard_5');

  expect(res.status()).toBe(201);
  expect(await getCoins(request, user)).toBe(5_000);
});

test("can't redeem without enough coins", async ({ request }) => {
  const user = await createUser(request, 9_999);

  const res = await redeem(request, user, 'giftcard_5');

  expect(res.status()).toBe(422);
  expect(await getCoins(request, user)).toBe(9_999);
});

test('a retried request does not charge twice', async ({ request }) => {
  // the app can retry if the connection drops, so the same key must not charge again
  const user = await createUser(request, 25_000);

  await redeem(request, user, 'giftcard_5', 'same-key');
  await redeem(request, user, 'giftcard_5', 'same-key');

  expect(await getCoins(request, user)).toBe(15_000);
});
