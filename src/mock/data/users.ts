import type { Customer } from "../../features/customers/types"

export type WorkspaceUser = {
  id: string
  name: string
  initials: string
  role: string
  roleAr: string
  email: string
  team: string
  teamAr: string
}

export const currentUser: WorkspaceUser = {
  id: "user-1",
  name: "Amgad Anwar",
  initials: "AA",
  role: "Sales",
  roleAr: "مبيعات",
  email: "amgad.anwar@technocom.example",
  team: "Sales team",
  teamAr: "فريق المبيعات",
}

export const workspaceUsers: WorkspaceUser[] = [
  currentUser,
  {
    id: "user-2",
    name: "Youssef Ali",
    initials: "YA",
    role: "Sales manager",
    roleAr: "مدير مبيعات",
    email: "youssef.ali@technocom.example",
    team: "Sales team",
    teamAr: "فريق المبيعات",
  },
]
