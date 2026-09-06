import { useState } from "react";
import { encodeBytes32String, keccak256, parseEther, parseUnits, toUtf8Bytes } from "ethers";
import { getErc20Contract, getSplitterContract } from "../lib/wallet.js";

function toRefId(text) {
  if (!text) return "0x" + "0".repeat(64);
  try {
    return encodeBytes32String(text);
  } catch {
    // Longer than 31 bytes — hash it instead
    return keccak256(toUtf8Bytes(text));
  }
}

export default function PaySplitter({ signer, address }) {
  const [splitterAddress, setSplitterAddress] = useState("");
  const [mode, setMode] = useState("eth");
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [refId, setRefId] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePay(e) {
    e.preventDefault();
    if (!signer) {
      setStatus({ type: "error", text: "Connect your wallet first." });
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(splitterAddress.trim())) {
      setStatus({ type: "error", text: "Enter a valid splitter address." });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatus({ type: "error", text: "Enter an amount greater than 0." });
      return;
    }

    try {
      setSubmitting(true);
      const splitter = getSplitterContract(splitterAddress.trim(), signer);
      const ref = toRefId(refId);

      if (mode === "eth") {
        setStatus({ type: "info", text: "Confirm the payment in your wallet…" });
        const tx = await splitter.payETH(ref, { value: parseEther(amount) });
        setStatus({ type: "info", text: `Sending — tx ${tx.hash.slice(0, 10)}…` });
        await tx.wait();
        setStatus({ type: "success", text: "Payment sent and distributed." });
      } else {
        if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.trim())) {
          setStatus({ type: "error", text: "Enter a valid token address." });
          setSubmitting(false);
          return;
        }
        const token = getErc20Contract(tokenAddress.trim(), signer);
        const decimals = await token.decimals();
        const value = parseUnits(amount, decimals);

        setStatus({ type: "info", text: "Approving token spend…" });
        const approveTx = await token.approve(splitterAddress.trim(), value);
        await approveTx.wait();

        setStatus({ type: "info", text: "Confirm the payment in your wallet…" });
        const payTx = await splitter.payToken(tokenAddress.trim(), value, ref);
        setStatus({ type: "info", text: `Sending — tx ${payTx.hash.slice(0, 10)}…` });
        await payTx.wait();
        setStatus({ type: "success", text: "Payment sent and distributed." });
      }

      setAmount("");
      setRefId("");
    } catch (err) {
      setStatus({ type: "error", text: err.shortMessage || err.message || "Payment failed." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="section-title">Make a payment</h2>
      <p className="section-desc">
        Pay into any splitter. Funds are distributed to its recipients instantly.
      </p>

      <form onSubmit={handlePay}>
        <div className="field">
          <label>Splitter address</label>
          <input
            type="text"
            placeholder="0x…"
            value={splitterAddress}
            onChange={(e) => setSplitterAddress(e.target.value)}
          />
        </div>

        <div className="token-toggle">
          <button type="button" className={mode === "eth" ? "active" : ""} onClick={() => setMode("eth")}>
            ETH
          </button>
          <button type="button" className={mode === "token" ? "active" : ""} onClick={() => setMode("token")}>
            ERC-20
          </button>
        </div>

        {mode === "token" && (
          <div className="field">
            <label>Token address</label>
            <input
              type="text"
              placeholder="0x…"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <label>Amount</label>
          <input
            type="number"
            placeholder="0.0"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Reference ID (optional)</label>
          <input
            type="text"
            placeholder="order-1234"
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
          />
          <p className="field-hint">Used to match this payment to an order on your backend.</p>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Processing…" : mode === "eth" ? "Send payment" : "Approve & pay"}
        </button>
      </form>

      {status && <div className={`status-line ${status.type}`}>{status.text}</div>}
    </div>
  );
}
