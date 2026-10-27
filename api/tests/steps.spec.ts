// Syncing steps and converting them to coins

import { test, expect } from '@playwright/test';
import { addSteps, convertSteps, createUser, getCoins, yesterday } from '../helpers';
import { convertSchema } from '../schemas';

// 100 steps = 1 coin
test('10k steps give 100 coins @smoke', async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 10_000);

  const res = await convertSteps(request, user);

  expect(res.status()).toBe(200);
  expect(convertSchema.parse(await res.json()).coinsEarned).toBe(100);
  expect(await getCoins(request, user)).toBe(100);
});

// second time should give 0
test('convert twice, get paid once', async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 5_000);

  await convertSteps(request, user);
  const second = await convertSteps(request, user);

  expect((await second.json()).coinsEarned).toBe(0);
  expect(await getCoins(request, user)).toBe(50);
});

// only today's steps count
test("yesterday's steps can't be converted", async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 8_000, yesterday());

  const res = await convertSteps(request, user, yesterday());

  expect(res.status()).toBe(422);
  expect(await getCoins(request, user)).toBe(0);
});

// 30k steps but only 20k count
test('max 20k steps a day', async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 30_000);

  await convertSteps(request, user);

  expect(await getCoins(request, user)).toBe(200);
});

// bad input
test('negative steps are rejected', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.post('/steps/sync', { headers: user.headers, data: { date: '2026-01-01', steps: -100 } });

  expect(res.status()).toBe(422);
});
