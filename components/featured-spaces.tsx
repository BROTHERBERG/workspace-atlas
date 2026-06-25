import SpaceCard from "@/components/space-card"
import { featuredSpaces } from "@/lib/spaces"

export default function FeaturedSpaces({ market }: { market?: string }) {
  const spaces = featuredSpaces(market)
  return (
    <>
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} />
      ))}
    </>
  )
}
