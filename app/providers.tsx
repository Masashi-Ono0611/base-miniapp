"use client";

import { type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { config } from "./wagmi";

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      {...({
        apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
        chain: baseSepolia,
        config: {
          appearance: {
            mode: "auto",
            theme: "mini-app-theme",
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
            logo: process.env.NEXT_PUBLIC_ICON_URL,
          },
        },
        miniKit: {
          enabled: true,
          autoConnect: true,
          notificationProxyUrl: "/api/notify",
        },
      } as any)}
    >
      <MiniKitProvider
        {...({
          apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
          chain: baseSepolia,
          config: {
            appearance: {
              mode: "auto",
              theme: "mini-app-theme",
              name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
              logo: process.env.NEXT_PUBLIC_ICON_URL,
            },
          },
        } as any)}
      >
        <WagmiProvider config={config}>{props.children}</WagmiProvider>
      </MiniKitProvider>
    </OnchainKitProvider>
  );
}
