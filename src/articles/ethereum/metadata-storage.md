---
layout: layouts/article.njk
title: "Accepted Metadata Storage Practices"
tags: ["ethereum", "metadata", "storage"]
summary: "A practical guide to generally accepted NFT metadata storage approaches for digital art on Ethereum."
authors: ["mpeyfuss"]
date: 2026-02-06
opinions:
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
---
This page focuses on *NFT metadata*: the JSON (and referenced media) that wallets and marketplaces fetch to display an NFT. The goal here is not to declare a single “best” solution, but to document the options that are broadly considered acceptable by the onchain art community, and the tradeoffs you should understand.

## 1. Background

### 1a. What ERC-721 and ERC-1155 specify (and what they do not)

The two dominant token standards on Ethereum, ERC-721 and ERC-1155, define how NFTs are owned and transferred. They also define *how a client can discover a metadata URI*.

- **ERC-721**: the optional metadata extension adds `name()`, `symbol()`, and `tokenURI(tokenId)`. The standard describes an “ERC721 Metadata JSON Schema” with core fields like `name`, `description`, and `image`.  
  Standard: [EIP-721](https://eips.ethereum.org/EIPS/eip-721)
- **ERC-1155**: the optional metadata URI extension adds `uri(id)` and standardizes **`{id}` substitution** (lowercase, 64-hex, zero-padded). It also includes a JSON schema that is loosely based on the ERC-721 metadata schema.  
  Standard: [EIP-1155](https://eips.ethereum.org/EIPS/eip-1155)

What these ERCs **do not** guarantee:

- That a given URI will stay online forever.
- That a marketplace will fetch it the way you expect (or at all).
- That the metadata *won’t* change (unless you build immutability guarantees into your design).
- That any particular *transport* (`https://`, `ipfs://`, `ar://`, `data:`) will be supported everywhere.

Helpful references:
- OpenSea “Metadata Standards” (practical, widely referenced): [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- OpenZeppelin overview of `tokenURI` usage: [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/4.x/erc721)

### 1b. How NFT metadata is specified by the ERCs

High level:

- **Your contract returns a URI string** via `tokenURI` (ERC-721) or `uri` (ERC-1155).
- **A client fetches or decodes metadata** from that URI.
- The metadata (usually JSON) includes an `image` field (and optionally `animation_url`, `attributes`, etc.) that points to media.

Common URI patterns:

- `https://example.com/metadata/123.json`
- `ipfs://bafy.../123.json`
- `ar://<txid>`
- `data:application/json;base64,<...>`

For ERC-1155, remember that `uri(id)` often returns something like:

- `ipfs://bafy.../{id}.json`

and clients replace `{id}` with the lowercase, 64-character hex form of the token id (no `0x` prefix).

### 1c. A reminder about guarantees

Nothing in life is guaranteed, and that’s especially true for anything that depends on infrastructure outside of Ethereum consensus.

Even “decentralized” networks have:

- economic assumptions (will nodes continue serving data?),
- software assumptions (will clients keep supporting a URI scheme?),
- operational assumptions (did you pin it, pay for it, or replicate it?).

So, when you evaluate a storage approach, think in terms of *failure modes* and *how you’d recover*.

## 2. Acceptable Solutions

### 2a. Scope and intent

This section is not trying to crown a winner. It documents three approaches that are generally accepted as “good enough to be taken seriously” in the onchain art ecosystem:

1. IPFS
2. Arweave
3. Onchain data storage

Each can be done well or poorly. The difference is usually operational discipline and how thoughtfully you design for long-term access.

### 2b. IPFS

#### How it works (high level)

IPFS is content-addressed storage. You add files to the network and get a CID (content identifier). If you change the content, you get a different CID.

In practice, projects usually store:

- metadata JSON on IPFS,
- media files on IPFS,
- and have `tokenURI` point at an `ipfs://...` URL.

#### Why it’s acceptable

When used well, IPFS gives you:

- strong integrity guarantees (CIDs),
- an easy way to replicate/pin content across multiple operators,
- flexibility to mirror content via many gateways.

#### Marketplace integration and caveats

- Some platforms understand `ipfs://` directly; others rely on an HTTP gateway (`https://.../ipfs/<cid>`).
- Even when `ipfs://` is supported, marketplaces often fetch through their own gateway or caching layer.
- Metadata can be cached; updates may not show immediately unless the platform refreshes.

OpenSea’s docs explicitly mention `ipfs://<hash>` for metadata URIs: [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

#### How to back it up

IPFS “being on IPFS” is not the same thing as *durability*. Backups should include:

- Pin on multiple independent pinning providers.
- Run your own IPFS node and pin it yourself (even if you also use a service).
- Export and archive your data (e.g., keep the original build artifacts, CIDs, and a local copy in cold storage).

IPFS docs on pinning: [IPFS Pinning Quickstart](https://docs.ipfs.tech/quickstart/pin/)

### 2c. Arweave

#### How it works (high level)

Arweave is designed for long-term (“permanent”) data storage with an upfront payment model. You upload data and receive a transaction ID; the content is then retrievable via gateways (commonly `https://arweave.net/<txid>`).

You’ll often see:

- metadata JSON stored on Arweave,
- media stored on Arweave,
- and token URIs pointing to Arweave content.

Some ecosystems also use the `ar://` scheme as a more decentralized way to reference Arweave content.

#### Why it’s acceptable

Arweave is widely used for NFT metadata and media because it’s designed around long-lived retrieval and replication, and it has strong cultural adoption in crypto-native art communities.

#### Marketplace integration and caveats

- Many marketplaces reliably handle `https://arweave.net/<txid>` links.
- Support for `ar://` varies. Some environments require a gateway/extension or additional resolution tooling.

OpenSea references `ar://<hash>` as the Arweave equivalent of `ipfs://`: [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

AR.IO Wayfinder (background on `ar://` resolution): [Arweave Wayfinder](https://docs.arweave.net/learn/wayfinder)

#### How to back it up

Arweave’s goal is to be the backup, but you should still keep:

- the original files you uploaded (source-of-truth),
- a map of token ids to txids/URLs,
- and redundant exports of that mapping (e.g., repo + cold storage).

If your process uses a third-party uploader, also save the exact manifest it produced (token id -> URI), so you can reconstitute listings even if tooling disappears.

### 2d. Onchain data storage

#### How it works (high level)

“Onchain metadata” typically means your contract returns a `data:` URI for the JSON, often Base64-encoded:

- `data:application/json;base64,<...>`

The JSON can then reference media either:

- also onchain via a `data:image/...` URI (common for SVG),
- or via IPFS/Arweave/HTTPS (hybrid approaches).

OpenSea documents this pattern explicitly: [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)

#### Why it’s acceptable

Onchain metadata is acceptable because it minimizes external dependencies: if Ethereum state is available, the metadata is available. This is especially attractive for art that aims to be durable and self-contained.

#### Marketplace integration and caveats

- Not all marketplaces handle every kind of `data:` payload equally (size limits, media types, and rendering differences exist).
- Gas constraints and storage costs are real, and can push projects into hybrid designs.
- If you rely on external rendering (e.g., offchain JS/HTML), you reintroduce offchain dependencies even if the JSON is onchain.

#### How to back it up

Ethereum already replicates contract state, but “backup” here means:

- keep verified source code and build artifacts so future readers can interpret the onchain bytes,
- keep rendering instructions (especially for generative work),
- and consider mirroring the decoded metadata/media on IPFS/Arweave for convenience and redundancy (without treating the mirror as the canonical source).

## 3. Conclusion

All three approaches above are broadly accepted and have many successful precedents in the onchain art community.

- IPFS emphasizes integrity and replicability, but requires operational discipline (pinning/replication).
- Arweave emphasizes long-lived retrieval with strong cultural adoption, typically via gateway access.
- Onchain storage minimizes external dependencies, but trades into gas/cost constraints and potential client limitations.

Different teams will prefer different tradeoffs. This page should be treated as a living document: as standards evolve and marketplace support changes, these recommendations may also change.

Strong projects define these constraints up front and document the expected rendering behavior over time.
