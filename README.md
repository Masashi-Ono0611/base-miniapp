# MiniKit Template

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain --mini`](), configured with:

- [MiniKit](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit](https://www.base.org/builders/onchainkit)
- [Tailwind CSS](https://tailwindcss.com)
- [Next.js](https://nextjs.org/docs)

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
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
npm run dev
```

## Template Features

### Frame Configuration
- `.well-known/farcaster.json` endpoint configured for Frame metadata and account association
- Frame metadata automatically added to page headers in `layout.tsx`

### Background Notifications
- Redis-backed notification system using Upstash
- Ready-to-use notification endpoints in `api/notify` and `api/webhook`
- Notification client utilities in `lib/notification-client.ts`

### Theming
- Custom theme defined in `theme.css` with OnchainKit variables
- Pixel font integration with Pixelify Sans
- Dark/light mode support through OnchainKit

### MiniKit Provider
The app is wrapped with `MiniKitProvider` in `providers.tsx`, configured with:
- OnchainKit integration
- Access to Frames context
- Sets up Wagmi Connectors
- Sets up Frame SDK listeners
- Applies Safe Area Insets

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

---

## Bonsai Vault クレーム機能（日本語）

本プロジェクトには、各ウォレットアドレスが累積で最大 10,000 BCT をデポジット無しでクレームできる Vault コントラクトが含まれています（Vault に十分な残高があることが条件）。

### 前提
- Base Sepolia へのデプロイ用に以下の環境変数を `.env` に設定してください:
  - `BASE_SEPOLIA_RPC_URL`
  - `PRIVATE_KEY`
- フロントエンド用:
  - `NEXT_PUBLIC_TOKEN_ADDRESS`
  - `NEXT_PUBLIC_VAULT_ADDRESS`

### デプロイと初期ファンド
1. コントラクトをデプロイします:
   ```bash
   pnpm run deploy:base-sepolia
   ```
   スクリプト `scripts/deploy.js` は、トークンと Vault をデプロイ後、Vault に初期ファンドを送金します。

2. 初期ファンド量の指定:
   - 既定値は `200,000 BCT` です。
   - 環境変数 `FUND_AMOUNT_BCT` で上書き可能です（例: `FUND_AMOUNT_BCT=300000`）。

3. スクリプトの出力に表示される以下の値を `.env` に反映してください:
   - `NEXT_PUBLIC_TOKEN_ADDRESS=...`
   - `NEXT_PUBLIC_VAULT_ADDRESS=...`

### フロントエンドでの操作
- 画面 `/claim` のカード（`TransactionCard`）にて、`Claim` タブを選択し、金額を入力して送信します。
- 画面には以下の情報が表示されます:
  - `Remaining claimable`: ユーザーが残りクレーム可能な量
  - `Vault liquidity`: Vault の保有残高
- クレーム上限はアドレス毎に 10,000 BCT（累積）です。超過リクエストは失敗します。

### テスト
```bash
pnpm run hh test
```
すべての Vault テスト（デポジット/引き出し/クレーム）が実行されます。

### 注意
- Hardhat は Node.js の LTS（推奨: 20.x）での実行を推奨します。最新 Node を利用すると警告が出る場合があります。
