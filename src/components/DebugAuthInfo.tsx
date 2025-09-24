import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DebugAuthInfo() {
  const { session } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugInfo = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-user-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Debug auth error:', error);
        setDebugInfo({ error: error.message });
      } else {
        console.log('Debug auth response:', data);
        setDebugInfo(data);
      }
    } catch (error) {
      console.error('Debug auth fetch error:', error);
      setDebugInfo({ error: 'Failed to fetch debug info' });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Debug Auth Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please sign in to see debug information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug Auth Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchDebugInfo} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Loading...' : 'Fetch Auth Debug Info'}
        </Button>
        
        {debugInfo && (
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}