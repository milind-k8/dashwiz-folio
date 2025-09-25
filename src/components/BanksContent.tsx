import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

// Helper function to convert stored bank name to edge function format
const getBankCodeFromStoredName = (storedBankName: string): string => {
  const bankName = storedBankName.toUpperCase();
  if (bankName.includes('HDFC')) return 'HDFC';
  if (bankName.includes('ICICI')) return 'ICICI';
  if (bankName.includes('SBI')) return 'SBI';
  return bankName; // fallback
};

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
        toast({
          title: "Google Authentication Required",
          description: "Please sign out and sign in with Google to verify your bank account.",
          variant: "destructive",
        });
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

      if (data.valid) {
        toast({
          title: "Success",
          description: data.message,
        });
        setShowAddBankDialog(false);
        // Add the new bank to global store
        const newBank = {
          id: data.bankId,
          user_id: session.user.id,
          bank_name: data.bankName,
          bank_account_no: data.accountNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        addBank(newBank);
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Could not verify your bank account.",
          variant: "destructive",
        });
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

      toast({
        title: "Success",
        description: `${bankName} bank has been removed.`,
      });
      
      // Remove from global store
      removeBank(bankId);
    } catch (error: any) {
      console.error('Error deleting bank:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank. Please try again.",
        variant: "destructive",
      });
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
          bankName: getBankCodeFromStoredName(bank.bank_name),
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
      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
          <p className="text-muted-foreground">Please sign in to manage your banks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Connected Banks
          </h1>
          <p className="text-muted-foreground">
            Connect your banks by verifying through email
          </p>
        </div>
        
        <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>
                Select a bank to connect. We'll verify your account using your email.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {AVAILABLE_BANKS.map((bank) => (
                <Card key={bank.name} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{bank.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{bank.description}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleVerifyBank(bank.name)}
                      disabled={isVerifying}
                      className="flex items-center gap-2"
                    >
                      {isVerifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {isVerifying ? 'Verifying...' : 'Verify & Add'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBankDialog(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {/* Connected Banks List */}
      <Card className="p-4 md:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Your Banks</h2>
            <p className="text-sm text-muted-foreground">Manage your connected bank accounts</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your banks...</p>
          </div>
        ) : userBanks.length > 0 ? (
          <div className="space-y-4">
            {userBanks.map((bank) => (
              <Card key={bank.id} className="p-4 border border-border/50 hover:shadow-md transition-all duration-200 hover:border-primary/20">
                <div className="flex flex-col space-y-4">
                  {/* Bank Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{bank.bank_name} Bank</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {bank.bank_account_no}
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
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-t border-border/30">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Added On</p>
                      <p className="text-sm font-medium">
                        {new Date(bank.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Month Selection and Actions */}
                  <div className="pt-2 space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Select Month to Scan
                      </label>
                      <Select 
                        value={getSelectedMonth(bank.id)} 
                        onValueChange={(value) => handleMonthChange(bank.id, value)}
                      >
                        <SelectTrigger className="w-full">
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
                      className="w-full flex items-center gap-2"
                      size="sm"
                    >
                      {processingBanks.has(bank.bank_name) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Scan Transactions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted/20 rounded-full">
                <Building className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-muted-foreground">No banks connected yet</p>
                <p className="text-sm text-muted-foreground/70">Add your first bank to start tracking transactions</p>
              </div>
              <Button 
                onClick={() => setShowAddBankDialog(true)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Bank
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};