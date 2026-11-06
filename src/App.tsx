import { useNfts } from '@/features/nfts/queries'

function App() {
  const { data, isPending, isError } = useNfts({ sort: 'price_asc', page: 1 })

  if (isPending) return <p className="p-8">Carregando...</p>
  if (isError) return <p className="p-8">Erro ao carregar.</p>

  return (
    <ul className="p-8 space-y-2">
      {data.items.map((nft) => (
        <li key={nft.id}>
          {nft.name} - {nft.price} ETH
        </li>
      ))}
    </ul>
  )
}

export default App