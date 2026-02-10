---
layout: layouts/article.njk
title: "Accepted Metadata Storage Practices on Ethereum"
tags: ["ethereum", "metadata", "storage"]
summary: "A practical guide to generally accepted NFT metadata storage approaches for digital art on Ethereum."
contributors: ["mpeyfuss"]
opinions:
  - title: "On Choosing IPFS for Digital Art"
    url: "https://medium.com/@mpeyfuss/on-choosing-ipfs-for-digital-art-e62e0dadca9a"
    author: "mpeyfuss"
    date: 2026-02-10
    note: "Thoughts about IPFSf based on experiences building long-lived, decentralized systems."
  - title: "Simple best practices for digital art creators and platforms"
    url: "https://x.com/edouard/status/2019935230304432546"
    author: "edouard"
    date: 2026-02-07
    note: "A concise summary of experience-based best practices for digital art preservation + thoughts on Arweave vs IPFS."
  - title: "Digital Art Foundations: Building a Legacy Beyond the Marketplace"
    url: "https://x.com/G4SP4RD/status/2019407912762839327"
    author: "G4SP4RD"
    date: 2026-02-05
    note: "A Manifesto for immutable Art and Digital Permanence."
  - title: "NFT Storage Wars"
    url: "https://x.com/mpeyfuss/status/1818391134227591587"
    author: "mpeyfuss"
    date: 2024-07-30
    note: "Choosing a storage method for NFTs is full of compromises and there is no clear winner."
  - title: "Who Is Responsible for NFT Data?"
    url: "https://medium.com/pinata/who-is-responsible-for-nft-data-99fb4e8147e4"
    author: "kyletut"
    date: 2020-04-06
    note: "Who is responsible for maintaining NFT data not stored on a blockchain?"
---
This page focuses on NFT metadata: the JSON (and referenced media) that wallets and marketplaces fetch to display an NFT. The goal is not to declare a single “best” solution, but to document the options that are broadly considered acceptable by the onchain art community and the tradeoffs you should understand. This is meant to be a living document that is updated over time.

## TL;DR

- IPFS, Arweave, and onchain storage can all be “good” solutions; they differ mainly in who owns the failure mode and what upkeep is required.
- **IPFS:** strongest integrity anchors (CIDs) and easy to replicate, but durability is not automatic; if nobody pins/replicates, the CID stops resolving.
- **Arweave:** designed for long-lived retrieval with immutable txids, but it relies on long-term network viability (token economics, rising storage/bandwidth demands, infrastructure costs) and tends to fail at the system level in gradual, harder-to-spot ways.
- **Onchain:** minimizes external dependencies and has the highest durability of all three methods, but the main barrier is cost (plus user error and future client/standards expectations).
- Regardless of method, plan for change: gateway outages, pinning provider shutdowns, marketplace caching quirks, and recovery paths before you mint.

## Background

### Key terms

- **Metadata JSON:** a JSON document describing the token (name, description, media pointers, traits).
- **Media:** the image/video/audio/HTML/etc. referenced by the metadata (often `image` or `animation_url`).
- **URI:** a string clients resolve to find metadata (can be `https://`, `ipfs://`, `ar://`, or `data:`).
- **Content-addressed (IPFS):** the identifier is derived from the content (change bytes, change ID). This is why IPFS CIDs are strong integrity anchors.
- **Transaction ID (Arweave):** an immutable identifier for a specific upload transaction. Re-uploading the same bytes produces a different txid, so preserving txids/manifests matters.
- **Gateway:** an HTTP service that fetches content from a network like IPFS or Arweave and serves it over `https://`.
- **Pinning (IPFS):** ensuring at least one node you control (or pay) keeps serving the content over time.
- **Onchain:** data stored directly in Ethereum state (high durability, but constrained by cost and client support).

### What ERC-721 and ERC-1155 specify

The two dominant token standards on Ethereum, ERC-721 and ERC-1155, define how NFTs are owned and transferred. They also define how clients discover metadata URIs and what shape that metadata is expected to take.

Importantly, these standards are intentionally open-ended about *what the token represents* and *how metadata is stored*. That flexibility is a feature: the “asset” a token points to could be fully onchain, offchain digital media, or even something physical. In practice, they only suggest a broadly-adopted JSON format that clients can interpret.

Primary references (source of truth):

