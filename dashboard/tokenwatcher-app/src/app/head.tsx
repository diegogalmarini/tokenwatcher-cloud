// File: src/app/head.tsx
import React from "react";

export default function Head() {
  return (
    <>
      <title>TokenWatcher – Real-Time ERC-20 Event Alerts</title>
      <meta
        name="description"
        content="Gain immediate on-chain visibility and receive instant ERC-20 token transfer alerts on Ethereum, Polygon & Arbitrum."
      />

      {/* Open Graph */}
      <meta property="og:title" content="TokenWatcher – Real-Time ERC-20 Event Alerts" />
      <meta
        property="og:description"
        content="Gain immediate on-chain visibility and receive instant ERC-20 token transfer alerts."
      />
      <meta
        property="og:image"
        content="/og-image.png"
      />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="TokenWatcher – Real-Time ERC-20 Event Alerts" />
      <meta
        name="twitter:description"
        content="Gain immediate on-chain visibility and receive instant ERC-20 token transfer alerts."
      />
      <meta name="twitter:image" content="/og-image.png" />
    </>
  );
}
