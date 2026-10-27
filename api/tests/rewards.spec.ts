// Rewards list and redeeming coins

import { test, expect } from '@playwright/test';
import { createUser, getCoins, redeem } from '../helpers';
import { rewardsSchema } from '../schemas';

// check the format
test('rewards list matches schema', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.get('/rewards', { headers: user.headers });

  expect(res.status()).toBe(200);
  rewardsSchema.parse(await res.json());
});

// 15k - 10k = 5k
test('redeem gift card takes 10k coins @smoke', async ({ request }) => {
  const user = await createUser(request, 15_000);

  const res = await redeem(request, user, 'giftcard_5');

  expect(res.status()).toBe(201);
  expect(await getCoins(request, user)).toBe(5_000);
});

// 1 coin short
test("can't redeem without enough coins", async ({ request }) => {
  const user = await createUser(request, 9_999);

  const res = await redeem(request, user, 'giftcard_5');

  expect(res.status()).toBe(422);
  expect(await getCoins(request, user)).toBe(9_999);
});

// app retries if connection drops
test('same idempotency key only charges once', async ({ request }) => {
  const user = await createUser(request, 25_000);

  await redeem(request, user, 'giftcard_5', 'same-key');
  const retry = await redeem(request, user, 'giftcard_5', 'same-key');

  expect(retry.status()).toBe(200);
  expect(await getCoins(request, user)).toBe(15_000);
});
