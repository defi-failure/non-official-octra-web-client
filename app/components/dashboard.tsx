import { Header } from "./dashboard/header";
import { Sidebar } from "./dashboard/sidebar";
import { HistoryTable } from "./dashboard/history-table";
import { useWallet } from "@/context/WalletContext";

export function Dashboard() {
  const { logout } = useWallet();

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <Header onLogout={logout} />
      <div className="flex-grow flex items-center justify-center">
        <main className="grid w-full max-w-7xl grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
          <div className="lg:col-span-2">
            <HistoryTable />
          </div>
        </main>
      </div>
    </div>
  );
}