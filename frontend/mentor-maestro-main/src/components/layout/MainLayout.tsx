import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d1f1a' }}>
      <Sidebar />

      <div className="pl-64">
        <TopBar />
        <main className="p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
