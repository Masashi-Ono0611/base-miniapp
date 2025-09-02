"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
  TransactionError,
  TransactionResponse,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionStatus,
} from "@coinbase/onchainkit/transaction";
import { useNotification } from "@coinbase/onchainkit/minikit";
import Card from "../ui/Card";
import { createPublicClient, http, encodeFunctionData, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";

export default function TransactionCard() {
  const { address } = useAccount();
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState<string>("");
  const [decimals, setDecimals] = useState<number>(18);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [vaultBalance, setVaultBalance] = useState<bigint>(0n);
  const [allowance, setAllowance] = useState<bigint>(0n);
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}` | undefined;
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined;

  const client = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  const erc20Abi = [
    {
      type: "function",
      name: "decimals",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint8" }],
    },
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
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
  ] as const;

  const vaultAbi = [
    {
      type: "function",
      name: "deposit",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
    },
    {
      type: "function",
      name: "withdraw",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
    },
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const;

  // Load token decimals, balances, and allowance
  useEffect(() => {
    if (!address || !tokenAddress || !vaultAddress) return;
    let mounted = true;
    (async () => {
      try {
        const [dec, bal, allw, vbal] = await Promise.all([
          client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }) as Promise<number>,
          client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [address] }) as Promise<bigint>,
          client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "allowance", args: [address, vaultAddress] }) as Promise<bigint>,
          client.readContract({ address: vaultAddress, abi: vaultAbi, functionName: "balanceOf", args: [address] }) as Promise<bigint>,
        ]);
        if (!mounted) return;
        setDecimals(dec);
        setTokenBalance(bal);
        setAllowance(allw);
        setVaultBalance(vbal);
      } catch (e) {
        // ignore read errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, [address, tokenAddress, vaultAddress, client]);

  // Example transaction call - sending 0 ETH to self
  const calls = useMemo(() => {
    if (!address || !tokenAddress || !vaultAddress) return [] as { to: `0x${string}`; data: `0x${string}`; value: bigint }[];
    const amt = amount ? parseUnits(amount, decimals) : 0n;
    if (amt <= 0n) return [] as { to: `0x${string}`; data: `0x${string}`; value: bigint }[];

    const txs: { to: `0x${string}`; data: `0x${string}`; value: bigint }[] = [];

    if (mode === "deposit") {
      if (allowance < amt) {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultAddress, amt],
        });
        txs.push({ to: tokenAddress, data: approveData as `0x${string}`, value: 0n });
      }
      const depositData = encodeFunctionData({
        abi: vaultAbi,
        functionName: "deposit",
        args: [amt],
      });
      txs.push({ to: vaultAddress, data: depositData as `0x${string}`, value: 0n });
    } else {
      const withdrawData = encodeFunctionData({
        abi: vaultAbi,
        functionName: "withdraw",
        args: [amt],
      });
      txs.push({ to: vaultAddress, data: withdrawData as `0x${string}`, value: 0n });
    }

    return txs;
  }, [address, tokenAddress, vaultAddress, amount, decimals, mode, allowance]);

  const sendNotification = useNotification();

  const handleSuccess = useCallback(
    async (response: TransactionResponse) => {
      const transactionHash = response.transactionReceipts[0].transactionHash;

      console.log(`Transaction successful: ${transactionHash}`);

      await sendNotification({
        title: "Congratulations!",
        body: `You sent your a transaction, ${transactionHash}!`,
      });
    },
    [sendNotification]
  );

  return (
    <Card title="Make Your First Transaction">
      <div className="space-y-4">
        <p className="text-[var(--app-foreground-muted)] mb-4">Deposit/Withdraw BCT via Vault on Base Sepolia.</p>

        {!tokenAddress || !vaultAddress ? (
          <p className="text-yellow-400 text-sm">Set NEXT_PUBLIC_TOKEN_ADDRESS and NEXT_PUBLIC_VAULT_ADDRESS in .env</p>
        ) : null}

        <div className="flex flex-col items-center">
          <div className="w-full space-y-2">
            <div className="flex gap-2 justify-center">
              <button
                className={`px-3 py-1 rounded border ${mode === "deposit" ? "bg-blue-600 text-white" : "bg-[var(--app-card-bg)]"}`}
                onClick={() => setMode("deposit")}
                type="button"
              >
                Deposit
              </button>
              <button
                className={`px-3 py-1 rounded border ${mode === "withdraw" ? "bg-blue-600 text-white" : "bg-[var(--app-card-bg)]"}`}
                onClick={() => setMode("withdraw")}
                type="button"
              >
                Withdraw
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded border px-3 py-2 bg-[var(--app-card-bg)]"
              />
              <span className="text-xs text-[var(--app-foreground-muted)]">decimals: {decimals}</span>
            </div>

            {address && tokenAddress && vaultAddress ? (
              <div className="text-xs text-[var(--app-foreground-muted)] space-y-1">
                <div>Token balance: {Number(tokenBalance) / 10 ** decimals}</div>
                <div>Vault balance: {Number(vaultBalance) / 10 ** decimals}</div>
                <div>Allowance: {Number(allowance) / 10 ** decimals}</div>
              </div>
            ) : null}
          </div>

          {address ? (
            <Transaction
              calls={calls}
              onSuccess={handleSuccess}
              onError={(error: TransactionError) =>
                console.error("Transaction failed:", error)
              }
            >
              <TransactionButton className="text-white text-md" />
              <TransactionStatus>
                <TransactionStatusAction />
                <TransactionStatusLabel />
              </TransactionStatus>
              <TransactionToast className="mb-4">
                <TransactionToastIcon />
                <TransactionToastLabel />
                <TransactionToastAction />
              </TransactionToast>
            </Transaction>
          ) : (
            <p className="text-yellow-400 text-sm text-center mt-2">
              Connect your wallet to send a transaction
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
