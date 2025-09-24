import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface EmailMonitor {
  id: string;
  user_id: string;
  bank_patterns: any;
  last_processed_timestamp: string;
  monitoring_enabled: boolean;
  gmail_history_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessingQueueItem {
  id: string;
  user_id: string;
  email_id: string;
  gmail_message_id: string;
  status: string;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  scheduled_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessingLog {
  id: string;
  user_id: string;
  queue_id: string | null;
  log_level: string;
  message: string;
  details: any;
  created_at: string;
}

export function useEmailMonitoring() {
  const [emailMonitor, setEmailMonitor] = useState<EmailMonitor | null>(null);
  const [processingQueue, setProcessingQueue] = useState<ProcessingQueueItem[]>([]);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  // Load email monitor configuration
  const loadEmailMonitor = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('email_monitors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEmailMonitor(data);
      setIsMonitoringEnabled(data?.monitoring_enabled || false);
    } catch (error: any) {
      console.error('Error loading email monitor:', error);
    }
  }, [session?.user?.id]);

  // Load processing queue
  const loadProcessingQueue = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('email_processing_queue')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setProcessingQueue(data || []);
    } catch (error: any) {
      console.error('Error loading processing queue:', error);
    }
  }, [session?.user?.id]);

  // Load processing logs
  const loadProcessingLogs = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('processing_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setProcessingLogs(data || []);
    } catch (error: any) {
      console.error('Error loading processing logs:', error);
    }
  }, [session?.user?.id]);

  // Set up email monitoring
  const setupEmailMonitoring = useCallback(async (bankPatterns: string[]) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to set up email monitoring.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Get user's banks for patterns
      const { data: userBanks, error: banksError } = await supabase
        .from('user_banks')
        .select('bank_name')
        .eq('user_id', session.user.id);

      if (banksError) throw banksError;

      // Create patterns from bank names and additional patterns
      const allPatterns = [
        ...bankPatterns,
        ...(userBanks || []).map(bank => bank.bank_name.toLowerCase())
      ];

      const monitorData = {
        user_id: session.user.id,
        bank_patterns: allPatterns,
        monitoring_enabled: true,
        last_processed_timestamp: new Date().toISOString()
      };

      let result;
      if (emailMonitor) {
        result = await supabase
          .from('email_monitors')
          .update(monitorData)
          .eq('id', emailMonitor.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('email_monitors')
          .insert(monitorData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setEmailMonitor(result.data);
      setIsMonitoringEnabled(true);

      toast({
        title: "Email monitoring enabled",
        description: "Your bank emails will now be monitored for automatic transaction processing.",
      });

      return true;
    } catch (error: any) {
      console.error('Error setting up email monitoring:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up email monitoring.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, emailMonitor, toast]);

  // Toggle monitoring on/off
  const toggleMonitoring = useCallback(async (enabled: boolean) => {
    if (!emailMonitor) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('email_monitors')
        .update({ monitoring_enabled: enabled })
        .eq('id', emailMonitor.id);

      if (error) throw error;

      setIsMonitoringEnabled(enabled);
      setEmailMonitor(prev => prev ? { ...prev, monitoring_enabled: enabled } : null);

      toast({
        title: enabled ? "Monitoring enabled" : "Monitoring disabled",
        description: enabled 
          ? "Email monitoring is now active." 
          : "Email monitoring has been paused.",
      });
    } catch (error: any) {
      console.error('Error toggling monitoring:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update monitoring settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [emailMonitor, toast]);

  // Manually trigger processing for current month
  const triggerManualProcessing = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      // Get user's banks
      const { data: userBanks, error: banksError } = await supabase
        .from('user_banks')
        .select('bank_name')
        .eq('user_id', session.user.id);

      if (banksError) throw banksError;

      if (!userBanks || userBanks.length === 0) {
        toast({
          title: "No banks found",
          description: "Please add at least one bank before triggering processing.",
          variant: "destructive",
        });
        return;
      }

      const currentDate = new Date();
      const month = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;

      // Trigger processing for each bank
      for (const bank of userBanks) {
        const { error: processError } = await supabase.functions.invoke('process-transactions', {
          body: {
            bankName: bank.bank_name,
            month: month
          }
        });

        if (processError) {
          console.error(`Error processing ${bank.bank_name}:`, processError);
        }
      }

      toast({
        title: "Processing triggered",
        description: "Manual transaction processing has been started for all your banks.",
      });

      // Refresh queue and logs after a delay
      setTimeout(() => {
        loadProcessingQueue();
        loadProcessingLogs();
      }, 2000);

    } catch (error: any) {
      console.error('Error triggering manual processing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to trigger manual processing.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, toast, loadProcessingQueue, loadProcessingLogs]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id) return;

    // Subscribe to processing queue changes
    const queueSubscription = supabase
      .channel('processing-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_processing_queue',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          loadProcessingQueue();
        }
      )
      .subscribe();

    // Subscribe to processing logs changes
    const logsSubscription = supabase
      .channel('processing-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processing_logs',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          loadProcessingLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueSubscription);
      supabase.removeChannel(logsSubscription);
    };
  }, [session?.user?.id, loadProcessingQueue, loadProcessingLogs]);

  // Initial load
  useEffect(() => {
    if (session?.user?.id) {
      loadEmailMonitor();
      loadProcessingQueue();
      loadProcessingLogs();
    }
  }, [session?.user?.id, loadEmailMonitor, loadProcessingQueue, loadProcessingLogs]);

  return {
    emailMonitor,
    processingQueue,
    processingLogs,
    isLoading,
    isMonitoringEnabled,
    setupEmailMonitoring,
    toggleMonitoring,
    triggerManualProcessing,
    refreshData: () => {
      loadEmailMonitor();
      loadProcessingQueue();
      loadProcessingLogs();
    }
  };
}