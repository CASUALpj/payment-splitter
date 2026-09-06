import { BrowserProvider, Contract } from "ethers";
import { FACTORY_ABI, FACTORY_ADDRESS, NETWORK, SPLITTER_ABI, ERC20_ABI } from "../config.js";

export function getEthereum() {
  if (typeof window !== "undefined" && window.ethereum) return window.ethereum;
  return null;
}

export async function connectWallet() {
  const eth = getEthereum();
  if (!eth) throw new Error("No wallet found. Install MetaMask or another injected wallet.");

  await eth.request({ method: "eth_requestAccounts" });
  await ensureNetwork(eth);

  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

export async function ensureNetwork(eth) {
  const currentChainId = await eth.request({ method: "eth_chainId" });
  if (currentChainId === NETWORK.chainIdHex) return;

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK.chainIdHex }],
    });
  } catch (switchError) {
    // Chain not added to wallet yet — add it.
    if (switchError.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: NETWORK.chainIdHex,
            chainName: NETWORK.name,
            rpcUrls: [NETWORK.rpcUrl],
            blockExplorerUrls: [NETWORK.blockExplorer],
            nativeCurrency: NETWORK.nativeCurrency,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export function getFactoryContract(signerOrProvider) {
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, signerOrProvider);
}

export function getSplitterContract(address, signerOrProvider) {
  return new Contract(address, SPLITTER_ABI, signerOrProvider);
}

export function getErc20Contract(address, signerOrProvider) {
  return new Contract(address, ERC20_ABI, signerOrProvider);
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
