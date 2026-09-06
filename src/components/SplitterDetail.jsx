import { useEffect, useMemo, useState } from "react";
import { getSplitterContract, shortenAddress } from "../lib/wallet.js";
import { NETWORK, ZERO_ADDRESS } from "../config.js";

export default function SplitterDetail({ splitterAddress, signer, provider, connectedAddress }) {
  const [recipients, setRecipients] = useState([]);
  const [shares, setShares] = useState([]);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ethBalance, setEthBalance] = useState(null);
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenBalance, setTokenBalance] = useState(null);

  const isOwner = connectedAddress && owner && connectedAddress.toLowerCase() === owner.toLowerCase();

  async function load() {
    setLoading(true);
    try {
      const contract = getSplitterContract(splitterAddress, provider);
      const [recips, bps] = await contract.getRecipients();
      const own = await contract.owner();
      setRecipients(recips);
      setShares(bps.map((b) => Number(b)));
      setOwner(own);
      setEditRows(recips.map((r, i) => ({ address: r, pct: (Number(bps[i]) / 100).toString() })));

      if (connectedAddress) {
        const bal = await contract.balances(ZERO_ADDRESS, connectedAddress);
        setEthBalance(bal);
      }
    } catch (err) {
      setStatus({ type: "error", text: "Couldn't load splitter data. Wrong network or address?" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (splitterAddress && provider) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitterAddress, provider, connectedAddress]);

  const editTotal = useMemo(
    () => editRows.reduce((sum, r) => sum + (parseFloat(r.pct) || 0), 0),
    [editRows]
  );
  const editBalanced = Math.round(editTotal * 100) === 10000;

  function updateEditRow(i, field, value) {
    const next = [...editRows];
    next[i] = { ...next[i], [field]: value };
    setEditRows(next);
  }

  function addEditRow() {
    setEditRows([...editRows, { address: "", pct: "" }]);
  }

  function removeEditRow(i) {
    if (editRows.length <= 2) return;
    setEditRows(editRows.filter((_, idx) => idx !== i));
  }

  async function submitUpdate() {
    if (!editBalanced) {
      setStatus({ type: "error", text: "Splits must add up to exactly 100%." });
      return;
    }
    const addrs = editRows.map((r) => r.address.trim());
    if (addrs.some((a) => !/^0x[a-fA-F0-9]{40}$/.test(a))) {
      setStatus({ type: "error", text: "One or more addresses look invalid." });
      return;
    }
    const sharesBps = editRows.map((r) => Math.round(parseFloat(r.pct) * 100));

    try {
      setSubmitting(true);
      setStatus({ type: "info", text: "Confirm in your wallet…" });
      const contract = getSplitterContract(splitterAddress, signer);
      const tx = await contract.updateDistribution(addrs, sharesBps);
      setStatus({ type: "info", text: `Updating — tx ${tx.hash.slice(0, 10)}…` });
      await tx.wait();
      setStatus({ type: "success", text: "Distribution updated." });
      setEditing(false);
      await load();
    } catch (err) {
      setStatus({ type: "error", text: err.shortMessage || err.message || "Transaction failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function withdrawEth() {
    try {
      setSubmitting(true);
      setStatus({ type: "info", text: "Confirm in your wallet…" });
      const contract = getSplitterContract(splitterAddress, signer);
      const tx = await contract.withdraw(ZERO_ADDRESS);
      await tx.wait();
      setStatus({ type: "success", text: "ETH withdrawn." });
      await load();
    } catch (err) {
      setStatus({ type: "error", text: err.shortMessage || err.message || "Withdrawal failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function checkTokenBalance() {
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.trim())) {
      setStatus({ type: "error", text: "Enter a valid token address." });
      return;
    }
    try {
      const contract = getSplitterContract(splitterAddress, provider);
      const bal = await contract.balances(tokenAddress.trim(), connectedAddress);
      setTokenBalance(bal);
    } catch {
      setStatus({ type: "error", text: "Couldn't read token balance." });
    }
  }

  async function withdrawToken() {
    try {
      setSubmitting(true);
      setStatus({ type: "info", text: "Confirm in your wallet…" });
      const contract = getSplitterContract(splitterAddress, signer);
      const tx = await contract.withdraw(tokenAddress.trim());
      await tx.wait();
      setStatus({ type: "success", text: "Token withdrawn." });
      setTokenBalance(null);
    } catch (err) {
      setStatus({ type: "error", text: err.shortMessage || err.message || "Withdrawal failed." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="section-desc">Loading splitter…</p>;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-addr">{splitterAddress}</div>
          {isOwner && <span className="owner-badge">You own this</span>}
        </div>
        <a
          href={`${NETWORK.blockExplorer}/address/${splitterAddress}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: "var(--ink-faint)" }}
        >
          View on explorer
        </a>
      </div>

      {!editing ? (
        <>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th style={{ textAlign: "right" }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r, i) => (
                <tr key={r}>
                  <td>{shortenAddress(r)}</td>
                  <td className="pct">{(shares[i] / 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {isOwner && (
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              Edit distribution
            </button>
          )}
        </>
      ) : (
        <div>
          {editRows.map((row, i) => (
            <div className="recipient-row" key={i}>
              <input
                type="text"
                value={row.address}
                onChange={(e) => updateEditRow(i, "address", e.target.value)}
              />
              <input
                type="number"
                value={row.pct}
                min="0"
                max="100"
                step="0.01"
                onChange={(e) => updateEditRow(i, "pct", e.target.value)}
              />
              <button
                type="button"
                className="remove-row"
                onClick={() => removeEditRow(i)}
                disabled={editRows.length <= 2}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addEditRow}>
            + Add recipient
          </button>
          <div className={`split-total ${editBalanced ? "balanced" : "unbalanced"}`}>
            <span>Total allocated</span>
            <span>{editTotal.toFixed(2)}%</span>
          </div>
          <div className="actions-row">
            <button className="btn-primary" onClick={submitUpdate} disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </button>
            <button className="btn-secondary" onClick={() => setEditing(false)} disabled={submitting}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {connectedAddress && (
        <>
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line-soft)" }}>
            <div className="field">
              <label>Your withdrawable ETH balance</label>
              <div className="actions-row" style={{ alignItems: "center" }}>
                <span className="balance-pill">
                  {ethBalance !== null ? `${formatEth(ethBalance)} ETH` : "—"}
                </span>
                <button
                  className="btn-secondary"
                  onClick={withdrawEth}
                  disabled={submitting || !ethBalance || ethBalance === 0n}
                >
                  Withdraw
                </button>
              </div>
              <p className="field-hint">
                Payments auto-distribute instantly — this only shows up if a push transfer
                failed and funds are waiting for manual withdrawal.
              </p>
            </div>

            <div className="field">
              <label>Check a token balance</label>
              <div className="recipient-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <input
                  type="text"
                  placeholder="ERC-20 token address"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                />
                <button className="btn-secondary" onClick={checkTokenBalance}>
                  Check
                </button>
              </div>
              {tokenBalance !== null && (
                <div className="actions-row" style={{ marginTop: 10 }}>
                  <span className="balance-pill">{tokenBalance.toString()} (raw units)</span>
                  <button
                    className="btn-secondary"
                    onClick={withdrawToken}
                    disabled={submitting || tokenBalance === 0n}
                  >
                    Withdraw
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {status && <div className={`status-line ${status.type}`}>{status.text}</div>}
    </div>
  );
}

function formatEth(wei) {
  try {
    return (Number(wei) / 1e18).toFixed(6).replace(/\.?0+$/, "") || "0";
  } catch {
    return "0";
  }
}
