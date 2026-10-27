// zod checks the API responses have the right fields and types, if not the test fails

import { z } from 'zod';

// POST /auth/login
export const loginSchema = z.object({ token: z.string(), userId: z.string() });

// POST /steps/convert
export const convertSchema = z.object({
  coinsEarned: z.number().int().min(0),
  balance: z.number().int().min(0),
});

// GET /rewards
export const rewardsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    cost: z.number().int().positive(),
  }),
);
