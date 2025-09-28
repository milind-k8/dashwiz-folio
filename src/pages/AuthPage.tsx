import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDemoLogin = () => {
    setIsLoading(true);
    // Simulate loading for demo purposes
    setTimeout(() => {
      navigate('/');
      toast({
        title: "Welcome to Demo",
        description: "You're now logged in to the demo dashboard",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    handleDemoLogin();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    handleDemoLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Demo Dashboard
          </CardTitle>
          <CardDescription>
            Click any button below to access the demo dashboard with sample financial data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12"
          >
            <GoogleIcon className="mr-2" size={16} />
            Demo with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or demo with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full h-12"
            >
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Enter Demo
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              This is a demo version with sample data
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}