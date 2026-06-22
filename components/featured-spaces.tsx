import SpaceCard from "@/components/space-card"
import { featuredSpaces } from "@/lib/spaces"

export default function FeaturedSpaces() {
  const spaces = featuredSpaces()
  return (
    <>
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} />
      ))}
    </>
  )
}
