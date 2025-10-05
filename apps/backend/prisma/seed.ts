// apps/backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.problem.createMany({
    data: [
      {
        prompt:
          'Naive Bayes Spam Filter — Train on small toy data. Print\nANSWER:<acc_no_smooth>\nANSWER:<acc_laplace>\nANSWER:<improvement>',
        type: 'CODE',
        answer: '',          // unused for CODE
        tolerance: null,
        aliases: [],
        codeTemplate: `
# Naive Bayes Spam Filter (toy). Fill the TODOs and print:
# ANSWER:<acc_no_smooth>
# ANSWER:<acc_laplace>
# ANSWER:<improvement>
# Allowed libs: math, random, statistics, numpy

train_emails = [
    (["win","cash","now"], "spam"),
    (["limited","offer","cash"], "spam"),
    (["meet","for","lunch"], "ham"),
    (["project","meeting","schedule"], "ham"),
    (["cheap","viagra","offer"], "spam"),
    (["see","you","tonight"], "ham"),
    (["earn","money","fast"], "spam"),
    (["family","dinner","plans"], "ham"),
]
test_emails = [
    (["cash","offer","now"], "spam"),
    (["project","plans"], "ham"),
    (["viagra","cheap"], "spam"),
    (["see","you","at","lunch"], "ham"),
]

from collections import Counter
import math

def train_nb(emails, alpha=0.0):
    # TODO: return priors and per-class token counts + smoothing
    return {}

def predict(model, tokens):
    # TODO: compute log-prob per class using priors + likelihoods
    return "spam"

def accuracy(model, ds):
    # TODO
    return 0.0

if __name__=="__main__":
    m0 = train_nb(train_emails, alpha=0.0)
    a0 = accuracy(m0, test_emails)
    m1 = train_nb(train_emails, alpha=1.0)
    a1 = accuracy(m1, test_emails)
    print(f"ANSWER:{a0:.3f}")
    print(f"ANSWER:{a1:.3f}")
    print(f"ANSWER:{(a1-a0):.3f}")
`.trim(),
      },
      {
        prompt:
          'Bayesian CTR (Thompson Sampling) — Bernoulli arms with Beta posteriors. Simulate, then print ANSWER:<total_clicks>',
        type: 'CODE',
        answer: '',
        tolerance: null,
        aliases: [],
        codeTemplate: `
# Thompson Sampling for CTR. Fill the TODOs and print:
# ANSWER:<total_clicks>
# Allowed libs: math, random, statistics, numpy

import random

# True CTRs (hidden from the algorithm)
true_ctrs = [0.02, 0.05, 0.07]

def draw_click(p):
    return 1 if random.random() < p else 0

def thompson(num_rounds=1000):
    # Start with Beta(1,1) priors for each arm
    alpha = [1,1,1]
    beta  = [1,1,1]
    clicks = 0
    for t in range(num_rounds):
        # TODO: sample from Beta(alpha_i, beta_i) for each arm
        # pick argmax sample, observe reward, update alpha/beta
        pass
    return clicks

if __name__=="__main__":
    total = thompson(1000)
    print(f"ANSWER:{total}")
`.trim(),
      },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());



