import { redirect } from "next/navigation"

export default function NewSpacePage() {
  // Redirect to the edit page with "new" as the ID
  redirect("/admin/spaces/new/edit")
  return null
}
