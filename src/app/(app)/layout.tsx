import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="safe-bottom min-h-dvh">{children}</main>
      <BottomNav />
    </>
  );
}
