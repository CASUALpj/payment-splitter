import { useState } from 'react';
import { Plus, LayoutGrid, Send, Github, BookOpen } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import ConnectWallet from '@/components/ConnectWallet';
import CreateSplitter from '@/components/CreateSplitter';
import MySplitters from '@/components/MySplitters';
import PaySplitter from '@/components/PaySplitter';
import { connectWallet, type WalletConnection } from '@/lib/wallet';
import { NETWORK } from '@/lib/config';

type TabId = 'create' | 'manage' | 'pay';

const TABS: { id: TabId; label: string; icon: typeof Plus }[] = [
  { id: 'create', label: 'Create', icon: Plus },
  { id: 'manage', label: 'Your Splitters', icon: LayoutGrid },
  { id: 'pay', label: 'Pay', icon: Send },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('create');
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleConnect() {
    setConnectError(null);
    setConnecting(true);
    try {
      const conn = await connectWallet();
      setWallet(conn);
    } catch (err: any) {
      setConnectError(err.message || "Couldn't connect wallet.");
    } finally {
      setConnecting(false);
    }
  }

  function handleCreated() {
    setRefreshKey((k) => k + 1);
    setTab('manage');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-96 w-96 rounded-full bg-teal-500/5 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Ledger<span className="text-emerald-400">.</span>
              </h1>
              <p className="-mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
                {NETWORK.name} · payment splitters
              </p>
            </div>
          </div>

          <ConnectWallet
            wallet={wallet}
            connecting={connecting}
            error={connectError}
            onConnect={handleConnect}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {!wallet ? (
          <Hero onConnect={handleConnect} connecting={connecting} />
        ) : (
          <>
            <div className="mb-8 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2">
              <ErrorBoundary key={tab}>
                {tab === 'create' && <CreateSplitter wallet={wallet} onCreated={handleCreated} />}
                {tab === 'manage' && <MySplitters wallet={wallet} refreshKey={refreshKey} />}
                {tab === 'pay' && <PaySplitter wallet={wallet} />}
              </ErrorBoundary>
            </div>
          </>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-xs text-gray-600 sm:flex-row sm:px-6">
          <p>Ledger — on-chain payment splitter for {NETWORK.name}</p>
          <a
            href="https://github.com/CASUALpj/payment-splitter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-gray-400"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function Hero({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center sm:py-24">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-500/30">
        <BookOpen className="h-10 w-10 text-white" />
      </div>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
        Split payments on-chain,
        <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          fairly and transparently
        </span>
      </h2>
      <p className="mt-5 max-w-lg text-sm text-gray-400 sm:text-base">
        Create a payment splitter contract, add payees with custom share weights, and distribute
        funds proportionally — all settled on {NETWORK.name}.
      </p>
      <button
        onClick={onConnect}
        disabled={connecting}
        className="mt-8 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-60"
      >
        {connecting ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Connecting...
          </>
        ) : (
          'Connect Wallet to Begin'
        )}
      </button>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: 'Deploy', desc: 'Create a splitter with any number of payees and share weights.' },
          { title: 'Manage', desc: 'View balances, track distributions, and release funds to payees.' },
          { title: 'Pay', desc: 'Send ETH to any splitter — it routes proportionally to all payees.' },
        ].map((f, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-bold text-emerald-400">
              {i + 1}
            </div>
            <h3 className="text-sm font-semibold text-white">{f.title}</h3>
            <p className="mt-1 text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
