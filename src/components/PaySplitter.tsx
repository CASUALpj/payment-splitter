import { useState } from 'react';
import { Loader2, Send, AlertCircle, Search, Coins } from 'lucide-react';
import { encodeBytes32String, keccak256, parseEther, parseUnits, toUtf8Bytes } from 'ethers';
import type { WalletConnection } from '@/lib/wallet';
import { getSplitterContract, getErc20Contract } from '@/lib/wallet';
import { NETWORK, shortAddress, explorerAddress } from '@/lib/config';

interface Props {
  wallet: WalletConnection;
}

function toRefId(text: string): string {
  if (!text) return '0x' + '0'.repeat(64);
  try {
    return encodeBytes32String(text);
  } catch {
    return keccak256(toUtf8Bytes(text));
  }
}

export default function PaySplitter({ wallet }: Props) {
  const [address, setAddress] = useState('');
  const [mode, setMode] = useState<'eth' | 'token'>('eth');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [refId, setRefId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePay() {
    setError(null);
    setSuccess(null);

    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setError('Enter a valid 0x-prefixed splitter address.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }

    setSending(true);
    try {
      const splitter = getSplitterContract(address.trim(), wallet.signer);
      const ref = toRefId(refId);

      if (mode === 'eth') {
        const tx = await splitter.payETH(ref, { value: parseEther(amount) });
        await tx.wait();
        setSuccess(tx.hash);
      } else {
        if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.trim())) {
          setError('Enter a valid token address.');
          setSending(false);
          return;
        }
        const token = getErc20Contract(tokenAddress.trim(), wallet.signer);
        const decimals = await token.decimals();
        const value = parseUnits(amount, decimals);

        const approveTx = await token.approve(address.trim(), value);
        await approveTx.wait();

        const payTx = await splitter.payToken(tokenAddress.trim(), value, ref);
        await payTx.wait();
        setSuccess(payTx.hash);
      }

      setAmount('');
      setRefId('');
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Payment failed.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Pay a Splitter</h2>
        <p className="mt-1 text-sm text-gray-400">
          Pay into any splitter contract. Funds are distributed to its recipients instantly based on
          their share percentages.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Splitter Address
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="0x... splitter contract address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-gray-900/50 py-3 pl-10 pr-3 font-mono text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:bg-gray-900"
            />
          </div>
          {address && /^0x[a-fA-F0-9]{40}$/.test(address) && (
            <a
              href={explorerAddress(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-xs text-gray-500 hover:text-emerald-400"
            >
              View {shortAddress(address)} on explorer →
            </a>
          )}
        </div>

        <div className="flex gap-1 rounded-xl border border-white/10 bg-gray-900/50 p-1">
          <button
            type="button"
            onClick={() => setMode('eth')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              mode === 'eth'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            ETH
          </button>
          <button
            type="button"
            onClick={() => setMode('token')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              mode === 'token'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Coins className="h-3.5 w-3.5" />
            ERC-20
          </button>
        </div>

        {mode === 'token' && (
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-400">
              Token Address
            </label>
            <input
              type="text"
              placeholder="0x... token contract address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-gray-900/50 px-3 py-3 font-mono text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:bg-gray-900"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Amount {mode === 'eth' ? `(${NETWORK.currencySymbol})` : ''}
          </label>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-gray-900/50 px-3 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:bg-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Reference ID (optional)
          </label>
          <input
            type="text"
            placeholder="order-1234"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-gray-900/50 px-3 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:bg-gray-900"
          />
          <p className="mt-1.5 text-xs text-gray-600">
            Used to tag this payment — handy for matching to orders on your backend.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Payment sent and distributed! Transaction{' '}
            <a
              href={`${NETWORK.explorerUrl}/tx/${success}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-emerald-400 hover:underline"
            >
              {shortAddress(success)}
            </a>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-60"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === 'eth' ? 'Sending...' : 'Approving & Sending...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {mode === 'eth' ? `Send ${amount || '0'} ${NETWORK.currencySymbol}` : 'Approve & Pay'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
