import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  CreditCard, 
  Trash2,
  Building,
  Plus,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface UserBank {
  id: string;
  bank_name: string;
  card_number: string;
  created_at: string;
}

const AVAILABLE_BANKS = [
  { name: 'HDFC', displayName: 'HDFC Bank', description: 'Connect your HDFC Bank account' }
];

export const BanksContent = () => {
  const [userBanks, setUserBanks] = useState<UserBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (session?.user) {
      fetchUserBanks();
    }
  }, [session]);

  const fetchUserBanks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_banks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user banks:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your banks. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setUserBanks(data || []);
    } catch (error) {
      console.error('Error in fetchUserBanks:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setShowAddBankDialog(false);
        fetchUserBanks(); // Refresh the list
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
      
      fetchUserBanks(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting bank:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank. Please try again.",
        variant: "destructive",
      });
    }
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
        
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold">Bank Name</TableHead>
                <TableHead className="font-semibold">Card Number</TableHead>
                <TableHead className="font-semibold">Added On</TableHead>
                <TableHead className="font-semibold w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading your banks...</p>
                  </TableCell>
                </TableRow>
              ) : userBanks.length > 0 ? (
                userBanks.map((bank) => (
                  <TableRow key={bank.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{bank.bank_name} Bank</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {bank.card_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(bank.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Building className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No banks connected yet</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAddBankDialog(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Bank
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};