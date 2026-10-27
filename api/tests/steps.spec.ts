import { test, expect } from '@playwright/test';
import { addSteps, convertSteps, createUser, getCoins, yesterday } from '../helpers';
import { convertSchema } from '../schemas';

test('10,000 steps converts to 100 coins @smoke', async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 10_000);

  const res = await convertSteps(request, user);

  expect(res.status()).toBe(200);
  expect(convertSchema.parse(await res.json()).coinsEarned).toBe(100);
  expect(await getCoins(request, user)).toBe(100);
});

test('converting twice does not give coins twice', async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 5_000);

  await convertSteps(request, user);
  await convertSteps(request, user);

  expect(await getCoins(request, user)).toBe(50);
});

test("yesterday's steps can't be converted", async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 8_000, yesterday());

  const res = await convertSteps(request, user, yesterday());

  expect(res.status()).toBe(422);
  expect(await getCoins(request, user)).toBe(0);
});

test('only 20,000 steps per day are converted', async ({ request }) => {
  const user = await createUser(request);
  await addSteps(request, user, 30_000);

  await convertSteps(request, user);

  expect(await getCoins(request, user)).toBe(200);
});

test('negative steps are rejected', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.post('/steps/sync', { headers: user.headers, data: { date: '2026-01-01', steps: -100 } });

  expect(res.status()).toBe(422);
});
