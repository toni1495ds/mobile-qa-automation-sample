import { test, expect } from '@playwright/test';
import { createUser } from '../helpers';
import { loginSchema } from '../schemas';

test('login works with valid credentials @smoke', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.post('/auth/login', { data: { email: user.email, password: user.password } });

  expect(res.status()).toBe(200);
  loginSchema.parse(await res.json());
});

test('login fails with wrong password', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.post('/auth/login', { data: { email: user.email, password: 'wrong' } });

  expect(res.status()).toBe(401);
});

test('balance needs a token', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.get(`/users/${user.id}/balance`);

  expect(res.status()).toBe(401);
});

test("a user can't see another user's balance", async ({ request }) => {
  const alice = await createUser(request, 5000);
  const bob = await createUser(request);

  const res = await request.get(`/users/${alice.id}/balance`, { headers: bob.headers });

  expect(res.status()).toBe(404);
});
