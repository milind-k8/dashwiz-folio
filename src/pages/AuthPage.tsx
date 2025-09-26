import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
            include_granted_scopes: 'true',
          },
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-primary p-4">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-white mb-4">FinanceTracker</h1>
        <p className="text-xl text-white/80">Your Personal Financial Dashboard</p>
      </div>
      
      <Card className="w-full max-w-md shadow-large bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome
          </CardTitle>
          <CardDescription>
            Sign in to access your financial dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            variant="outline"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-50 border-2"
          >
            <GoogleIcon className="mr-3" size={20} />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}