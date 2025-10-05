import { prisma } from '../src/lib/db.js';

type P = {
  prompt: string;
  codeTemplate: string;
};

const problems: P[] = [
  // ===== 1–2. Naive Bayes Spam Filter (2)
  {
    prompt: `Naive Bayes Spam Filter (No smoothing)
Given train/test tokens with labels (spam/ham). Implement a multinomial Naive Bayes classifier WITHOUT smoothing, then WITH Laplace smoothing (alpha=1). Print two lines:
ANSWER: acc_no_smoothing
ANSWER: acc_laplace
(Use only math/random/statistics/numpy if needed.)`,
    codeTemplate: `# Implement multinomial Naive Bayes for spam filtering.
# REQUIRED: print two lines exactly as:
# ANSWER: <acc_without_smoothing>
# ANSWER: <acc_with_laplace>

train = [
    (["win","cash","now"], "spam"),
    (["limited","offer","cash"], "spam"),
    (["meet","for","lunch"], "ham"),
    (["project","meeting","schedule"], "ham"),
    (["cheap","viagra","offer"], "spam"),
    (["see","you","tonight"], "ham"),
    (["earn","money","fast"], "spam"),
    (["family","dinner","plans"], "ham"),
]

test = [
    (["cash","offer","now"], "spam"),
    (["project","plans"], "ham"),
    (["viagra","cheap"], "spam"),
    (["see","you","at","lunch"], "ham"),
]

from collections import Counter, defaultdict
# import numpy as np  # optional

def train_nb(dataset, alpha=0.0):
    # TODO: build class priors and token likelihoods with smoothing alpha
    return {"priors": {}, "lik": {}}

def predict(model, tokens):
    # TODO: return "spam" or "ham"
    return "ham"

def accuracy(model, dataset):
    # TODO
    return 0.0

# === student work ===
m0 = train_nb(train, alpha=0.0)
a0 = accuracy(m0, test)
m1 = train_nb(train, alpha=1.0)
a1 = accuracy(m1, test)
print("ANSWER:", round(a0, 3))
print("ANSWER:", round(a1, 3))
`,
  },
  {
    prompt: `Naive Bayes Spam — Token log-space
Re-implement NB above using log-probabilities to avoid underflow. Report:
ANSWER: acc_log_no_smoothing
ANSWER: acc_log_laplace`,
    codeTemplate: `# Use log-space: log P(class) + sum log P(token|class)
from collections import Counter, defaultdict
import math

train = [
    (["win","cash","now"], "spam"),
    (["limited","offer","cash"], "spam"),
    (["meet","for","lunch"], "ham"),
    (["project","meeting","schedule"], "ham"),
    (["cheap","viagra","offer"], "spam"),
    (["see","you","tonight"], "ham"),
    (["earn","money","fast"], "spam"),
    (["family","dinner","plans"], "ham"),
]

test = [
    (["cash","offer","now"], "spam"),
    (["project","plans"], "ham"),
    (["viagra","cheap"], "spam"),
    (["see","you","at","lunch"], "ham"),
]

def train_nb_log(dataset, alpha=0.0):
    # TODO
    return {"log_prior": {}, "log_lik": {}}

def predict_log(model, tokens):
    # TODO
    return "ham"

def accuracy(model, dataset):
    # TODO
    return 0.0

m0 = train_nb_log(train, 0.0)
a0 = accuracy(m0, test)
m1 = train_nb_log(train, 1.0)
a1 = accuracy(m1, test)
print("ANSWER:", round(a0, 3))
print("ANSWER:", round(a1, 3))
`,
  },

  // ===== 3–4. Bayesian CTR / Thompson Sampling (2)
  {
    prompt: `Bayesian CTR — Posterior Beta and Thompson Sampling (2 arms)
Two ads: A and B. Observed clicks/impressions:
A: 20 clicks / 200 views
B: 12 clicks / 120 views
Use Beta(1,1) priors. (1) Print posterior means for A and B.
(2) Simulate Thompson Sampling for 10,000 rounds using these posteriors as starting points; assume each round shows one ad and the user clicks with the ad's true CTR (sample once at start from posteriors as proxies).
Print two lines:
ANSWER: mean_A  mean_B
ANSWER: ts_total_clicks`,
    codeTemplate: `import random
import math

# Given aggregates:
A_clicks, A_views = 20, 200
B_clicks, B_views = 12, 120

# Priors Beta(1,1)
def beta_posterior(alpha0, beta0, clicks, views):
    # TODO: return (alpha_post, beta_post)
    return (1, 1)

def beta_mean(a, b):
    return a / (a + b)

# 1) compute posterior means
Aa, Ab = beta_posterior(1, 1, A_clicks, A_views)
Ba, Bb = beta_posterior(1, 1, B_clicks, B_views)
meanA = beta_mean(Aa, Ab)
meanB = beta_mean(Ba, Bb)

# 2) Thompson Sampling for 10k rounds
def sample_beta(a, b):
    # TODO: you may use random.betavariate(a,b)
    return random.betavariate(a, b)

# Treat a single sampled CTR from posteriors as the "true" CTRs for the simulation
true_ctr_A = sample_beta(Aa, Ab)
true_ctr_B = sample_beta(Ba, Bb)

def thompson_rounds(n=10_000):
    total_clicks = 0
    aA, bA = Aa, Ab
    aB, bB = Ba, Bb
    for _ in range(n):
        sA = sample_beta(aA, bA)
        sB = sample_beta(aB, bB)
        pick = 'A' if sA > sB else 'B'
        clicked = 1 if random.random() < (true_ctr_A if pick=='A' else true_ctr_B) else 0
        if pick=='A':
            aA += clicked; bA += 1 - clicked
        else:
            aB += clicked; bB += 1 - clicked
        total_clicks += clicked
    return total_clicks

ts_clicks = thompson_rounds()
print("ANSWER:", round(meanA, 6), round(meanB, 6))
print("ANSWER:", ts_clicks)
`,
  },
  {
    prompt: `Bayesian CTR — Explore vs Exploit (3 arms)
Arms with aggregates:
A: 5/50, B: 8/80, C: 30/400. Beta(1,1) priors.
Run Thompson Sampling 20,000 rounds and print:
ANSWER: counts_A counts_B counts_C
ANSWER: clicks_A clicks_B clicks_C`,
    codeTemplate: `import random

arms = {
    'A': {'clicks': 5,  'views': 50},
    'B': {'clicks': 8,  'views': 80},
    'C': {'clicks': 30, 'views': 400},
}

def sample_beta(a, b): return random.betavariate(a, b)

# Initialize posteriors
post = {k: {'a': 1+v['clicks'], 'b': 1 + (v['views']-v['clicks'])} for k,v in arms.items()}
true_ctr = {k: sample_beta(v['a'], v['b']) for k,v in post.items()}

counts = {k: 0 for k in arms}
clicks = {k: 0 for k in arms}

for _ in range(20_000):
    samples = {k: sample_beta(v['a'], v['b']) for k,v in post.items()}
    pick = max(samples, key=samples.get)
    counts[pick] += 1
    got = 1 if random.random() < true_ctr[pick] else 0
    clicks[pick] += got
    post[pick]['a'] += got
    post[pick]['b'] += 1-got

print("ANSWER:", counts['A'], counts['B'], counts['C'])
print("ANSWER:", clicks['A'], clicks['B'], clicks['C'])
`,
  },

  // ===== 5–6. Bayesian Updating (disease testing) (2)
  {
    prompt: `Bayesian Updating — Sequential tests
Disease prevalence prior p=0.02. Test sensitivity=0.95, specificity=0.98.
A patient gets: +, -, + (three independent tests).
Update the posterior after each result and print:
ANSWER: p1 p2 p3
(hint: use Bayes with complement for specificity)`,
    codeTemplate: `import math

prior = 0.02
sens = 0.95
spec = 0.98

def update(prior, is_positive):
    # P(D|+) = sens*prior / [sens*prior + (1-spec)*(1-prior)]
    # P(D|-) = (1-sens)*prior / [(1-sens)*prior + spec*(1-prior)]
    # TODO
    return prior

post1 = update(prior, True)
post2 = update(post1, False)
post3 = update(post2, True)

print("ANSWER:", round(post1, 6), round(post2, 6), round(post3, 6))
`,
  },
  {
    prompt: `Bayesian Updating — Compare to frequentist PPV
With the same parameters (prevalence 0.02, sens 0.95, spec 0.98):
Compute the positive predictive value (PPV) directly (frequentist) and compare to the Bayesian posterior after a single positive. Print:
ANSWER: ppv  bayes_posterior_after_plus`,
    codeTemplate: `prior = 0.02
sens = 0.95
spec = 0.98

def bayes_after_positive(p):
    # TODO
    return p

def ppv(prevalence, sensitivity, specificity):
    # PPV = TP / (TP + FP) with TP = sens*prev, FP = (1-spec)*(1-prev)
    # TODO
    return 0.0

b = bayes_after_positive(prior)
p = ppv(prior, sens, spec)
print("ANSWER:", round(p, 6), round(b, 6))
`,
  },

  // ===== 7–8. Bayes vs Frequency (coin bias) (2)
  {
    prompt: `Bayes vs Frequency — coin bias posterior vs MLE
Coin flips: 560 heads in 1,000 flips. Prior Beta(1,1).
Compute:
(1) MLE (frequentist) for p(heads)
(2) Bayesian posterior mean
Print:
ANSWER: mle  posterior_mean`,
    codeTemplate: `heads = 560
n = 1000

def mle_p(h, n):  # frequentist
    # TODO
    return 0.0

def bayes_post_mean(h, n, alpha0=1, beta0=1):
    # TODO
    return 0.0

print("ANSWER:", round(mle_p(heads, n), 6), round(bayes_post_mean(heads, n), 6))
`,
  },
  {
    prompt: `Bayes vs Frequency — simulate 1000-run experiment
True coin p=0.62. Repeat 1000 times: flip 50; compute MLE and posterior mean (Beta(1,1)).
Print the average of each over repetitions:
ANSWER: mean_mle  mean_bayes`,
    codeTemplate: `import random

def trial(true_p=0.62, n=50):
    # draw n flips; compute mle and bayes posterior mean
    # TODO
    return (0.0, 0.0)

R = 1000
mles, bays = [], []
for _ in range(R):
    m, b = trial()
    mles.append(m); bays.append(b)

def mean(xs): return sum(xs)/len(xs)
print("ANSWER:", round(mean(mles), 4), round(mean(bays), 4))
`,
  },

  // ===== 9–10. Bonus Bayes (2)
  {
    prompt: `MAP vs MLE — 1D Gaussian mean
Data ~ N(μ, σ²), σ known = 1. Prior μ ~ N(0, τ²) with τ=2.
Given samples x = [-0.1, 0.3, 0.5, -0.2].
Compute MLE(μ) and MAP(μ). Print:
ANSWER: mle  map`,
    codeTemplate: `import math

x = [-0.1, 0.3, 0.5, -0.2]
sigma2 = 1.0
tau2 = 4.0

def mle_mean(xs):
    # TODO: sample mean
    return 0.0

def map_mean(xs, tau2, sigma2):
    # posterior mean = (n/tau_post)*xbar? derive formula
    # For known sigma^2 and prior N(0,tau^2):
    # MAP = (n / (n + sigma2/tau2)) * xbar
    # TODO
    return 0.0

mle = mle_mean(x)
mapv = map_mean(x, tau2, sigma2)
print("ANSWER:", round(mle, 6), round(mapv, 6))
`,
  },
  {
    prompt: `Hierarchical Beta-Binomial — pooled vs separate
Two groups:
G1: 12/80, G2: 25/200. Prior Beta(1,1) for each group.
Compute:
(1) Separate posterior means for each group
(2) Pooled posterior mean using combined counts
Print:
ANSWER: g1_mean  g2_mean
ANSWER: pooled_mean`,
    codeTemplate: `def beta_mean(a,b): return a/(a+b)
g1 = {'c':12,'n':80}
g2 = {'c':25,'n':200}

g1m = beta_mean(1+g1['c'], 1+g1['n']-g1['c'])
g2m = beta_mean(1+g2['c'], 1+g2['n']-g2['c'])
poolm = beta_mean(1+g1['c']+g2['c'], 1+(g1['n']-g1['c'])+(g2['n']-g2['c']))

print("ANSWER:", round(g1m,6), round(g2m,6))
print("ANSWER:", round(poolm,6))
`,
  },
];

async function main() {
  for (const p of problems) {
    await prisma.problem.create({
      data: {
        prompt: p.prompt,
        type: 'STRING', // kept as STRING; grader uses CODE via /grade
        answer: '',     // not used for code problems
        tolerance: null,
        aliases: [],
        codeTemplate: p.codeTemplate,
      },
    });
  }
  console.log(`Seeded ${problems.length} practice problems.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
