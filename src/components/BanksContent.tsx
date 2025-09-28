import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalStore } from '@/store/globalStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CreditCard, 
  Building,
  Plus,
  Download
} from 'lucide-react';

interface UserBank {
  id: string;
  bank_name: string;
  bank_account_no: string;
  created_at: string;
}

const AVAILABLE_BANKS = [
  { name: 'HDFC', displayName: 'HDFC Bank', description: 'Connect your HDFC Bank account' }
];

export const BanksContent = () => {
  const { toast } = useToast();
  
  // Use global store for banks data
  const { banks: userBanks, loading: isLoading } = useGlobalStore();

  const handleDemoAction = (action: string) => {
    toast({
      title: "Demo Mode",
      description: `${action} is disabled in demo mode. This is a read-only demonstration.`,
      variant: "default",
    });
  };



  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Connected Banks List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium">Connected Banks</h2>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="touch-target" disabled>
                <Plus className="h-4 w-4" />
                Add Bank (Demo)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium">Demo Mode</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Bank connection is disabled in demo mode. This is a read-only demonstration.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Building className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Demo Mode</h3>
                  <p className="text-sm text-muted-foreground">Bank connection features are disabled in this demo version.</p>
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => handleDemoAction('Bank connection')}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin mb-3 text-primary border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground text-sm">Loading banks...</p>
          </div>
        ) : userBanks.length > 0 ? (
          <div className="space-y-3">
            {userBanks.map((bank) => (
              <div key={bank.id} className="card-minimal p-4 hover:shadow-material-light transition-all duration-200 rounded-xl border border-border">
                <div className="space-y-4">
                  {/* Bank Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-base">{bank.bank_name} Bank</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                            •••• {bank.bank_account_no.slice(-4)}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 border-success/30 bg-success/10 text-success">
                            ✓ Connected
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Demo Badge */}
                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-blue-300 bg-blue-50 text-blue-700">
                      Demo
                    </Badge>
                  </div>
                  
                  {/* Bank Details */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-border/20">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Added</p>
                      <p className="text-sm font-medium">
                        {new Date(bank.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Account</p>
                      <p className="text-sm font-medium font-mono">{bank.bank_account_no}</p>
                    </div>
                  </div>
                  
                  {/* Demo Actions */}
                  <div className="space-y-3">
                    <div className="text-center py-4 bg-muted/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">
                        Transaction scanning is disabled in demo mode
                      </p>
                      <Button 
                        onClick={() => handleDemoAction('Transaction scanning')}
                        disabled
                        className="w-full touch-target"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Scan Transactions (Demo)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <Building className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No banks connected</h3>
                <p className="text-sm text-muted-foreground">Connect your first bank account to start tracking transactions automatically</p>
              </div>
              <Button 
                onClick={() => handleDemoAction('Bank connection')}
                disabled
                className="touch-target mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Bank (Demo)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};