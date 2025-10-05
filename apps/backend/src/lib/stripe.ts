// apps/backend/src/lib/stripe.ts
import Stripe from 'stripe';
import { ENV } from '../env.js';

export const stripe = new Stripe(ENV.STRIPE_SECRET_KEY);

export const PRICE_MAP: Record<number, string> = {
  1: ENV.PRICE_ID_1,
  5: ENV.PRICE_ID_5,
  100: ENV.PRICE_ID_100,
};



