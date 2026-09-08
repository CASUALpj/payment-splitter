import { Loader2, Wallet } from 'lucide-react';
import type { WalletConnection } from '@/lib/wallet';
import { NETWORK, shortAddress } from '@/lib/config';

interface Props {
  wallet: WalletConnection | null;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
}

export default function ConnectWallet({ wallet, connecting, error, onConnect }: Props) {
  if (wallet) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-sm font-medium text-emerald-100">
          {shortAddress(wallet.address)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={onConnect}
        disabled={connecting}
        className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
      >
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4 transition-transform group-hover:scale-110" />
        )}
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <p className="max-w-xs text-right text-xs text-red-400">{error}</p>
      )}
      <p className="text-xs text-gray-500">{NETWORK.name}</p>
    </div>
  );
}
