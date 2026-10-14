import { Contract, formatEther, type BrowserProvider } from 'ethers';
import { getSplitterReadOnly } from './wallet';
import { ZERO_ADDRESS } from './config';

export interface SplitterDetail {
  address: string;
  recipients: string[];
  sharesBps: number[];
  owner: string;
  ethBalance: bigint;
  userBalance: bigint;
  subscriptionDurationDays: number;
  isSubscription: boolean;
  subscribed: boolean;
  subscriptionExpiry: number;
}

export async function fetchSplitterDetail(
  address: string,
  provider: BrowserProvider,
  connectedAddress?: string
): Promise<SplitterDetail> {
  const c = getSplitterReadOnly(address, provider);
  const [recipientsResult, owner, ethBalance, subDays] = await Promise.all([
    c.getRecipients() as Promise<[string[], bigint[]]>,
    c.owner() as Promise<string>,
    provider.getBalance(address),
    c.subscriptionDurationDays() as Promise<bigint>,
  ]);

  let userBalance = 0n;
  let subscribed = false;
  let subExpiry = 0;
  if (connectedAddress) {
    const [bal, isSub, subExp] = await Promise.all([
      c.balances(ZERO_ADDRESS, connectedAddress) as Promise<bigint>,
      c.isSubscribed(connectedAddress) as Promise<boolean>,
      c.subscriptionExpiry(connectedAddress) as Promise<bigint>,
    ]);
    userBalance = bal;
    subscribed = isSub;
    subExpiry = Number(subExp);
  }

  return {
    address,
    recipients: recipientsResult[0],
    sharesBps: recipientsResult[1].map((b) => Number(b)),
    owner,
    ethBalance,
    userBalance,
    subscriptionDurationDays: Number(subDays),
    isSubscription: Number(subDays) > 0,
    subscribed,
    subscriptionExpiry: subExpiry,
  };
}

export async function fetchOwnedSplitters(
  owner: string,
  provider: BrowserProvider,
  factoryAddress: string
): Promise<string[]> {
  const factory = new Contract(factoryAddress, [
    'function getSplittersByOwner(address owner) view returns (address[])',
  ], provider);
  const list = await factory.getSplittersByOwner(owner) as string[];
  return [...list].reverse();
}

export async function fetchSubscriptionInfo(
  address: string,
  provider: BrowserProvider
): Promise<{ durationDays: number; isSubscription: boolean }> {
  const c = getSplitterReadOnly(address, provider);
  const days = await c.subscriptionDurationDays() as bigint;
  return {
    durationDays: Number(days),
    isSubscription: Number(days) > 0,
  };
}

export function formatExpiry(expiry: number): string {
  if (expiry === 0) return 'Not subscribed';
  const now = Math.floor(Date.now() / 1000);
  if (expiry <= now) return 'Expired';
  const daysLeft = Math.ceil((expiry - now) / 86400);
  if (daysLeft <= 1) {
    const hoursLeft = Math.ceil((expiry - now) / 3600);
    return `${hoursLeft}h left`;
  }
  return `${daysLeft}d left`;
}
