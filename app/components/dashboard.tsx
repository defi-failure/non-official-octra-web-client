import { Header } from "./dashboard/header";
import { Sidebar } from "./dashboard/sidebar";
import { ContractInterface } from "./dashboard/contract-interface";
import { HistoryTable } from "./dashboard/history-table";
import { useWallet } from "@/context/WalletContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Dashboard() {
  const { logout } = useWallet();

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <Header onLogout={logout} />
      <div className="flex-grow flex items-start justify-center mt-6">
        <main className="grid w-full max-w-7xl grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
          <div className="lg:col-span-2">
            <Tabs defaultValue="contract">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="contract">Contract</TabsTrigger>
              </TabsList>
              <TabsContent value="contract">
                <ContractInterface />
              </TabsContent>
              <TabsContent value="history">
                <HistoryTable />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <div className="mt-16"></div>
    </div>
  );
}
