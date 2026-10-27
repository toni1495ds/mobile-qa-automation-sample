// Login and access to user data

import { test, expect } from '@playwright/test';
import { createUser } from '../helpers';
import { loginSchema } from '../schemas';

// should return a token
test('login with valid credentials @smoke', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.post('/auth/login', { data: { email: user.email, password: user.password } });

  expect(res.status()).toBe(200);
  loginSchema.parse(await res.json());
});

// right email, wrong password
test('wrong password returns 401', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.post('/auth/login', { data: { email: user.email, password: 'wrong' } });

  expect(res.status()).toBe(401);
});

// no token
test('balance without token returns 401', async ({ request }) => {
  const user = await createUser(request);

  const res = await request.get(`/users/${user.id}/balance`);

  expect(res.status()).toBe(401);
});

// bob asks for alice's balance
test("can't see another user's balance", async ({ request }) => {
  const alice = await createUser(request, 5000);
  const bob = await createUser(request);

  const res = await request.get(`/users/${alice.id}/balance`, { headers: bob.headers });

  expect(res.status()).toBe(404);
});
