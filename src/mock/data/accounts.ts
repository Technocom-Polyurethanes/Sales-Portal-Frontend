import type { Role } from "../../features/account/permissions"
import type { UserRecord } from "../../features/users/types"

/** Sample sign-in accounts, one per role. `db.session` picks the one that is signed in. */
export const accounts: UserRecord[] = [
  {
    id: "acct-admin",
    username: "admin",
    fullName: "Amgad Anwar",
    initials: "AA",
    email: "amgad.anwar@technocom.example",
    role: "Admin",
    roleTitle: "Operations manager",
    roleTitleAr: "مدير العمليات",
    team: "Management",
    teamAr: "الإدارة",
    isActive: true,
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "acct-sales",
    username: "youssef",
    fullName: "Youssef Ali",
    initials: "YA",
    email: "youssef.ali@technocom.example",
    role: "Sales",
    roleTitle: "Sales manager",
    roleTitleAr: "مدير مبيعات",
    team: "Sales team",
    teamAr: "فريق المبيعات",
    isActive: true,
    createdAt: "2026-09-03T08:00:00Z",
    updatedAt: "2026-09-03T08:00:00Z",
  },
  {
    id: "acct-accountant",
    username: "hassan",
    fullName: "Hassan Mahmoud",
    initials: "HM",
    email: "hassan.mahmoud@technocom.example",
    role: "Accountant",
    roleTitle: "Chief accountant",
    roleTitleAr: "رئيس الحسابات",
    team: "Finance",
    teamAr: "المالية",
    isActive: true,
    createdAt: "2026-09-05T08:00:00Z",
    updatedAt: "2026-09-05T08:00:00Z",
  },
]

export type MockSession = {
  /** The account the mock API treats as signed in. Tests switch it to try another role. */
  userId: string
}

export const defaultSessionRole: Role = "Admin"
