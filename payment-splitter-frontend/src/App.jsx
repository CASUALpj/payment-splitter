import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet.jsx";
import CreateSplitter from "./components/CreateSplitter.jsx";
import MySplitters from "./components/MySplitters.jsx";
import PaySplitter from "./components/PaySplitter.jsx";
import { connectWallet } from "./lib/wallet.js";
import { NETWORK } from "./config.js";

const TABS = [
  { id: "create", label: "Create" },
  { id: "manage", label: "Your splitters" },
  { id: "pay", label: "Pay" },
];

export default function App() {
  const [tab, setTab] = useState("create");
  const [wallet, setWallet] = useState({ provider: null, signer: null, address: null });
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleConnect() {
    setConnectError(null);
    setConnecting(true);
    try {
      const { provider, signer, address } = await connectWallet();
      setWallet({ provider, signer, address });
    } catch (err) {
      setConnectError(err.message || "Couldn't connect wallet.");
    } finally {
      setConnecting(false);
    }
  }

  function handleCreated() {
    setRefreshKey((k) => k + 1);
    setTab("manage");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1 className="wordmark">
            Ledger<span>.</span>
          </h1>
          <div className="network-tag">{NETWORK.name} · payment splitters</div>
        </div>
        <div>
          <ConnectWallet address={wallet.address} onConnect={handleConnect} connecting={connecting} />
          {connectError && (
            <div className="status-line error" style={{ marginTop: 10, maxWidth: 260 }}>
              {connectError}
            </div>
          )}
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "create" && (
          <CreateSplitter signer={wallet.signer} address={wallet.address} onCreated={handleCreated} />
        )}
        {tab === "manage" && (
          <MySplitters
            provider={wallet.provider}
            signer={wallet.signer}
            address={wallet.address}
            refreshKey={refreshKey}
          />
        )}
        {tab === "pay" && <PaySplitter signer={wallet.signer} address={wallet.address} />}
      </main>
    </div>
  );
}
