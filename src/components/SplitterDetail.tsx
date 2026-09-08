import { useEffect, useMemo, useState } from 'react';
import { Loader2, ArrowLeft, ExternalLink, Users, Pencil, Save, X, Wallet, Coins } from 'lucide-react';
import type { WalletConnection } from '@/lib/wallet';
import { getSplitterContract, getSplitterReadOnly } from '@/lib/wallet';
import { formatEther } from '@/lib/wallet';
import { shortAddress, explorerAddress, ZERO_ADDRESS } from '@/lib/config';

interface Props {
  splitterAddress: string;
  wallet: WalletConnection;
  onBack: () => void;
}

interface Row {
  address: string;
  pct: string;
}

export default function SplitterDetail({ splitterAddress, wallet, onBack }: Props) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [shares, setShares] = useState<number[]>([]);
  const [owner, setOwner] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editRows, setEditRows] = useState<Row[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);

  const isOwner =
    wallet.address && owner && wallet.address.toLowerCase() === owner.toLowerCase();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const c = getSplitterReadOnly(splitterAddress, wallet.provider);
      const [recips, bps] = await c.getRecipients() as [string[], bigint[]];
      const own = await c.owner() as string;
      setRecipients(recips);
      setShares(bps.map((b) => Number(b)));
      setOwner(own);
      setEditRows(recips.map((r, i) => ({ address: r, pct: (Number(bps[i]) / 100).toString() })));

      const bal = await c.balances(ZERO_ADDRESS, wallet.address) as bigint;
      setEthBalance(bal);
    } catch (err: any) {
      setError('Could not load splitter data. Wrong network or address?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (splitterAddress && wallet.provider) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitterAddress, wallet.provider, wallet.address]);

  const editTotal = useMemo(
    () => editRows.reduce((sum, r) => sum + (parseFloat(r.pct) || 0), 0),
    [editRows]
  );
  const editBalanced = Math.round(editTotal * 100) === 10000;

  function updateEditRow(i: number, field: keyof Row, value: string) {
    setEditRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function addEditRow() {
    setEditRows((prev) => [...prev, { address: '', pct: '' }]);
  }

  function removeEditRow(i: number) {
    if (editRows.length <= 1) return;
    setEditRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submitUpdate() {
    if (!editBalanced) {
      setError('Splits must add up to exactly 100%.');
      return;
    }
    const addrs = editRows.map((r) => r.address.trim());
    if (addrs.some((a) => !/^0x[a-fA-F0-9]{40}$/.test(a))) {
      setError('One or more addresses look invalid.');
      return;
    }
    const sharesBps = editRows.map((r) => Math.round(parseFloat(r.pct) * 100));

    setSubmitting(true);
    setError(null);
    try {
      const c = getSplitterContract(splitterAddress, wallet.signer);
      const tx = await c.updateDistribution(addrs, sharesBps);
      await tx.wait();
      setSuccess('Distribution updated.');
      setEditing(false);
      await load();
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function withdrawEth() {
    setSubmitting(true);
    setError(null);
    try {
      const c = getSplitterContract(splitterAddress, wallet.signer);
      const tx = await c.withdraw(ZERO_ADDRESS);
      await tx.wait();
      setSuccess('ETH withdrawn.');
      await load();
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Withdrawal failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function checkTokenBalance() {
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.trim())) {
      setError('Enter a valid token address.');
      return;
    }
    setError(null);
    try {
      const c = getSplitterReadOnly(splitterAddress, wallet.provider);
      const bal = await c.balances(tokenAddress.trim(), wallet.address) as bigint;
      setTokenBalance(bal);
    } catch {
      setError('Could not read token balance.');
    }
  }

  async function withdrawToken() {
    setSubmitting(true);
    setError(null);
    try {
      const c = getSplitterContract(splitterAddress, wallet.signer);
      const tx = await c.withdraw(tokenAddress.trim());
      await tx.wait();
      setSuccess('Token withdrawn.');
      setTokenBalance(null);
      await load();
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Withdrawal failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading splitter...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </button>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Splitter Details</h2>
            <a
              href={explorerAddress(splitterAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1.5 font-mono text-sm text-emerald-400 hover:underline"
            >
              {shortAddress(splitterAddress)}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {isOwner && (
              <span className="mt-2 inline-block rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                You own this
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Contract Balance</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-white">
              {Number(formatEther(ethBalance ?? 0n)).toFixed(4)} ETH
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Recipients</h3>
          </div>
          {isOwner && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="divide-y divide-white/5">
            {recipients.map((r, i) => (
              <div
                key={r}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <a
                  href={explorerAddress(r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-sm text-white hover:text-emerald-400"
                >
                  {shortAddress(r)}
                  <ExternalLink className="h-3 w-3 flex-shrink-0 text-gray-500" />
                </a>
                <span className="font-mono text-sm font-semibold text-emerald-400">
                  {(shares[i] / 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 p-5">
            {editRows.map((row, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="0x..."
                  value={row.address}
                  onChange={(e) => updateEditRow(i, 'address', e.target.value)}
                  className="w-full flex-1 rounded-lg border border-white/10 bg-gray-900/50 px-3 py-2 font-mono text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50"
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
                      onChange={(e) => updateEditRow(i, 'pct', e.target.value)}
                      className="w-24 rounded-lg border border-white/10 bg-gray-900/50 px-3 py-2 pr-7 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                  </div>
                  {editRows.length > 1 && (
                    <button
                      onClick={() => removeEditRow(i)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={addEditRow}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-2.5 text-sm font-medium text-gray-400 hover:border-emerald-500/40 hover:text-emerald-400"
            >
              + Add Recipient
            </button>
            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${
                editBalanced
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <span className="text-xs text-gray-400">Total allocated</span>
              <span
                className={`font-mono text-sm font-bold ${
                  editBalanced ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {editTotal.toFixed(2)}%
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={submitUpdate}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={submitting}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Your Withdrawable Balance</h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-white">
            {ethBalance !== null ? `${Number(formatEther(ethBalance)).toFixed(6)} ETH` : '—'}
          </span>
          <button
            onClick={withdrawEth}
            disabled={submitting || !ethBalance || ethBalance === 0n}
            className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Withdraw ETH
          </button>
        </div>

        <div className="border-t border-white/5 pt-4">
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Token Withdrawal
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0x... token address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-gray-900/50 px-3 py-2 font-mono text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50"
            />
            <button
              onClick={checkTokenBalance}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/5"
            >
              Check
            </button>
          </div>
          {tokenBalance !== null && (
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-sm text-white">
                {Number(formatEther(tokenBalance)).toFixed(6)} tokens
              </span>
              <button
                onClick={withdrawToken}
                disabled={submitting || tokenBalance === 0n}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Coins className="h-3 w-3" />
                Withdraw Token
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}
    </div>
  );
}
