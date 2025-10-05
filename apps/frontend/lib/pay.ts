// apps/frontend/lib/pay.ts
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB!);

export async function confirmEntry(clientSecret: string) {
  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe not ready');
  const { error } = await stripe.confirmCardPayment(clientSecret);
  if (error) throw error;
}
