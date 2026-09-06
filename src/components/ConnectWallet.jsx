import { shortenAddress } from "../lib/wallet.js";

export default function ConnectWallet({ address, onConnect, connecting }) {
  if (address) {
    return (
      <div className="wallet-connected">
        <span className="wallet-dot" />
        {shortenAddress(address)}
      </div>
    );
  }

  return (
    <button className="wallet-btn" onClick={onConnect} disabled={connecting}>
      {connecting ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
