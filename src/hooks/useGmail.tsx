import { useState, useEffect } from 'react';
import { gmailService } from '@/services/gmailService';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface GmailMessage {
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
    if (session?.provider_token) {
      setIsGmailAvailable(gmailService.isGmailAccessAvailable());
    } else {
      setIsGmailAvailable(false);
    }
  }, [session]);

  const fetchMessages = async (maxResults: number = 10) => {
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
      const fetchedMessages = await gmailService.getMessages(maxResults);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Gmail messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail = async (to: string, subject: string, body: string) => {
    if (!isGmailAvailable) {
      toast({
        title: "Gmail not available",
        description: "Please sign in with Google to send emails.",
        variant: "destructive",
      });
      return false;
    }

    try {
      await gmailService.sendEmail(to, subject, body);
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
      return false;
    }
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
    sendEmail,
    getEmailSubject,
    getEmailSender,
    getEmailDate,
  };
}