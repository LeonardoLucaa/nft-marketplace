export type Network = "Ethereum" | "Polygon" | "Solana";
export type SortOption = "recent" | "price_asc" | "price_desc";

export type Edition = { id: string; label: string; available: number };

export type Nft = {
  stock?: number;
  id: string;
  tokenId: string; // "0042"
  name: string;
  collection: string;
  network: Network;
  price: string; // ETH como string decimal: "1.19"
  oldPrice?: string;
  image: string;
  rare: boolean;
  description: string;
  attributes: string[];
  rating: number;
  ratingCount: number;
  editions: Edition[];
  version: number; // sobe a cada mudança; será útil para eventos
  createdAt: string;
};

export type NftListQuery = {
  q?: string;
  network?: Network;
  minPrice?: string;
  maxPrice?: string;
  sort: SortOption;
  page: number;
};

export type NftListResponse = {
  items: Nft[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiError = { code: string; message: string; fields?: Record<string, string> };

export type User = { id: string; name: string; email: string; avatarUrl?: string };
export type SessionResponse = { user: User; token: string; expiresAt: string };
export type LoginInput = { email: string; password: string };
export type RegisterInput = { name: string; email: string; password: string };

export type CartItem = {
  id: string;
  nftId: string;
  editionId: string;
  editionLabel: string;
  name: string;
  image: string;
  price: string;      // preço atual do catálogo
  quantity: number;
  available: number;  // disponibilidade atual da edição
};
export type Cart = { items: CartItem[]; subtotal: string; count: number };

export type Coupon = { code: string; percentOff: number }

export type QuoteLine = {
  nftId: string
  name: string
  image: string
  network: Network
  quantity: number
  unitPrice: string // ETH em string decimal
  lineTotal: string
}

export type Quote = {
  id: string
  lines: QuoteLine[]
  coupon: Coupon | null
  subtotal: string
  discount: string
  networkFee: string
  total: string
  expiresAt: string
}

export type OrderStatus = 'processing' | 'confirmed' | 'failed'

export type Order = Omit<Quote, 'id' | 'expiresAt'> & {
  id: string
  status: OrderStatus
  createdAt: string
  failureReason?: string
}

export type NftUpdatedEvent = { id: string; price: string; stock: number; updatedAt: string }

export interface ServerToClientEvents {
  'nft.updated': (e: NftUpdatedEvent) => void
  'order.updated': (order: Order) => void
  'session:ready': (e: { authenticated: boolean }) => void
}

export interface ClientToServerEvents {
  'session:auth': (token: string | null) => void
}