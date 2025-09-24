import { Switch } from '@/components/ui/switch';
import { useEmailMonitoring } from '@/hooks/useEmailMonitoring';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

interface AutoFetchToggleProps {
  bankName: string;
}

export function AutoFetchToggle({ bankName }: AutoFetchToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { emailMonitor, setupEmailMonitoring, toggleMonitoring } = useEmailMonitoring();
  const { toast } = useToast();

  useEffect(() => {
    // Check if email monitoring is set up and enabled for this bank
    if (emailMonitor) {
      const bankPatterns = emailMonitor.bank_patterns as string[] || [];
      const bankEmailPattern = `alerts@${bankName.toLowerCase()}bank.net`;
      setIsEnabled(emailMonitor.monitoring_enabled && bankPatterns.includes(bankEmailPattern));
    }
  }, [emailMonitor, bankName]);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (!emailMonitor) {
        // First time setup - create email monitor with this bank's pattern
        const bankEmailPattern = `alerts@${bankName.toLowerCase()}bank.net`;
        await setupEmailMonitoring([bankEmailPattern]);
        setIsEnabled(true);
      } else {
        // Toggle existing monitoring
        await toggleMonitoring(checked);
        setIsEnabled(checked);
      }
      
      toast({
        title: checked ? "Auto-fetch Enabled" : "Auto-fetch Disabled",
        description: `Email monitoring for ${bankName} has been ${checked ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error toggling auto-fetch:', error);
      toast({
        title: "Error",
        description: "Failed to update auto-fetch settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Switch
      checked={isEnabled}
      onCheckedChange={handleToggle}
      disabled={isLoading}
    />
  );
}