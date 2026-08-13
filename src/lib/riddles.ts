export type Riddle = {
  prompt: string;
  answer: string;
  decoys: string[];
};

export const RIDDLES: Riddle[] = [
  {
    prompt: 'What does SIP-2 (Position Yield) distribute to eligible open positions?',
    answer: 'A configurable portion of protocol fee flow',
    decoys: ['Newly minted DUSD', 'Reward Vault subsidies', 'Shield Vault payouts'],
  },
  {
    prompt: 'On StandX, what serves as the unified pricing and margin asset for perpetuals?',
    answer: 'DUSD, a yield-bearing stablecoin',
    decoys: ['USDC', 'ETH', 'A standalone margin token'],
  },
  {
    prompt: 'What does SIP-5 let anyone do on the StandX engine?',
    answer: 'Create, fund, and maintain their own market',
    decoys: ['Mint NFTs only', 'Vote on funding rates', 'Pause the matching engine'],
  },
  {
    prompt: 'Which two vaults sit at the heart of every Universal Market under SIP-5?',
    answer: 'Reward Vault and Shield Vault',
    decoys: ['Insurance Fund and Treasury', 'Maker Pool and LP Pool', 'Strategy Vault and Fee Vault'],
  },
  {
    prompt: 'What does the Reward Vault do in a StandX market?',
    answer: 'Hires and funds community market makers',
    decoys: ['Absorbs liquidation losses', 'Sets the funding rate', 'Mints new DUSD'],
  },
  {
    prompt: 'What does the Shield Vault absorb before ADL triggers?',
    answer: 'Extreme liquidation losses ahead of auto-deleveraging',
    decoys: ['Trading fees', 'Funding payments', 'Maker uptime penalties'],
  },
  {
    prompt: 'What does SIP-1 (Block Trade) improve for large execution?',
    answer: 'Block execution of large orders off the public order book',
    decoys: ['Retail referral rewards', 'Spot LP incentives', 'Governance voting weight'],
  },
  {
    prompt: 'What does SIP-3 (DUSD Native Yield Expansion) route back into?',
    answer: 'The DUSD yield system from platform trading fees',
    decoys: ['A separate insurance fund', 'External liquidity pools', 'NFT staking rewards'],
  },
  {
    prompt: 'What does SIP-4 (Block Options) turn exit intent into?',
    answer: 'An on-chain option-like right attached to positions',
    decoys: ['A spot limit order', 'A governance proposal', 'A new market listing'],
  },
  {
    prompt: 'Who built the StandX platform?',
    answer: 'The core members of the original Binance Futures founding team',
    decoys: ['A DAO of anonymous devs', 'A traditional bank', 'A single independent trader'],
  },
];

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export type Round = {
  prompt: string;
  options: string[];
  answerIndex: number;
};

function toRound(riddle: Riddle): Round {
  const options = shuffle([riddle.answer, ...riddle.decoys]);
  return {
    prompt: riddle.prompt,
    options,
    answerIndex: options.indexOf(riddle.answer),
  };
}

export function buildDoorRounds(doorCount: number): Round[] {
  return shuffle(RIDDLES).slice(0, doorCount).map(toRound);
}
