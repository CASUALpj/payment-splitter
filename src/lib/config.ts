export const NETWORK = {
  name: import.meta.env.VITE_CHAIN_NAME || 'Base',
  chainId: Number(import.meta.env.VITE_CHAIN_ID || 8453),
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://mainnet.base.org',
  explorerUrl: import.meta.env.VITE_EXPLORER_URL || 'https://basescan.org',
  currencySymbol: 'ETH',
};

export const FACTORY_ADDRESS =
  (import.meta.env.VITE_FACTORY_ADDRESS as string) || '0x0000000000000000000000000000000000000000';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const FACTORY_ABI = [
  'function implementation() view returns (address)',
  'function createSplitter(address[] recipients, uint256[] sharesBps) returns (address)',
  'function getSplittersByOwner(address owner) view returns (address[])',
  'function totalSplitters() view returns (uint256)',
  'function allSplitters(uint256) view returns (address)',
  'event SplitterCreated(address indexed owner, address indexed splitter)',
];

export const SPLITTER_ABI = [
  'function owner() view returns (address)',
  'function getRecipients() view returns (address[], uint256[])',
  'function updateDistribution(address[] recipients, uint256[] sharesBps)',
  'function transferOwnership(address newOwner)',
  'function payETH(bytes32 refId) payable',
  'function payToken(address token, uint256 amount, bytes32 refId)',
  'function withdraw(address token)',
  'function balances(address token, address recipient) view returns (uint256)',
];

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export function explorerAddress(address: string): string {
  return `${NETWORK.explorerUrl}/address/${address}`;
}

export function explorerTx(txHash: string): string {
  return `${NETWORK.explorerUrl}/tx/${txHash}`;
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
