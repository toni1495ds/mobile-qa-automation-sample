import { z } from 'zod';

export const loginSchema = z.object({
  token: z.string(),
  userId: z.string(),
});

export const balanceSchema = z.object({
  coins: z.number().int().min(0),
});

export const convertSchema = z.object({
  coinsEarned: z.number().int().min(0),
  balance: z.number().int().min(0),
});

export const rewardsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    cost: z.number().int().positive(),
  }),
);
