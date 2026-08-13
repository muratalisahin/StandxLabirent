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
  {
    prompt: 'What is DUSD designed to do besides act as margin?',
    answer: 'Earn native yield while being used in the system',
    decoys: ['Stay a zero-yield stablecoin', 'Only exist as an NFT', 'Replace the matching engine'],
  },
  {
    prompt: 'Why does SIP-1 keep large trades off the public book?',
    answer: 'To reduce market impact for block-size execution',
    decoys: ['To hide all retail orders', 'To mint extra DUSD', 'To freeze funding payments'],
  },
  {
    prompt: 'Who can receive SIP-2 Position Yield?',
    answer: 'Eligible open positions',
    decoys: ['Only liquidated traders', 'Only offline market makers', 'Anyone holding an NFT'],
  },
  {
    prompt: 'SIP-3 expands DUSD yield mainly by using what source?',
    answer: 'Platform trading fees',
    decoys: ['Random airdrops', 'Credit-card payments', 'Proof-of-work mining'],
  },
  {
    prompt: 'In SIP-4, a trader’s wish to exit can become what?',
    answer: 'An option-like on-chain right on the position',
    decoys: ['A forced liquidation', 'A new governance token', 'A spot market listing'],
  },
  {
    prompt: 'SIP-5 Universal Markets are meant to let users do what?',
    answer: 'Launch and maintain their own markets',
    decoys: ['Shut down StandX permanently', 'Print unlimited DUSD', 'Skip all risk checks'],
  },
  {
    prompt: 'What is the Shield Vault’s job in a Universal Market?',
    answer: 'Take extreme losses before auto-deleveraging',
    decoys: ['Pay referral bonuses', 'Set social-media policy', 'Host the front-end website'],
  },
  {
    prompt: 'What is the Reward Vault’s job in a Universal Market?',
    answer: 'Fund community market makers',
    decoys: ['Store user passwords', 'Replace DUSD', 'Ban all takers'],
  },
  {
    prompt: 'What does ADL stand for in this maze’s Shield Vault question?',
    answer: 'Auto-deleveraging',
    decoys: ['Average daily liquidity', 'Automated deposit limit', 'Asset distribution list'],
  },
  {
    prompt: 'StandX perpetuals use one asset for pricing and margin. Which one?',
    answer: 'DUSD',
    decoys: ['BTC only', 'A different token per market', 'Gold bars'],
  },
  {
    prompt: 'A Universal Market under SIP-5 is built around which pair of vaults?',
    answer: 'Reward Vault and Shield Vault',
    decoys: ['Cold Wallet and Hot Wallet', 'Spot Pool and Farm Pool', 'Oracle Hub and Bridge Hub'],
  },
  {
    prompt: 'What kind of orders does SIP-1 target?',
    answer: 'Large block orders',
    decoys: ['Tiny dust transfers', 'Email newsletters', 'Gasless memes'],
  },
  {
    prompt: 'Position Yield (SIP-2) is paid from what kind of flow?',
    answer: 'Protocol fee flow',
    decoys: ['Validator slash penalties', 'Credit interest from banks', 'Random lottery tickets'],
  },
  {
    prompt: 'If Shield Vault protection is exhausted, what can trigger next?',
    answer: 'Auto-deleveraging (ADL)',
    decoys: ['A website redesign', 'Free NFT mints', 'A halt of all wallets forever'],
  },
  {
    prompt: 'What makes DUSD different from a plain fiat stablecoin in StandX lore?',
    answer: 'It is yield-bearing',
    decoys: ['It cannot be transferred', 'It is only used for NFTs', 'It has no price'],
  },
  {
    prompt: 'SIP-4 Block Options attach the new right to what?',
    answer: 'Existing positions',
    decoys: ['Random Discord roles', 'Validator keys', 'Email inboxes'],
  },
  {
    prompt: 'Who is SIP-5 trying to empower on the engine?',
    answer: 'Anyone who wants to create a market',
    decoys: ['Only one admin forever', 'Only centralized banks', 'Only liquidators'],
  },
  {
    prompt: 'StandX is primarily a venue for what product?',
    answer: 'Perpetual markets',
    decoys: ['Food delivery', 'Video streaming', 'Physical gold storage'],
  },
  {
    prompt: 'What should happen to SIP doors in this labyrinth?',
    answer: 'They must be opened in order from SIP-1 to SIP-5',
    decoys: ['Open SIP-5 first', 'Skip SIP-3 forever', 'Break them all at once'],
  },
  {
    prompt: 'Where do SIP-3 fees get routed?',
    answer: 'Back into the DUSD yield system',
    decoys: ['To a mystery off-chain account', 'To a meme coin burn', 'To a hidden NFT gallery'],
  },
  {
    prompt: 'Community market makers in SIP-5 are hired through which vault?',
    answer: 'The Reward Vault',
    decoys: ['The Shield Vault', 'A personal hardware wallet', 'The exit flower'],
  },
  {
    prompt: 'What is the maze mascot’s name?',
    answer: 'Stander',
    decoys: ['Doge', 'Pikachu', 'Vitalik'],
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
