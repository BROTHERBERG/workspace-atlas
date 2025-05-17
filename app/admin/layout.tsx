import type { ReactNode } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Building, Home, Settings, Users } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 px-4 py-2">
              <Building className="h-6 w-6" />
              <span className="font-cal text-lg">Admin Dashboard</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin" passHref legacyBehavior>
                  <SidebarMenuButton>
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/spaces" passHref legacyBehavior>
                  <SidebarMenuButton>
                    <Building className="h-4 w-4" />
                    <span>Spaces</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/users" passHref legacyBehavior>
                  <SidebarMenuButton>
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/settings" passHref legacyBehavior>
                  <SidebarMenuButton>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <div className="p-4 text-xs text-gray-500">
              <p>Logged in as Admin</p>
              <p>© {new Date().getFullYear()} Workspace Atlas</p>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto">
          <div className="container p-6">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  )
}