- ERC-721: [EIP-721](https://eips.ethereum.org/EIPS/eip-721)
- ERC-1155: [EIP-1155](https://eips.ethereum.org/EIPS/eip-1155)

Secondary overviews (useful for less technical readers):

- ERC-721 overview: [ethereum.org ERC-721](https://ethereum.org/developers/docs/standards/tokens/erc-721)
- ERC-1155 overview: [ethereum.org ERC-1155](https://ethereum.org/developers/docs/standards/tokens/erc-1155)

### What these ERCs do not guarantee

- That a given URI will stay online forever.
- That a marketplace will fetch it the way you expect (or at all).
- That the metadata *won’t* change (unless you build immutability guarantees into your contracts).
- That any particular transport (`https://`, `ipfs://`, `ar://`, `data:`) will be supported everywhere.

### Metadata mutability and signaling

Marketplaces and wallets routinely cache metadata. Even if you update a URI or its content, many clients will not pick up changes quickly (or at all) unless they have an explicit refresh path.

If your project intends metadata to be mutable, document the policy clearly and consider implementing a standard signaling mechanism for updates (for example: [EIP-4906](https://eips.ethereum.org/EIPS/eip-4906)). If your project intends metadata to be immutable, design for that (for example: IPFS CIDs or Arweave txids and a clear “frozen” promise).

### A reminder about guarantees

Nothing in life is guaranteed, and that’s especially true for anything that depends on infrastructure outside of Ethereum consensus.

Even “decentralized” networks have:

- economic assumptions (will nodes continue serving data?),
- software assumptions (will clients keep supporting a URI scheme?),
- operational assumptions (did you pin it, pay for it, or replicate it?).

So, when evaluating a storage approach, it's best to think in terms of *failure modes* and *how you’d recover*.

## Acceptable Solutions

This section is not trying to crown a winner. It documents three approaches that are generally accepted as “good enough to be taken seriously” in the onchain art ecosystem:

- IPFS
- Arweave
- Onchain data storage

Each can be done well or poorly. The difference is usually operational discipline and how thoughtfully the system was designed for long-term access. Many projects also use plain HTTPS as a compatibility layer, but HTTPS alone is rarely treated as a durable long-term plan.

### Quick comparison

This comparison highlights tradeoffs and ownership of failure modes, not a winner.

| Approach | Integrity | Availability responsibility | Client compatibility | Typical failure mode |
|---|---|---|---|---|
| IPFS | Strong (CID) | You (pin/replicate) | Great | "It was on IPFS" but nobody pins it |
| Arweave | Strong (immutable txid) | Mostly network, plus you keep manifests | Good via gateway | Lost manifests / tooling assumptions |
| Onchain | Strong (Ethereum state) | Ethereum | Varies by payload size/type | Client limits, gas/cost constraints |

Note on identifiers:

- With IPFS, re-adding the exact same bytes results in the same CID, which makes recovery and re-pinning straightforward.
- With Arweave, re-uploading the same bytes results in a different txid, so durability depends on preserving the original txids and manifests.

### IPFS
![IPFS](/assets/articles/images/ipfs.png)

#### How it works

IPFS is content-addressed storage. You add files to the network and get a CID (content identifier). If you change the content, you get a different CID.

In practice, projects usually store:

- metadata JSON on IPFS
- media files on IPFS
- and have `tokenURI` point at an `ipfs://...` URL

#### Why it’s acceptable

When used well, IPFS gives you:

- strong integrity guarantees (CIDs)
- an easy way to replicate/pin content across multiple operators (decentralized storage)
- flexibility to mirror content via many gateways
- the ability to restore availability by re-pinning the same bytes under the same CID (you can't change the content without changing the CID)

#### Risks

- **Durability is not guaranteed unless someone pins.** If nobody pins or replicates the content, it can disappear from the network even though the CID is “correct”.
- **Failure is file-level and loud.** When the content isn’t available, the CID simply doesn’t resolve (often surfacing as broken media/metadata rather than a subtle degradation).
- **Availability requires ongoing upkeep.** Pinning providers can churn, gateways can rate-limit, and operational discipline (redundant pinning + backups) matters over time.

#### Marketplace integration and caveats

- Many platforms understand `ipfs://` directly, but real-world behavior varies (some clients still rely on HTTP gateways and/or aggressive caching).
- Even when `ipfs://` is supported, marketplaces often fetch through their own gateway or caching layer.
- Metadata can be cached; updates may not show immediately unless the platform refreshes.

OpenSea’s docs explicitly mention `ipfs://<hash>` for metadata URIs: [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

More IPFS background:

- Content addressing (why CIDs change when content changes): [IPFS Concepts: Content addressing](https://docs.ipfs.tech/concepts/content-addressing/)
- Gateways (how `ipfs://` often becomes `https://.../ipfs/<cid>` in practice): [IPFS Concepts: Gateways](https://docs.ipfs.tech/concepts/ipfs-gateway/)

#### A developer’s checklist

- Prefer `ipfs://` as the **canonical** URI, and treat gateway URLs as mirrors for compatibility.
- Keep a deterministic build output (a reproducible folder structure) so you can re-pin and re-serve the exact same bytes later.
- Test your CIDs through at least two independent gateways and one local node (to catch DNS, redirect, and header quirks).

#### How to back it up

Metadata “being on IPFS” is not the same thing as *durability*. Backups should include:

- Pin on multiple independent pinning providers.
- Run your own IPFS node and pin it yourself (even if you also use a service).
- Export and archive your data (e.g., keep the original build artifacts, CIDs, and a local copy in cold storage).
- **Marketplaces, artists, and collectors should all consider backing up their content on IPFS.**

How to pin: [IPFS Pinning Quickstart](https://docs.ipfs.tech/quickstart/pin/)

### Arweave
![Arweave](/assets/articles/images/arweave.jpeg)

#### How it works

Arweave is designed for long-term (“permanent”) data storage with an upfront payment model. You upload data and receive a transaction ID; the content is then retrievable via gateways (commonly `https://arweave.net/<txid>`).

Unlike IPFS, re-uploading the same bytes does not give you the same identifier: you should treat the original txid as the durable reference and preserve it carefully (manifests, backups, and exports).

You’ll often see:

- metadata JSON stored on Arweave
- media stored on Arweave
- and token URIs pointing to Arweave content

#### Why it’s acceptable

Arweave is widely used for NFT metadata and media because it’s designed around long-lived retrieval and replication, and it has strong cultural adoption in crypto-native art communities. The pay-once-store-forever narrative is one that many people in the space value.

#### Risks

- **Network viability is an assumption.** The “pay once, store forever” model depends on token economics and future storage-cost assumptions continuing to make it attractive for nodes to keep serving data.
- **Infrastructure requirements can centralize operators.** Running “full” infrastructure can require substantial storage/bandwidth over time as the dataset grows, which can push participation toward well-capitalized operators and increase reliance on a smaller set of gateways.
- **Failure is system-level and gradual.** If the network becomes less viable, it may show up as increasing friction (worse gateway reliability, slower retrieval, ecosystem/tooling churn) long before it becomes an obvious outage.
- **Preserving txids/manifests is still on you.** Even if the network persists, losing the txid/manifest mapping can break retrieval in practice (especially across tools and platforms).

#### Marketplace integration and caveats

- Most, if not all, marketplaces reliably handle `https://arweave.net/<txid>` links.
- Support for `ar://` varies. Some environments require a gateway/extension or additional resolution tooling.

OpenSea references `ar://<hash>` as the Arweave equivalent of `ipfs://`: [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

#### A developer’s checklist

- Store and version a **manifest** of token ids -> txids/URIs in a durable place (git, multiple backups). Treat it as critical infrastructure.
- Prefer a canonical reference form (`ar://`), then test how your target clients resolve it.
- Verify you can retrieve the content from more than one gateway over time (don’t assume a single gateway is forever).

#### How to back it up

Arweave’s goal is to be the backup, but you should still keep:

- the original files you uploaded (source-of-truth)
- a map of token ids to txids/URLs
- and redundant exports of that mapping (e.g., repo + cold storage)

If your process uses a third-party uploader, also save the exact manifest it produced (token id -> URI), so you can reconstitute listings even if tooling disappears.

### Onchain data storage
![Onchain Art](/assets/articles/images/ethereum.webp)

#### How it works

There are many ways to put metadata onchain. Some generative art systems store everything needed to recreate the work onchain, but still rely on offchain clients for rendering and presentation. This document won't get into all the different ways to store digital art onchain. Instead, we'll focus on a general strategy which uses data URIs.

“Onchain metadata” typically means your contract returns a `data:` URI for the JSON, often Base64-encoded: `data:application/json;base64,<...>`.

The JSON can then reference media either:

- also onchain via a `data:image/...` URI (common for SVG),
- or via IPFS/Arweave/HTTPS (hybrid approaches).

OpenSea documents this pattern explicitly: [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
The `data:` URL scheme is defined here: [RFC 2397](https://www.rfc-editor.org/rfc/rfc2397)

#### Why it’s acceptable

Onchain metadata is acceptable because it minimizes external dependencies: if Ethereum state is available, the metadata is available. This is especially attractive for art that aims to be durable and self-contained.

#### Risks

- **Cost is the main barrier.** Full onchain metadata and media can be prohibitively expensive on Ethereum, pushing most projects toward smaller payloads or hybrid designs.
- **User error and standards drift.** The biggest real risks are mistakes in encoding/decoding (invalid Base64, invalid JSON, wrong MIME types) and future client or ecosystem expectations that fail to resolve or correctly interpret the URI.
- **Lowest dependency risk, not zero risk.** Ethereum state is highly durable, but long-term readability still depends on clients and conventions for interpreting what’s stored.

#### Marketplace integration and caveats

- Not all marketplaces handle every kind of `data:` payload equally. Size limits, media types, and rendering differences exist and are important considerations made by marketplaces.
- Gas constraints and storage costs are real, and can push projects into hybrid designs. Most content cannot be stored on Ethereum without incurring extreme costs.
- If you rely on external rendering (e.g., offchain JS/HTML), you reintroduce offchain dependencies even if the JSON is onchain.

#### A developer’s checklist

- Validate the largest `tokenURI` payloads you expect against the clients you care about (some have size limits, timeouts, or strict parsers).
- If you use Base64 `data:` URIs, ensure the JSON decodes cleanly and uses predictable UTF-8 (avoid exotic encodings).
- If you are “onchain generative”, document what’s onchain versus what’s assumed offchain (renderers, scripts, fonts, libraries).

#### How to back it up

Ethereum already replicates contract state, but “backup” here means:

- keep verified source code and build artifacts so future readers can interpret the onchain bytes
- keep rendering instructions (especially for generative work)
- and consider mirroring the decoded metadata/media on IPFS/Arweave for convenience and redundancy (without treating the mirror as the canonical source)

## Best Practices

All three approaches above are broadly accepted and have many successful precedents in the onchain art community. IPFS emphasizes integrity and replicability but requires ongoing operational discipline; Arweave emphasizes long-lived retrieval (often via gateway access); onchain storage minimizes external dependencies but trades into gas/cost constraints and client limitations. Marketplace support and conventions change over time, so re-validate periodically and document expected rendering behavior.

- Prefer content-addressed identifiers (IPFS CIDs) or immutable anchors (Arweave txids) over mutable URLs whenever possible.
- Design for multiple resolution paths: keep a canonical decentralized URI (`ipfs://` or `ar://`), and optionally provide gateway/HTTPS mirrors for compatibility.
- If metadata is intended to be mutable, consider emitting a standard update signal (for example: [EIP-4906](https://eips.ethereum.org/EIPS/eip-4906)).
- If metadata is intended to be immutable, use immutable decentralized URIs (for example: IPFS CIDs or Arweave txids) and publish a clear “freeze” promise.
- Assume clients cache metadata and media. If you need updates to be reflected, test refresh behavior on the platforms you care about.
- If you use IPFS, pin redundantly (multiple independent providers and/or your own node) and keep an offline archive of the original files.
- If you use Arweave, keep the original upload set and a durable manifest of txids, even if you believe the network is the archive.
- If you store metadata/media onchain, document the decoding/rendering expectations and consider optional mirrors for convenience (without making the mirror canonical).
- Write down your failure modes and recovery plan (domain loss, gateway outage, pinning provider shutdown, marketplace caching quirks), then operationalize it.

## References
Standards are intentionally open-ended, so implementers should read the primary EIPs directly. These additional references are helpful for day-to-day practice and interoperability expectations.

- Official standards: [EIP-721](https://eips.ethereum.org/EIPS/eip-721), [EIP-1155](https://eips.ethereum.org/EIPS/eip-1155), [EIP-4906](https://eips.ethereum.org/EIPS/eip-4906)
- Ethereum Foundation overviews: [ethereum.org ERC-721](https://ethereum.org/developers/docs/standards/tokens/erc-721), [ethereum.org ERC-1155](https://ethereum.org/developers/docs/standards/tokens/erc-1155)
- OpenZeppelin overviews: [ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721) & [ERC-1155](https://docs.openzeppelin.com/contracts/5.x/erc1155)
- OpenSea “Metadata Standards” (practical, widely referenced): [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- IPFS concepts: [Content addressing](https://docs.ipfs.tech/concepts/content-addressing/), [Gateways](https://docs.ipfs.tech/concepts/ipfs-gateway/)
- IPFS pinning: [IPFS Pinning Quickstart](https://docs.ipfs.tech/quickstart/pin/)
- Arweave docs: [Arweave Docs](https://docs.arweave.org/)
- Arweave `ar://` resolution: [Arweave Wayfinder](https://docs.arweave.net/learn/wayfinder)
- `data:` URL scheme: [RFC 2397](https://www.rfc-editor.org/rfc/rfc2397)
