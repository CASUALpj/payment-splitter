# Ledger — Payment Splitter Frontend

React + Vite frontend for the `PaymentSplitterFactory` / `PaymentSplitter` contracts.
Lets anyone deploy their own splitter, manage its distribution, and pay into any splitter.

## 1. Wire up your contract address

Once you've deployed `PaymentSplitterFactory` and have its address:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_FACTORY_ADDRESS=0xYourDeployedFactoryAddress
```

Defaults to Base mainnet. For Base Sepolia testing, also set:

```
VITE_CHAIN_ID=84532
VITE_CHAIN_NAME=Base Sepolia
VITE_RPC_URL=https://sepolia.base.org
VITE_EXPLORER_URL=https://sepolia.basescan.org
```

## 2. Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. You'll need MetaMask (or any injected wallet) installed.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Payment splitter frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 4. Deploy on Vercel

- Go to vercel.com → New Project → import your GitHub repo.
- Framework preset: Vite (auto-detected).
- Add the same environment variables from `.env` in the Vercel project settings
  (Settings → Environment Variables) — `VITE_FACTORY_ADDRESS` at minimum.
- Deploy.

Vercel builds with `npm run build` and serves the `dist/` folder automatically — no extra config needed.

## What's included

- **Create** — deploy a new splitter clone via the factory, set recipients and % splits.
- **Your splitters** — lists splitters you've deployed, lets you view any splitter by address,
  edit distribution (owner only), and withdraw any balance stuck from a failed auto-push.
- **Pay** — send ETH or an ERC-20 into any splitter address; funds distribute instantly on-chain.

## Notes

- Payments auto-distribute to recipients in the same transaction (see `AutoDistributed` event).
  The "withdraw" flow only matters if a push transfer to a recipient failed
  (e.g. a contract that reverts on receiving ETH) — those funds get credited instead of lost,
  and show up under "Your withdrawable balance" on the splitter's detail view.
- Reference IDs longer than 31 characters are hashed with keccak256 instead of packed into
  bytes32 directly — your backend listener should handle both cases the same way it already does
  (it just compares the raw bytes32 value).
