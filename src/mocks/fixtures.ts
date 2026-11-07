import type { Category, Edition, Nft, Network } from "@/types/api";

function editions(available: number): Edition[] {
  return [
    { id: "1-1", label: "1/1", available: Math.min(available, 1) },
    { id: "1-10", label: "1/10", available: Math.min(available, 10) },
    { id: "1-50", label: "1/50", available: Math.min(available, 50) },
    { id: "open", label: "ABERTA", available },
  ];
}

type Seed = {
  id: string;
  tokenId: string;
  name: string;
  category: Category;
  network: Network;
  price: string;
  oldPrice?: string;
  image: string;
  rare?: boolean;
  attributes: string[];
  stock: number;
  createdAt: string;
};

function makeNft(s: Seed): Nft {
  return {
    id: s.id,
    tokenId: s.tokenId,
    name: s.name,
    collection: "Kurio Apes",
    category: s.category,
    network: s.network,
    price: s.price,
    oldPrice: s.oldPrice,
    image: s.image,
    rare: s.rare ?? false,
    description: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${s.network}.`,
    attributes: s.attributes,
    rating: 4.8,
    ratingCount: 19,
    stock: s.stock,
    editions: editions(s.stock),
    version: 1,
    createdAt: s.createdAt,
  };
}

export const nftsSeed: Nft[] = [
  makeNft({ id: "nft-042", tokenId: "0042", name: "Emerald Ape #042", category: "Colecionáveis", network: "Ethereum", price: "1.19", image: "/images/emerald-ape.png", attributes: ["Óculos", "Esmeralda", "Raro"], rare: true, stock: 50, createdAt: "2026-07-01" }),
  makeNft({ id: "nft-009", tokenId: "0009", name: "Sage Nomad #009", category: "Arte digital", network: "Ethereum", price: "1.69", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Verde"], stock: 20, createdAt: "2026-07-02" }),
  makeNft({ id: "nft-088", tokenId: "0088", name: "Ivory Baron #088", category: "Fotografia", network: "Ethereum", price: "1.79", image: "/images/ivory-baron.png", attributes: ["Blazer", "Marfim", "Raro"], rare: true, stock: 10, createdAt: "2026-07-03" }),
  makeNft({ id: "nft-314", tokenId: "0314", name: "Violet Nomad #314", category: "Arte digital", network: "Solana", price: "1.39", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Roxo"], stock: 1, createdAt: "2026-07-04" }),
  makeNft({ id: "nft-207", tokenId: "0207", name: "Golden Beat #207", category: "Música", network: "Polygon", price: "0.99", image: "/images/golden-beat.png", attributes: ["Fones", "Dourado"], stock: 50, createdAt: "2026-07-05" }),
  makeNft({ id: "nft-118", tokenId: "0118", name: "Cosmic Bloom #118", category: "Arte 3D", network: "Polygon", price: "2.29", oldPrice: "2.59", image: "/images/ivory-baron.png", attributes: ["Blazer", "Cósmico"], stock: 15, createdAt: "2026-07-06" }),
  makeNft({ id: "nft-071", tokenId: "0071", name: "Golden Frequency #071", category: "Música", network: "Solana", price: "0.59", image: "/images/golden-beat.png", attributes: ["Fones", "Dourado"], stock: 0, createdAt: "2026-07-07" }),
  makeNft({ id: "nft-160", tokenId: "0160", name: "Golden Signal #160", category: "Generativa", network: "Ethereum", price: "0.39", image: "/images/golden-beat.png", attributes: ["Fones", "Sinal"], stock: 60, createdAt: "2026-07-08" }),
  makeNft({ id: "nft-552", tokenId: "0552", name: "Neon Vessel #552", category: "Jogos", network: "Polygon", price: "1.99", oldPrice: "2.29", image: "/images/emerald-ape.png", attributes: ["Óculos", "Neon", "Raro"], rare: true, stock: 10, createdAt: "2026-07-09" }),
];