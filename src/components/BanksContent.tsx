import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { showAndroidToast, showSuccessToast, showErrorToast } from '@/utils/android-toast';
import { useGlobalStore } from '@/store/globalStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  Trash2,
  Building,
  Plus,
  CheckCircle,
  Loader2,
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Record<string, string>>({});
  const [processingBanks, setProcessingBanks] = useState<Set<string>>(new Set());
  const { session } = useAuth();
  const { toast } = useToast();
  
  // Use global store for banks data
  const { banks: userBanks, loading: isLoading, addBank, removeBank } = useGlobalStore();

  const handleVerifyBank = async (bankName: string) => {
    try {
      setIsVerifying(true);
      
      // Check if user has Google access token
      if (!session?.provider_token) {
        showErrorToast("Google Authentication Required");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('verify-bank', {
        body: { 
          bankName,
          googleAccessToken: session.provider_token
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to verify bank');
      }

      if (data.success) {
        showSuccessToast(data.message);
        setShowAddBankDialog(false);
        // Add the new bank to global store
        if (data.bank) {
          addBank(data.bank);
        }
      } else {
        showErrorToast(data.message || "Could not verify your bank account.");
      }
    } catch (error: any) {
      console.error('Error verifying bank:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify bank. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteBank = async (bankId: string, bankName: string) => {
    try {
      const { error } = await supabase
        .from('user_banks')
        .delete()
        .eq('id', bankId);

      if (error) {
        throw new Error('Failed to delete bank');
      }

      showSuccessToast(`${bankName} bank has been removed.`);
      
      // Remove from global store
      removeBank(bankId);
    } catch (error: any) {
      console.error('Error deleting bank:', error);
      showErrorToast(error.message || "Failed to delete bank. Please try again.");
    }
  };

  const handleProcessTransactions = async (bank: UserBank) => {
    const selectedMonth = selectedMonths[bank.id];
    if (!selectedMonth) return;

    try {
      setProcessingBanks(prev => new Set([...prev, bank.bank_name]));
      
      // Get user session to access Google token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.provider_token) {
        toast({
          title: "Authentication Required",
          description: "Google authentication required. Please sign out and sign in with Google.",
          variant: "destructive"
        });
        setProcessingBanks(prev => {
          const newSet = new Set(prev);
          newSet.delete(bank.bank_name);
          return newSet;
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('process-transactions', {
        body: { 
          bankName: bank.bank_name.toLowerCase(),
          month: selectedMonth,
          googleAccessToken: session.provider_token
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process transactions');
      }

      if (data.success) {
        toast({
          title: "Processing Started",
          description: `Transaction processing for ${bank.bank_name} (${selectedMonth}) has been initiated.`,
        });
      } else {
        toast({
          title: "Processing Failed",
          description: data.message || "Could not start transaction processing.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error processing transactions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingBanks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bank.bank_name);
        return newSet;
      });
    }
  };

  // Get current and previous month options
  const getMonthOptions = () => {
    const now = new Date();
    const currentMonth = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const previousMonth = `${(prevMonth.getMonth() + 1).toString().padStart(2, '0')}/${prevMonth.getFullYear()}`;
    
    return [
      { value: currentMonth, label: `Current Month (${currentMonth})` },
      { value: previousMonth, label: `Previous Month (${previousMonth})` }
    ];
  };

  // Get current month as default
  const getCurrentMonth = () => {
    const now = new Date();
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  };

  // Set default month for bank if not set
  const getSelectedMonth = (bankId: string) => {
    if (!selectedMonths[bankId]) {
      setSelectedMonths(prev => ({ ...prev, [bankId]: getCurrentMonth() }));
      return getCurrentMonth();
    }
    return selectedMonths[bankId];
  };

  const handleMonthChange = (bankId: string, month: string) => {
    setSelectedMonths(prev => ({ ...prev, [bankId]: month }));
  };

  if (!session?.user) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <Building className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-medium mb-2">Sign in to continue</h2>
          <p className="text-sm text-muted-foreground">Connect with your Google account to manage bank accounts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Connected Banks List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-medium">Connected Banks</h2>
          </div>
          
          <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="touch-target">
                <Plus className="h-4 w-4" />
                Add Bank
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-medium">Add Bank Account</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Select a bank to connect. We'll verify your account using your email.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                {AVAILABLE_BANKS.map((bank) => (
                  <div key={bank.name} className="card-minimal p-4 hover:shadow-material-light transition-all duration-200 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{bank.displayName}</h3>
                          <p className="text-xs text-muted-foreground">{bank.description}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleVerifyBank(bank.name)}
                        disabled={isVerifying}
                        size="sm"
                        className="touch-target"
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {isVerifying ? 'Verifying...' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setShowAddBankDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin mb-3 text-primary" />
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
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {bank.bank_name} Bank?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the bank account from your connected banks. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteBank(bank.id, bank.bank_name)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                  
                  {/* Month Selection and Actions */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Scan transactions for
                      </label>
                      <Select 
                        value={getSelectedMonth(bank.id)} 
                        onValueChange={(value) => handleMonthChange(bank.id, value)}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getMonthOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={() => handleProcessTransactions(bank)}
                      disabled={processingBanks.has(bank.bank_name) || !getSelectedMonth(bank.id)}
                      className="w-full touch-target"
                      size="sm"
                    >
                      {processingBanks.has(bank.bank_name) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Scan Transactions
                        </>
                      )}
                    </Button>
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
                onClick={() => setShowAddBankDialog(true)}
                className="touch-target mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Bank
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};