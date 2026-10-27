// Shared helpers to create users and call the API from the tests

import { APIRequestContext, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

type User = { id: string; email: string; password: string; headers: Record<string, string> };

export const today = () => new Date().toISOString().slice(0, 10);

export const yesterday = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

// new user per test, so tests don't share data
export async function createUser(request: APIRequestContext, coins = 0): Promise<User> {
  const res = await request.post('/test/users', { data: { coins } });
  expect(res.status()).toBe(201);
  const user = await res.json();

  const login = await request.post('/auth/login', { data: { email: user.email, password: user.password } });
  const { token } = await login.json();

  return { ...user, headers: { Authorization: `Bearer ${token}` } };
}

export async function getCoins(request: APIRequestContext, user: User) {
  const res = await request.get(`/users/${user.id}/balance`, { headers: user.headers });
  return (await res.json()).coins;
}

export async function addSteps(request: APIRequestContext, user: User, steps: number, date = today()) {
  const res = await request.post('/steps/sync', { headers: user.headers, data: { date, steps } });
  expect(res.status()).toBe(200);
}

export function convertSteps(request: APIRequestContext, user: User, date = today()) {
  return request.post('/steps/convert', { headers: user.headers, data: { date } });
}

export function redeem(request: APIRequestContext, user: User, rewardId: string, key: string = randomUUID()) {
  return request.post(`/rewards/${rewardId}/redeem`, {
    headers: { ...user.headers, 'Idempotency-Key': key },
  });
}
