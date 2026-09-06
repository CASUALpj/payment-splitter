import { useEffect, useState } from "react";
import { getFactoryContract, shortenAddress } from "../lib/wallet.js";
import SplitterDetail from "./SplitterDetail.jsx";

export default function MySplitters({ provider, signer, address, refreshKey }) {
  const [splitters, setSplitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [manualAddress, setManualAddress] = useState("");

  useEffect(() => {
    if (!provider || !address) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const factory = getFactoryContract(provider);
        const list = await factory.getSplittersByOwner(address);
        setSplitters([...list].reverse());
      } catch {
        setSplitters([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [provider, address, refreshKey]);

  if (!address) {
    return (
      <div>
        <h2 className="section-title">Your splitters</h2>
        <div className="empty-state">Connect your wallet to see splitters you own.</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title">Your splitters</h2>
      <p className="section-desc">Splitters deployed by your address. Click one to view or edit it.</p>

      {loading ? (
        <p className="section-desc">Loading…</p>
      ) : splitters.length === 0 ? (
        <div className="empty-state">
          You haven't deployed a splitter yet — head to the Create tab.
        </div>
      ) : (
        <div className="splitter-list">
          {splitters.map((addr) => (
            <div
              key={addr}
              className="splitter-row"
              onClick={() => setSelected(selected === addr ? null : addr)}
            >
              <div>
                <div className="splitter-addr">{shortenAddress(addr)}</div>
                <div className="splitter-meta">{addr}</div>
              </div>
              <span className="chevron">{selected === addr ? "−" : "→"}</span>
            </div>
          ))}
        </div>
      )}

      <div className="field" style={{ marginTop: 28 }}>
        <label>Or look up any splitter by address</label>
        <div className="recipient-row" style={{ gridTemplateColumns: "1fr auto" }}>
          <input
            type="text"
            placeholder="0x…"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
          />
          <button
            className="btn-secondary"
            onClick={() => setSelected(manualAddress.trim())}
            disabled={!/^0x[a-fA-F0-9]{40}$/.test(manualAddress.trim())}
          >
            View
          </button>
        </div>
      </div>

      {selected && (
        <SplitterDetail
          splitterAddress={selected}
          signer={signer}
          provider={provider}
          connectedAddress={address}
        />
      )}
    </div>
  );
}
