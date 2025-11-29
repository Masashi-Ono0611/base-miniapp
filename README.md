# BonsaiBaseApp

BonsaiBaseApp is a Mini App built on Base that lets users earn **Bonsai Points** by completing quests and later claim **BCT tokens** from a shared onchain Vault.

Key characteristics:

- Quest-based point system backed by a database API
- Per-address claim limit enforced onchain (up to **10,000 BCT** cumulatively)
- Vault liquidity checks so users can only claim while the Vault has enough funds
- Admin UI to seed quests and fund the Vault from the browser

Under the hood, BonsaiBaseApp is a [Next.js](https://nextjs.org) project bootstrapped with `create-onchain --mini` and extended for this use case.

## Getting Started

1. Install dependencies (this project uses `pnpm` by default):
```bash
pnpm install
```

2. Verify environment variables, these will be set up by the `npx create-onchain --mini` command:

You can regenerate the FARCASTER Account Association environment variables by running `npx create-onchain --manifest` in your project directory.

The environment variables enable the following features:

- Frame metadata - Sets up the Frame Embed that will be shown when you cast your frame
- Account association - Allows users to add your frame to their account, enables notifications
- Redis API keys - Enable Webhooks and background notifications for your application by storing users notification details

```bash
# Shared/OnchainKit variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME=
NEXT_PUBLIC_URL=
NEXT_PUBLIC_ICON_URL=
NEXT_PUBLIC_ONCHAINKIT_API_KEY=

# Frame metadata
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=
NEXT_PUBLIC_APP_ICON=
NEXT_PUBLIC_APP_SUBTITLE=
NEXT_PUBLIC_APP_DESCRIPTION=
NEXT_PUBLIC_APP_SPLASH_IMAGE=
NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR=
NEXT_PUBLIC_APP_PRIMARY_CATEGORY=
NEXT_PUBLIC_APP_HERO_IMAGE=
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_APP_OG_TITLE=
NEXT_PUBLIC_APP_OG_DESCRIPTION=
NEXT_PUBLIC_APP_OG_IMAGE=

# Redis config
REDIS_URL=
REDIS_TOKEN=
```

3. Start the development server:
```bash
pnpm dev
```

## App Features

### User Experience
- **Home / Quests**: users see available quests and their current Bonsai Points.
- **Claim page (`/claim`)**: shows remaining claimable BCT, Vault liquidity, and lets the user submit an onchain claim transaction.
- **MiniKit integration**: FIDs and Farcaster context are read via MiniKit so the app behaves correctly inside Mini Apps.

### Smart Contracts
- **BonsaiCoinTest (BCT)**
  - ERC‑20 token used as the reward currency.
- **Vault**
  - Holds BCT liquidity for all users.
  - Enforces a per-address cumulative claim cap (10,000 BCT).
  - Exposes functions for deposits and claims.

### Admin Flow
- `/admin` page:
  - Create a new quest and fund the Vault in one flow.
  - Uses the connected wallet to approve and deposit BCT into the Vault.
- `/admin-login` page:
  - Simple password-gated access to the admin area.

## Customization

To get started building your own frame, follow these steps:

1. Remove the DemoComponents:
   - Delete `components/DemoComponents.tsx`
   - Remove demo-related imports from `page.tsx`

2. Start building your Frame:
   - Modify `page.tsx` to create your Frame UI
   - Update theme variables in `theme.css`
   - Adjust MiniKit configuration in `providers.tsx`

3. Add your frame to your account:
   - Cast your frame to see it in action
   - Share your frame with others to start building your community

## Learn More

- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://docs.base.org/builderkits/onchainkit/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Tech Stack & Tooling

BonsaiBaseApp is built with:

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Onchain integration**: OnchainKit, MiniKit, wagmi 2.x, viem 2.x
- **Styling**: Tailwind CSS 4, custom theme in `theme.css`
- **State / data**: TanStack Query 5, Upstash Redis for notifications
- **Smart contracts**: Hardhat 2.26, `@nomicfoundation/hardhat-toolbox` 4.x
- **Tooling**: ESLint 9 (flat config), Prettier 3, pnpm

---

## Bonsai Vault Claiming

This project includes a Vault contract that lets each wallet address claim up to **10,000 BCT in total** without any prior deposit, as long as the Vault has enough liquidity.

### Prerequisites
- For Base Sepolia deployment, set the following environment variables in your `.env`:
  - `BASE_SEPOLIA_RPC_URL`
  - `PRIVATE_KEY`
- For the frontend:
  - `NEXT_PUBLIC_TOKEN_ADDRESS`
  - `NEXT_PUBLIC_VAULT_ADDRESS`

### Deploy and Fund the Vault
1. Deploy contracts to Base Sepolia:
   ```bash
   pnpm run deploy:base-sepolia
   ```
   The `scripts/deploy.js` script deploys the ERC-20 token (`BonsaiCoinTest`) and `Vault`, then sends an initial amount of tokens to the Vault.

2. Configure initial funding amount:
   - Default: `200,000 BCT`.
   - Override with the `FUND_AMOUNT_BCT` environment variable (e.g. `FUND_AMOUNT_BCT=300000`).

3. After deployment, copy the printed values into your `.env`:
   - `NEXT_PUBLIC_TOKEN_ADDRESS=...`
   - `NEXT_PUBLIC_VAULT_ADDRESS=...`

### Claiming from the Frontend
- Open the `/claim` page.
- The `Claim` card shows:
  - `Remaining claimable`: your remaining personal claim limit
  - `Vault liquidity`: the Vault's token balance
- You can claim up to your individual limit (10,000 BCT cumulative). Requests above the limit or above Vault liquidity will fail.

### Tests
```bash
pnpm run hh test
```
This runs all Vault tests, including deposit, withdraw, and claim behavior.

### Notes
- Hardhat is best run on a Node.js LTS version (e.g. 20.x). Newer Node versions may print warnings.

