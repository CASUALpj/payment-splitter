import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { FACTORY_ADDRESS, FACTORY_ABI, SPLITTER_ABI, ERC20_ABI, NETWORK } from './config';

export interface WalletConnection {
  provider: BrowserProvider;
  signer: Awaited<ReturnType<BrowserProvider['getSigner']>>;
  address: string;
}

export async function connectWallet(): Promise<WalletConnection> {
  if (!window.ethereum) {
    throw new Error('No wallet found. Please install MetaMask or another injected wallet.');
  }

  const provider = new BrowserProvider(window.ethereum as any);
  const accounts = await provider.send('eth_requestAccounts', []);

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== NETWORK.chainId) {
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: '0x' + NETWORK.chainId.toString(16) },
      ]);
    } catch (switchErr: any) {
      if (switchErr?.code === 4902) {
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: '0x' + NETWORK.chainId.toString(16),
            chainName: NETWORK.name,
            rpcUrls: [NETWORK.rpcUrl],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: [NETWORK.explorerUrl],
          },
        ]);
      } else {
        throw new Error(`Please switch to ${NETWORK.name} (chain ID ${NETWORK.chainId}).`);
      }
    }
  }

  const signer = await provider.getSigner();
  const address = accounts[0];
  return { provider, signer, address };
}

export function getFactoryContract(signer: WalletConnection['signer']) {
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
}

export function getFactoryReadOnly(provider: BrowserProvider) {
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
}

export function getSplitterContract(address: string, signer: WalletConnection['signer']) {
  return new Contract(address, SPLITTER_ABI, signer);
}

export function getSplitterReadOnly(address: string, provider: BrowserProvider) {
  return new Contract(address, SPLITTER_ABI, provider);
}

export function getErc20Contract(address: string, signer: WalletConnection['signer']) {
  return new Contract(address, ERC20_ABI, signer);
}

export function getErc20ReadOnly(address: string, provider: BrowserProvider) {
  return new Contract(address, ERC20_ABI, provider);
}

export { formatEther, parseEther };
