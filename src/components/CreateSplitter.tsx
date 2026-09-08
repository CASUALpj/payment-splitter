import { useMemo, useState } from 'react';
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import type { WalletConnection } from '@/lib/wallet';
import { getFactoryContract } from '@/lib/wallet';
import { NETWORK, shortAddress, explorerAddress } from '@/lib/config';

interface Props {
  wallet: WalletConnection;
  onCreated: () => void;
}

interface Row {
  address: string;
  pct: string;
}

function emptyRow(): Row {
  return { address: '', pct: '' };
}

export default function CreateSplitter({ wallet, onCreated }: Props) {
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow()]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ addr: string; tx: string } | null>(null);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.pct) || 0), 0),
    [rows]
  );
  const balanced = Math.round(total * 100) === 10000;

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    setError(null);
    setSuccess(null);

    if (!balanced) {
      setError('Splits must add up to exactly 100%.');
      return;
    }

    const addrs = rows.map((r) => r.address.trim());
    if (addrs.some((a) => !/^0x[a-fA-F0-9]{40}$/.test(a))) {
      setError('All addresses must be valid 0x-prefixed Ethereum addresses.');
      return;
    }

    const sharesBps = rows.map((r) => Math.round(parseFloat(r.pct) * 100));

    setCreating(true);
    try {
      const factory = getFactoryContract(wallet.signer);
      const tx = await factory.createSplitter(addrs, sharesBps);
      const receipt = await tx.wait();

      const event = receipt?.logs
        .map((log: any) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === 'SplitterCreated');

      const splitterAddr = event?.args?.splitter as string;
      setSuccess({ addr: splitterAddr, tx: tx.hash });
      setRows([emptyRow(), emptyRow()]);
      onCreated();
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Failed to create splitter.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Users className="h-6 w-6 text-emerald-400" />
          Create a Payment Splitter
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Deploy a new on-chain splitter. Add recipients and their percentage split — funds sent to
          the contract are distributed proportionally. You own the splitter and can edit it anytime.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row, i) => (
          <div
            key={i}
            className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 sm:flex-row sm:items-center"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-bold text-emerald-400">
              {i + 1}
            </div>
            <input
              type="text"
              placeholder="0x... wallet address"
              value={row.address}
              onChange={(e) => updateRow(i, 'address', e.target.value)}
              className="w-full flex-1 rounded-lg border border-white/10 bg-gray-900/50 px-3 py-2.5 font-mono text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:bg-gray-900"
            />
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  value={row.pct}
                  onChange={(e) => updateRow(i, 'pct', e.target.value)}
                  className="w-24 rounded-lg border border-white/10 bg-gray-900/50 px-3 py-2.5 pr-7 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:bg-gray-900"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
              </div>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addRow}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-sm font-medium text-gray-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Add Recipient
        </button>

        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
            balanced
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : total > 0
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <span className="text-sm font-medium text-gray-400">Total allocated</span>
          <span
            className={`font-mono text-sm font-bold ${
              balanced ? 'text-emerald-400' : total > 0 ? 'text-amber-400' : 'text-gray-500'
            }`}
          >
            {total.toFixed(2)}%
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Splitter deployed successfully
            </div>
            <div className="mt-2 space-y-1 text-xs text-gray-400">
              <p>
                Address:{' '}
                <a
                  href={explorerAddress(success.addr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-400 hover:underline"
                >
                  {shortAddress(success.addr)}
                </a>
              </p>
              <p>
                Transaction:{' '}
                <a
                  href={`${NETWORK.explorerUrl}/tx/${success.tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-400 hover:underline"
                >
                  {shortAddress(success.tx)}
                </a>
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-60"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying to {NETWORK.name}...
            </>
          ) : (
            'Deploy Splitter'
          )}
        </button>
      </div>
    </div>
  );
}
