import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";
import useSWR, { mutate } from 'swr'; // Import mutate for revalidation

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const handleRefresh = () => {
    // SWR's mutate function can revalidate all keys.
    // We use a predicate to only revalidate keys that are arrays (our API keys).
    mutate(key => Array.isArray(key), undefined, { revalidate: true });
  };

  return (
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
          <span className="sr-only">Refresh Data</span>
        </Button>
        <Button variant="destructive" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}