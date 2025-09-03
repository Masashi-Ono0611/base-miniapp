"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";
import Card from "../ui/Card";
import useFid from "../hooks/useFid";
import { createPublicClient, http, encodeFunctionData, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";

// ABIs
const erc20Abi = [
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

const vaultAbi = [
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "remainingClaimable", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

export default function ClaimTxCard() {
  const { address } = useAccount();
  const fid = useFid();
  const [points, setPoints] = useState<number>(0);
  const [decimals, setDecimals] = useState<number>(18);
  const [remainingClaim, setRemainingClaim] = useState<bigint>(0n);
  const [vaultLiquidity, setVaultLiquidity] = useState<bigint>(0n);
  const [txKey, setTxKey] = useState<number>(0);
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}` | undefined;
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined;

  const client = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    [],
  );

  const refresh = useCallback(async () => {
    if (!address || !tokenAddress || !vaultAddress) return;
    try {
      const [dec, rem, vaultBal] = await Promise.all([
        client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }) as Promise<number>,
        client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "remainingClaimable", args: [address] }) as Promise<bigint>,
        client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [vaultAddress] }) as Promise<bigint>,
      ]);
      setDecimals(dec);
      setRemainingClaim(rem);
      setVaultLiquidity(vaultBal);
    } catch {
      // ignore
    }
  }, [address, tokenAddress, vaultAddress, client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Fetch Bonsai Points for current fid
  useEffect(() => {
    if (!fid) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/points?fid=${encodeURIComponent(fid)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        const next = typeof data.points === "number" ? data.points : Number(data.points ?? 0) || 0;
        setPoints(next);
      } catch {
        // ignore
      }
    })();
    return () => controller.abort();
  }, [fid]);

  const { calls, disabled } = useMemo(() => {
    type Call = { to: `0x${string}`; data: `0x${string}`; value: bigint };
    const empty = { calls: [] as Call[], disabled: true };
    if (!address || !vaultAddress) return empty;
    const pts = Number(points || 0);
    if (!pts || pts <= 0) return { calls: [] as Call[], disabled: true };
    const amt = parseUnits(String(pts), decimals);
    if (amt <= 0n) return { calls: [] as Call[], disabled: true };
    // Validate against remainingClaim and vaultLiquidity
    if (remainingClaim > 0n && amt > remainingClaim)
      return { calls: [] as Call[], disabled: true };
    if (vaultLiquidity > 0n && amt > vaultLiquidity)
      return { calls: [] as Call[], disabled: true };

    const claimData = encodeFunctionData({ abi: vaultAbi, functionName: "claim", args: [amt] });
    return { calls: [{ to: vaultAddress, data: claimData as `0x${string}`, value: 0n }], disabled: false };
  }, [address, vaultAddress, points, decimals, remainingClaim, vaultLiquidity]);

  const sendNotification = useNotification();

  const handleSuccess = useCallback(
    async (response: TransactionResponse) => {
      const transactionHash = response.transactionReceipts[0].transactionHash;
      console.log(`Claim tx successful: ${transactionHash}`);
      await sendNotification({ title: "Claimed!", body: `Tx: ${transactionHash}` });
      await refresh();
      // Reset Bonsai Points to 0 for the fid
      try {
        if (fid) {
          await fetch("/api/points/reset", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fid }),
          });
          // Re-fetch points
          const res = await fetch(`/api/points?fid=${encodeURIComponent(fid)}`, { cache: "no-store" });
          const data = await res.json().catch(() => ({ points: 0 }));
          const next = typeof data.points === "number" ? data.points : Number(data.points ?? 0) || 0;
          setPoints(next);
          // Notify other components (e.g., PointsSummary) to refresh
          try {
            window.dispatchEvent(
              new CustomEvent("bonsai:points-updated", { detail: { fid, points: next } })
            );
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      setTxKey((k) => k + 1);
    },
    [sendNotification, refresh, fid],
  );

  return (
    <Card title="Claim">
      <div className="space-y-4">
        {!tokenAddress || !vaultAddress ? (
          <p className="text-yellow-400 text-sm">Set NEXT_PUBLIC_TOKEN_ADDRESS and NEXT_PUBLIC_VAULT_ADDRESS in .env</p>
        ) : null}

        <div className="w-full space-y-2">
          {address && tokenAddress && vaultAddress ? (
            <div className="text-xs text-[var(--app-foreground-muted)] space-y-1">
              <div>Your claimable amount: {Number(remainingClaim) / 10 ** decimals}</div>
              <div>Vault liquidity: {Number(vaultLiquidity) / 10 ** decimals}</div>
            </div>
          ) : null}
        </div>

        {address ? (
          <Transaction
            key={txKey}
            calls={calls}
            onSuccess={handleSuccess}
            onError={(error: TransactionError) => console.error("Claim tx failed:", error)}
          >
            <TransactionButton className="text-white text-md" disabled={disabled} />
            <TransactionStatus>
              <TransactionStatusLabel />
            </TransactionStatus>
            <TransactionToast className="mb-4">
              <TransactionToastIcon />
              <TransactionToastLabel />
            </TransactionToast>
          </Transaction>
        ) : (
          <p className="text-yellow-400 text-sm text-center mt-2">Connect your wallet to claim</p>
        )}
      </div>
    </Card>
  );
}
