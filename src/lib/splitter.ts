import { Contract, formatEther, type BrowserProvider } from 'ethers';
import { getFactoryReadOnly, getSplitterReadOnly } from './wallet';
import { ZERO_ADDRESS } from './config';

export interface RecipientInfo {
  address: string;
  sharesBps: number;
  pct: number;
}

export interface SplitterDetail {
  address: string;
  recipients: string[];
  sharesBps: number[];
  owner: string;
  ethBalance: bigint;
  userBalance: bigint;
}

export async function fetchSplitterDetail(
  address: string,
  provider: BrowserProvider,
  connectedAddress?: string
): Promise<SplitterDetail> {
  const c = getSplitterReadOnly(address, provider);
  const [recipients, sharesBps, owner, ethBalance] = await Promise.all([
    c.getRecipients() as Promise<[string[], bigint[]]>,
    Promise.resolve(null),
    c.owner() as Promise<string>,
    provider.getBalance(address),
  ]);

  let userBalance = 0n;
  if (connectedAddress) {
    userBalance = await c.balances(ZERO_ADDRESS, connectedAddress) as bigint;
  }

  return {
    address,
    recipients: recipients[0],
    sharesBps: recipients[1].map((b) => Number(b)),
    owner,
    ethBalance,
    userBalance,
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
