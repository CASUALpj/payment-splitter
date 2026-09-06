// Fill this in once you've deployed PaymentSplitterFactory and have its address.
// You can also set it via an env var (VITE_FACTORY_ADDRESS) instead of hardcoding —
// see .env.example.
export const FACTORY_ADDRESS =
  import.meta.env.VITE_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";

// Base mainnet by default. Switch to Base Sepolia (84532) while testing.
export const NETWORK = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID) || 8453,
  chainIdHex: "0x" + (Number(import.meta.env.VITE_CHAIN_ID) || 8453).toString(16),
  name: import.meta.env.VITE_CHAIN_NAME || "Base",
  rpcUrl: import.meta.env.VITE_RPC_URL || "https://mainnet.base.org",
  blockExplorer: import.meta.env.VITE_EXPLORER_URL || "https://basescan.org",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

export const FACTORY_ABI = [
  "function implementation() view returns (address)",
  "function createSplitter(address[] recipients, uint256[] sharesBps) returns (address)",
  "function getSplittersByOwner(address owner) view returns (address[])",
  "function totalSplitters() view returns (uint256)",
  "function allSplitters(uint256) view returns (address)",
  "event SplitterCreated(address indexed owner, address indexed splitter)",
];

export const SPLITTER_ABI = [
  "function owner() view returns (address)",
  "function getRecipients() view returns (address[], uint256[])",
  "function updateDistribution(address[] recipients, uint256[] sharesBps)",
  "function transferOwnership(address newOwner)",
  "function payETH(bytes32 refId) payable",
  "function payToken(address token, uint256 amount, bytes32 refId)",
  "function withdraw(address token)",
  "function balances(address token, address recipient) view returns (uint256)",
  "event PaymentReceived(address indexed payer, address indexed token, uint256 amount, bytes32 indexed refId)",
  "event AutoDistributed(address indexed recipient, address indexed token, uint256 amount)",
  "event CreditedForWithdrawal(address indexed recipient, address indexed token, uint256 amount)",
  "event Withdrawn(address indexed recipient, address indexed token, uint256 amount)",
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
