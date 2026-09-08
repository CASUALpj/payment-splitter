import { useEffect, useState } from 'react';
import { Loader2, Inbox, ChevronRight, RefreshCw } from 'lucide-react';
import type { WalletConnection } from '@/lib/wallet';
import { fetchOwnedSplitters } from '@/lib/splitter';
import { FACTORY_ADDRESS, shortAddress, explorerAddress } from '@/lib/config';
import SplitterDetail from './SplitterDetail';

interface Props {
  wallet: WalletConnection;
  refreshKey: number;
}

export default function MySplitters({ wallet, refreshKey }: Props) {
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const addrs = await fetchOwnedSplitters(wallet.address, wallet.provider, FACTORY_ADDRESS);
      setAddresses(addrs);
      setLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load splitters.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (wallet.address && wallet.provider) {
      setLoaded(false);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address, wallet.provider, refreshKey]);

  if (selected) {
    return (
      <SplitterDetail
        splitterAddress={selected}
        wallet={wallet}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Splitters</h2>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading your splitters...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && addresses.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <Inbox className="h-10 w-10 text-gray-600" />
          <div>
            <p className="text-sm font-medium text-gray-400">No splitters yet</p>
            <p className="mt-1 text-xs text-gray-600">
              Create one from the Create tab to get started.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <button
              key={addr}
              onClick={() => setSelected(addr)}
              className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-emerald-500/30 hover:bg-white/[0.05]"
            >
              <div className="min-w-0 flex-1">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(explorerAddress(addr), '_blank');
                  }}
                  className="font-mono text-sm font-medium text-white group-hover:text-emerald-400"
                >
                  {shortAddress(addr)}
                </span>
                <p className="mt-1 text-xs text-gray-600">{addr}</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-600 transition-all group-hover:translate-x-1 group-hover:text-emerald-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
