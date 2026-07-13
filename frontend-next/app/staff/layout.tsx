import { StaffShell } from "@/components/staff/staff-shell";

export default function StaffRootLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
