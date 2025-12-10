import { notFound } from 'next/navigation'

export default function CatchAllPage() {
  // This will trigger the not-found.tsx in the protected layout
  // which will only be accessible to authenticated users
  notFound()
}
