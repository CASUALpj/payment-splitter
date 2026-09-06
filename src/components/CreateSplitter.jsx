import { useMemo, useState } from "react";
import { getFactoryContract } from "../lib/wallet.js";
import { NETWORK } from "../config.js";

function emptyRow() {
  return { address: "", pct: "" };
}

export default function CreateSplitter({ signer, address, onCreated }) {
  const [rows, setRows] = useState([emptyRow(), emptyRow()]);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.pct) || 0), 0),
    [rows]
  );
  const balanced = Math.round(total * 100) === 10000;

  function updateRow(i, field, value) {
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  }

  function addRow() {
    setRows([...rows, emptyRow()]);
  }

  function removeRow(i) {
    if (rows.length <= 2) return;
    setRows(rows.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!signer) {
      setStatus({ type: "error", text: "Connect your wallet first." });
      return;
    }
    if (!balanced) {
      setStatus({ type: "error", text: "Splits must add up to exactly 100%." });
      return;
    }
    const addrs = rows.map((r) => r.address.trim());
    if (addrs.some((a) => !/^0x[a-fA-F0-9]{40}$/.test(a))) {
      setStatus({ type: "error", text: "One or more recipient addresses look invalid." });
      return;
    }

    const sharesBps = rows.map((r) => Math.round(parseFloat(r.pct) * 100));

    try {
      setSubmitting(true);
      setStatus({ type: "info", text: "Confirm the transaction in your wallet…" });
      const factory = getFactoryContract(signer);
      const tx = await factory.createSplitter(addrs, sharesBps);
      setStatus({ type: "info", text: `Deploying splitter — tx ${tx.hash.slice(0, 10)}…` });
      const receipt = await tx.wait();

      // Pull the new clone address out of the SplitterCreated event
      const event = receipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === "SplitterCreated");

      const newAddress = event ? event.args.splitter : null;

      setStatus({
        type: "success",
        text: newAddress
          ? `Splitter deployed at ${newAddress}.`
          : "Splitter deployed. Check the list below.",
      });
      setRows([emptyRow(), emptyRow()]);
      onCreated?.(newAddress);
    } catch (err) {
      setStatus({ type: "error", text: err.shortMessage || err.message || "Transaction failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="section-title">Create a splitter</h2>
      <p className="section-desc">
        Deploy your own payment splitter. You'll own it — set who gets paid and how much,
        change it anytime.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Recipients &amp; split</label>
          {rows.map((row, i) => (
            <div className="recipient-row" key={i}>
              <input
                type="text"
                placeholder="0x…"
                value={row.address}
                onChange={(e) => updateRow(i, "address", e.target.value)}
              />
              <input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                value={row.pct}
                onChange={(e) => updateRow(i, "pct", e.target.value)}
              />
              <button
                type="button"
                className="remove-row"
                onClick={() => removeRow(i)}
                aria-label="Remove recipient"
                disabled={rows.length <= 2}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addRow}>
            + Add recipient
          </button>

          <div className={`split-total ${balanced ? "balanced" : total > 0 ? "unbalanced" : ""}`}>
            <span>Total allocated</span>
            <span>{total.toFixed(2)}%</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Deploying…" : "Deploy splitter"}
        </button>
        <span className="field-hint" style={{ marginLeft: 14 }}>
          Deploys on {NETWORK.name}
        </span>
      </form>

      {status && <div className={`status-line ${status.type}`}>{status.text}</div>}
    </div>
  );
}
