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
  // Catálogo estendido (36 NFTs no total = 4 páginas de 9). Todos são mais antigos
  // que os 9 acima, então a página 1 em "Listados recentemente" continua igual.
  makeNft({ id: "nft-401", tokenId: "0401", name: "Jade Sentinel #401", category: "Colecionáveis", network: "Polygon", price: "0.89", image: "/images/emerald-ape.png", attributes: ["Óculos", "Jade"], stock: 25, createdAt: "2026-06-30" }),
  makeNft({ id: "nft-402", tokenId: "0402", name: "Amber Wanderer #402", category: "Arte digital", network: "Ethereum", price: "1.49", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Âmbar"], stock: 12, createdAt: "2026-06-29" }),
  makeNft({ id: "nft-403", tokenId: "0403", name: "Pearl Duke #403", category: "Fotografia", network: "Solana", price: "2.09", oldPrice: "2.39", image: "/images/ivory-baron.png", attributes: ["Blazer", "Pérola"], stock: 8, createdAt: "2026-06-28" }),
  makeNft({ id: "nft-404", tokenId: "0404", name: "Bronze Rhythm #404", category: "Música", network: "Ethereum", price: "0.49", image: "/images/golden-beat.png", attributes: ["Fones", "Bronze"], stock: 40, createdAt: "2026-06-27" }),
  makeNft({ id: "nft-405", tokenId: "0405", name: "Crystal Golem #405", category: "Arte 3D", network: "Polygon", price: "2.49", image: "/images/emerald-ape.png", attributes: ["Óculos", "Cristal", "Raro"], rare: true, stock: 5, createdAt: "2026-06-26" }),
  makeNft({ id: "nft-406", tokenId: "0406", name: "Indigo Drifter #406", category: "Generativa", network: "Solana", price: "0.69", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Índigo"], stock: 30, createdAt: "2026-06-25" }),
  makeNft({ id: "nft-407", tokenId: "0407", name: "Onyx Count #407", category: "Jogos", network: "Ethereum", price: "1.29", image: "/images/ivory-baron.png", attributes: ["Blazer", "Ônix"], stock: 18, createdAt: "2026-06-24" }),
  makeNft({ id: "nft-408", tokenId: "0408", name: "Copper Pulse #408", category: "Assinaturas", network: "Polygon", price: "0.29", image: "/images/golden-beat.png", attributes: ["Fones", "Cobre"], stock: 100, createdAt: "2026-06-23" }),
  makeNft({ id: "nft-409", tokenId: "0409", name: "Moss Guardian #409", category: "Utilidade", network: "Ethereum", price: "0.79", image: "/images/emerald-ape.png", attributes: ["Óculos", "Musgo"], stock: 22, createdAt: "2026-06-22" }),
  makeNft({ id: "nft-410", tokenId: "0410", name: "Lilac Pilgrim #410", category: "Arte digital", network: "Solana", price: "1.09", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Lilás"], stock: 14, createdAt: "2026-06-21" }),
  makeNft({ id: "nft-411", tokenId: "0411", name: "Silver Marquis #411", category: "Fotografia", network: "Ethereum", price: "1.89", image: "/images/ivory-baron.png", attributes: ["Blazer", "Prata", "Raro"], rare: true, stock: 6, createdAt: "2026-06-20" }),
  makeNft({ id: "nft-412", tokenId: "0412", name: "Solar Groove #412", category: "Música", network: "Polygon", price: "0.79", oldPrice: "0.99", image: "/images/golden-beat.png", attributes: ["Fones", "Solar"], stock: 35, createdAt: "2026-06-19" }),
  makeNft({ id: "nft-413", tokenId: "0413", name: "Emerald Titan #413", category: "Arte 3D", network: "Ethereum", price: "2.79", image: "/images/emerald-ape.png", attributes: ["Óculos", "Esmeralda"], stock: 4, createdAt: "2026-06-18" }),
  makeNft({ id: "nft-414", tokenId: "0414", name: "Plum Voyager #414", category: "Colecionáveis", network: "Polygon", price: "0.59", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Ameixa"], stock: 28, createdAt: "2026-06-17" }),
  makeNft({ id: "nft-415", tokenId: "0415", name: "Ivory Regent #415", category: "Generativa", network: "Solana", price: "1.59", image: "/images/ivory-baron.png", attributes: ["Blazer", "Marfim"], stock: 9, createdAt: "2026-06-16" }),
  makeNft({ id: "nft-416", tokenId: "0416", name: "Golden Echo #416", category: "Música", network: "Ethereum", price: "0.69", image: "/images/golden-beat.png", attributes: ["Fones", "Eco"], stock: 45, createdAt: "2026-06-15" }),
  makeNft({ id: "nft-417", tokenId: "0417", name: "Neon Warden #417", category: "Jogos", network: "Solana", price: "1.39", oldPrice: "1.69", image: "/images/emerald-ape.png", attributes: ["Óculos", "Neon"], stock: 16, createdAt: "2026-06-14" }),
  makeNft({ id: "nft-418", tokenId: "0418", name: "Mauve Rover #418", category: "Arte digital", network: "Polygon", price: "0.99", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Malva"], stock: 20, createdAt: "2026-06-13" }),
  makeNft({ id: "nft-419", tokenId: "0419", name: "Cream Viscount #419", category: "Assinaturas", network: "Ethereum", price: "0.39", image: "/images/ivory-baron.png", attributes: ["Blazer", "Creme"], stock: 80, createdAt: "2026-06-12" }),
  makeNft({ id: "nft-420", tokenId: "0420", name: "Gilded Tempo #420", category: "Utilidade", network: "Solana", price: "0.49", image: "/images/golden-beat.png", attributes: ["Fones", "Dourado"], stock: 0, createdAt: "2026-06-11" }),
  makeNft({ id: "nft-421", tokenId: "0421", name: "Verdant Ape #421", category: "Colecionáveis", network: "Ethereum", price: "1.69", image: "/images/emerald-ape.png", attributes: ["Óculos", "Verde", "Raro"], rare: true, stock: 7, createdAt: "2026-06-10" }),
  makeNft({ id: "nft-422", tokenId: "0422", name: "Orchid Nomad #422", category: "Fotografia", network: "Solana", price: "1.19", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Orquídea"], stock: 11, createdAt: "2026-06-09" }),
  makeNft({ id: "nft-423", tokenId: "0423", name: "Alabaster Lord #423", category: "Arte 3D", network: "Polygon", price: "2.19", image: "/images/ivory-baron.png", attributes: ["Blazer", "Alabastro"], stock: 6, createdAt: "2026-06-08" }),
  makeNft({ id: "nft-424", tokenId: "0424", name: "Brass Cadence #424", category: "Música", network: "Solana", price: "0.89", image: "/images/golden-beat.png", attributes: ["Fones", "Latão"], stock: 33, createdAt: "2026-06-07" }),
  makeNft({ id: "nft-425", tokenId: "0425", name: "Forest Colossus #425", category: "Generativa", network: "Polygon", price: "0.59", image: "/images/emerald-ape.png", attributes: ["Óculos", "Floresta"], stock: 26, createdAt: "2026-06-06" }),
  makeNft({ id: "nft-426", tokenId: "0426", name: "Velvet Seeker #426", category: "Jogos", network: "Ethereum", price: "1.79", image: "/images/violet-nomad.png", attributes: ["Chapéu", "Veludo"], stock: 13, createdAt: "2026-06-05" }),
  makeNft({ id: "nft-427", tokenId: "0427", name: "Linen Earl #427", category: "Arte digital", network: "Ethereum", price: "2.39", oldPrice: "2.69", image: "/images/ivory-baron.png", attributes: ["Blazer", "Linho"], stock: 3, createdAt: "2026-06-04" }),
];