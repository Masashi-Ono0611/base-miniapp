"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "../../components";
import { useAccount } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionStatus,
  TransactionStatusLabel,
} from "@coinbase/onchainkit/transaction";
import { createPublicClient, encodeFunctionData, http, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";


export default function Page() {
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{ title: string; link: string; points: string }>(
    { title: "", link: "", points: "" },
  );

  const valid = useMemo(() => {
    if (!form.title.trim() || !form.link.trim()) return false;
    if (form.points.trim() === "") return false; // must be explicitly provided
    const p = Number(form.points);
    return Number.isFinite(p) && p >= 0;
  }, [form]);

  const { address } = useAccount();
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}` | undefined;
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined;

  const [decimals, setDecimals] = useState<number>(18);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [txKey, setTxKey] = useState<number>(0);

  const client = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  const erc20Abi = useMemo(
    () => [
      { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
      {
        type: "function",
        name: "allowance",
        stateMutability: "view",
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
      },
      {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ] as const,
    []
  );
  const vaultAbi = useMemo(
    () => [
      {
        type: "function",
        name: "deposit",
        stateMutability: "nonpayable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: [],
      },
    ] as const,
    []
  );

  const refresh = useCallback(async () => {
    if (!address || !tokenAddress || !vaultAddress) return;
    try {
      const [dec, allw] = await Promise.all([
        client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }) as Promise<number>,
        client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "allowance", args: [address, vaultAddress] }) as Promise<bigint>,
      ]);
      setDecimals(dec);
      setAllowance(allw);
    } catch {
      // ignore
    }
  }, [address, tokenAddress, vaultAddress, client, erc20Abi]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    // Transaction will be sent via TransactionButton; this handler just guards default submit
  };

  const amountBI = useMemo(() => {
    if (!valid) return 0n;
    try {
      return parseUnits(form.points, decimals);
    } catch {
      return 0n;
    }
  }, [form.points, decimals, valid]);

  const calls = useMemo(() => {
    if (!address || !tokenAddress || !vaultAddress) return [] as { to: `0x${string}`; data: `0x${string}`; value: bigint }[];
    if (amountBI <= 0n) return [] as { to: `0x${string}`; data: `0x${string}`; value: bigint }[];
    const txs: { to: `0x${string}`; data: `0x${string}`; value: bigint }[] = [];
    if (allowance < amountBI) {
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [vaultAddress, amountBI],
      });
      txs.push({ to: tokenAddress, data: approveData as `0x${string}`, value: 0n });
    }
    const depositData = encodeFunctionData({ abi: vaultAbi, functionName: "deposit", args: [amountBI] });
    txs.push({ to: vaultAddress, data: depositData as `0x${string}`, value: 0n });
    return txs;
  }, [address, tokenAddress, vaultAddress, amountBI, allowance, erc20Abi, vaultAbi]);

  const onTxSuccess = useCallback(
    async () => {
      try {
        // After successful deposit, create quest in DB
        const res = await fetch("/api/quests/admin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            link: form.link.trim(),
            points: Number(form.points),
          }),
        });
        if (!res.ok) throw new Error("Failed to save quest after deposit");
        await res.json().catch(() => undefined);
        // reset form and trigger allowance refresh for next add
        setForm({ title: "", link: "", points: "" });
        setTxKey((k) => k + 1);
        await refresh();
      } catch (err) {
        console.error(err);
        setError("Deposit succeeded, but saving quest failed.");
      }
    },
    [form, refresh]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Admin: Quests">
        <div className="space-y-4">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm text-[var(--app-foreground-muted)]">
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Follow X account"
                  className="mt-1 w-full rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-2"
                />
              </label>
              <label className="text-sm text-[var(--app-foreground-muted)]">
                Link
                <input
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="https://x.com/"
                  className="mt-1 w-full rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-2"
                />
              </label>
              <label className="text-sm text-[var(--app-foreground-muted)]">
                Points
                <input
                  value={form.points}
                  onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                  placeholder="100"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-md border border-[var(--app-card-border)] bg-[var(--app-card-bg)] px-3 py-2"
                />
              </label>
            </div>
            {/* Clear button removed as requested */}
          </form>

          {!tokenAddress || !vaultAddress ? (
            <p className="text-yellow-400 text-sm">Set NEXT_PUBLIC_TOKEN_ADDRESS and NEXT_PUBLIC_VAULT_ADDRESS in .env</p>
          ) : null}

          {address ? (
            <Transaction
              key={txKey}
              calls={calls}
              onSuccess={onTxSuccess}
              onError={() => setError("Transaction failed")}
            >
              <TransactionButton className={`text-white text-md ${!valid || calls.length === 0 ? "opacity-50 pointer-events-none" : ""}`} />
              <TransactionStatus>
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-2">
                <TransactionToastIcon />
                <TransactionToastLabel />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm">Connect your wallet to deposit and add quest</p>
          )}

          {/* Current Tasks list is intentionally omitted */}
        </div>
      </Card>
    </div>
  );
}
