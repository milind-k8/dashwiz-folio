import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
}

export function useGmail() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGmailAvailable, setIsGmailAvailable] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if Gmail access is available when session changes
    setIsGmailAvailable(!!session?.provider_token);
  }, [session]);

  const fetchMessages = async (maxResults: number = 10, query: string = '') => {
    if (!isGmailAvailable) {
      toast({
        title: "Gmail not available",
        description: "Please sign in with Google to access Gmail.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail', {
        body: { maxResults, query }
      });

      if (error) {
        // Check if it's a token expiration issue
        if (error.message?.includes('access token expired') || 
            error.message?.includes('sign in again') ||
            error.message?.includes('Gmail access token expired')) {
          toast({
            title: "Gmail Access Expired",
            description: "Please sign out and sign in again with Google to refresh your Gmail access.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to fetch Gmail messages. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      setMessages(data.messages || []);
      toast({
        title: "Success",
        description: `Fetched ${data.messages?.length || 0} messages from Gmail.`,
      });
    } catch (error: any) {
      console.error('Error fetching Gmail messages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch Gmail messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (to: string, subject: string, body: string) => {
    console.warn('Send email functionality is disabled - readonly Gmail access only');
    toast({
      title: "Feature not available",
      description: "This app has readonly Gmail access only.",
      variant: "destructive",
    });
    return false;
  };

  const getEmailSubject = (message: GmailMessage): string => {
    const subjectHeader = message.payload.headers.find(
      header => header.name.toLowerCase() === 'subject'
    );
    return subjectHeader?.value || '(No Subject)';
  };

  const getEmailSender = (message: GmailMessage): string => {
    const fromHeader = message.payload.headers.find(
      header => header.name.toLowerCase() === 'from'
    );
    return fromHeader?.value || 'Unknown Sender';
  };

  const getEmailDate = (message: GmailMessage): string => {
    const dateHeader = message.payload.headers.find(
      header => header.name.toLowerCase() === 'date'
    );
    return dateHeader?.value || '';
  };

  return {
    messages,
    isLoading,
    isGmailAvailable,
    fetchMessages,
    getEmailSubject,
    getEmailSender,
    getEmailDate,
  };
}