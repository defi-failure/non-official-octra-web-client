"use client";

import { useState, useEffect } from 'react';
import { useContractInteraction } from '@/hooks/use-contract-interaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useWallet } from "@/context/WalletContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import contract definitions
import contractList from '@/contracts/contracts.json';
import ocs01InterfaceRaw from '@/contracts/ocs01/exec_interface.json';

// Type the imported interface properly
const ocs01Interface: ContractInterfaceFile = ocs01InterfaceRaw as ContractInterfaceFile;

// Map interfaces by name - this links the interfaceName from contracts.json to the actual interface files
const interfaces: Record<string, ContractInterfaceFile> = {
  'ocs01': ocs01Interface,
};

interface Param {
  name: string;
  type: string;
  example?: string;
  max?: number;
}

interface Method {
  name: string;
  label: string;
  params: Param[];
  type: 'view' | 'call';
}

interface Contract {
  name: string;
  address: string;
  interfaceName: string;
}

interface ContractInterfaceFile {
  contract: string;
  methods: Method[];
}

const MethodExecutor = ({ method, contractAddress }: { method: Method; contractAddress: string }) => {
  const [params, setParams] = useState<Record<string, string>>({});
  const { wallet } = useWallet();
  const { execute, isLoading, error, result } = useContractInteraction();

  const handleParamChange = (name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paramValues = method.params.map((p) => params[p.name] || '');
    execute(contractAddress, method.name, paramValues, method.type);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border-t">
      {method.params.length > 0 && (
        <div className="space-y-2">
          {method.params.map((param, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 items-start gap-2">
              <Label htmlFor={`${method.name}-${param.name}`} className="md:text-right">{param.name}</Label>
              <div className="col-span-3">
                <Input
                  id={`${method.name}-${param.name}`}
                  type={param.type === 'number' ? 'number' : 'text'}
                  placeholder={param.example || param.type}
                  value={params[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  className="w-full"
                  required
                  {...(param.type === 'number' && param.max !== undefined ? { max: param.max } : {})}
                />
                {param.max !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Max value: {param.max}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {wallet && (
        <Button type="submit" disabled={isLoading} size="sm" variant={method.type === 'view' ? 'outline' : 'default'}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (method.type === 'view' ? 'Query' : 'Write')}
        </Button>
      )}
      {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
      {result !== null && (
        <div className="mt-4">
          <Label>Result</Label>
          <pre className="bg-muted p-2 rounded-md text-sm whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </form>
  );
};

export function ContractInterface() {
  const [selectedContract, setSelectedContract] = useState<Contract>(contractList[0]);
  const [contractInterface, setContractInterface] = useState<ContractInterfaceFile | null>(null);

  useEffect(() => {
    if (selectedContract) {
      const anInterface = interfaces[selectedContract.interfaceName];
      setContractInterface(anInterface);
    }
  }, [selectedContract]);

  const handleContractChange = (address: string) => {
    const contract = contractList.find(c => c.address === address);
    if (contract) {
      setSelectedContract(contract as Contract);
    }
  };

  const readMethods = contractInterface?.methods.filter(m => m.type === 'view') as Method[] || [];
  const writeMethods = contractInterface?.methods.filter(m => m.type === 'call') as Method[] || [];

  return (
    <div className="space-y-6 relative">
      <Card>
        <CardHeader>
          <CardTitle>Select Contract</CardTitle>
          <CardDescription>Choose a contract to interact with.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="relative z-50">
            <Select onValueChange={handleContractChange} defaultValue={selectedContract.address}>
              <SelectTrigger className="w-full min-h-[3.5rem] h-auto py-2 px-3">
                <SelectValue placeholder="Select a contract">
                  {selectedContract && (
                    <div className="flex flex-col items-start w-full min-w-0 gap-1">
                      <span className="font-medium text-sm leading-tight">{selectedContract.name}</span>
                      <span className="text-xs text-muted-foreground truncate w-full leading-tight">
                        {selectedContract.address}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="max-w-[90vw] w-auto min-w-[var(--radix-select-trigger-width)]"
                sideOffset={5}
              >
                {contractList.map(contract => (
                  <SelectItem key={contract.address} value={contract.address}>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-medium">{contract.name}</span>
                      <span className="text-xs text-muted-foreground break-all">
                        {contract.address}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!contractInterface ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Card>
          <Tabs defaultValue="read">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="read">Read Contract</TabsTrigger>
                <TabsTrigger value="write">Write Contract</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="read">
                <Accordion type="single" collapsible className="w-full">
                  {readMethods.map((method, index) => (
                    <AccordionItem value={`read-${index}`} key={method.name}>
                      <AccordionTrigger>{index + 1}. {method.name}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground p-4">{method.label}</p>
                        <MethodExecutor method={method} contractAddress={selectedContract.address} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
              <TabsContent value="write">
                <Accordion type="single" collapsible className="w-full">
                  {writeMethods.map((method, index) => (
                    <AccordionItem value={`write-${index}`} key={method.name}>
                      <AccordionTrigger>{index + 1}. {method.name}</AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground p-4">{method.label}</p>
                        <MethodExecutor method={method} contractAddress={selectedContract.address} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}