import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Mail, Settings, Activity, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEmailMonitoring } from '@/hooks/useEmailMonitoring';

export function EmailMonitoringSetup() {
  const {
    emailMonitor,
    processingQueue,
    processingLogs,
    isLoading,
    isMonitoringEnabled,
    setupEmailMonitoring,
    toggleMonitoring,
    triggerManualProcessing,
    refreshData
  } = useEmailMonitoring();

  const [bankPatterns, setBankPatterns] = useState<string[]>(
    emailMonitor?.bank_patterns || ['alerts@hdfcbank.net', 'alerts@icicibank.com', 'customercare@sbi.co.in', 'sms@axisbank.com', 'noreply@kotak.com']
  );
  const [newPattern, setNewPattern] = useState('');

  const handleAddPattern = () => {
    if (newPattern.trim() && !bankPatterns.includes(newPattern.trim().toLowerCase())) {
      setBankPatterns([...bankPatterns, newPattern.trim().toLowerCase()]);
      setNewPattern('');
    }
  };

  const handleRemovePattern = (pattern: string) => {
    setBankPatterns(bankPatterns.filter(p => p !== pattern));
  };

  const handleSetupMonitoring = async () => {
    await setupEmailMonitoring(bankPatterns);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
      case 'retry':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warn':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      case 'debug':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const pendingCount = processingQueue.filter(item => ['pending', 'retry'].includes(item.status)).length;
  const failedCount = processingQueue.filter(item => item.status === 'failed').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Monitoring Setup
          </CardTitle>
          <CardDescription>
            Automatically monitor your Gmail for bank emails and process transactions in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monitoring Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="monitoring-toggle">Email Monitoring</Label>
              <p className="text-sm text-muted-foreground">
                {isMonitoringEnabled ? 'Monitoring active' : 'Monitoring paused'}
              </p>
            </div>
            <Switch
              id="monitoring-toggle"
              checked={isMonitoringEnabled}
              onCheckedChange={toggleMonitoring}
              disabled={isLoading || !emailMonitor}
            />
          </div>

          <Separator />

          {/* Bank Patterns Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Bank Email Addresses</Label>
              <p className="text-sm text-muted-foreground">
                Specific email addresses that send bank notifications (e.g., alerts@hdfcbank.net)
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter bank email address (e.g., alerts@bankname.com)"
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPattern()}
              />
              <Button onClick={handleAddPattern} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {bankPatterns.map((pattern) => (
                <Badge key={pattern} variant="secondary" className="gap-1">
                  {pattern}
                  <button
                    onClick={() => handleRemovePattern(pattern)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <Button
              onClick={handleSetupMonitoring}
              disabled={isLoading || bankPatterns.length === 0}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {emailMonitor ? 'Update Monitoring' : 'Enable Monitoring'}
            </Button>
          </div>

          <Separator />

          {/* Manual Processing */}
          <div className="space-y-2">
            <Button
              onClick={triggerManualProcessing}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Activity className="h-4 w-4 mr-2" />
              Trigger Manual Processing
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Process current month's emails immediately
            </p>
          </div>

          <Button
            onClick={refreshData}
            disabled={isLoading}
            variant="ghost"
            className="w-full"
          >
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {(pendingCount > 0 || failedCount > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {pendingCount > 0 && `${pendingCount} emails pending processing. `}
            {failedCount > 0 && `${failedCount} emails failed processing.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Processing Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
          <CardDescription>
            Recent email processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {processingQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No processing activity yet
              </p>
            ) : (
              processingQueue.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="text-sm font-medium">Email ID: {item.email_id.slice(-8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      item.status === 'completed' ? 'default' :
                      item.status === 'failed' ? 'destructive' :
                      item.status === 'processing' ? 'default' : 'secondary'
                    }>
                      {item.status}
                    </Badge>
                    {item.retry_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Retry {item.retry_count}/{item.max_retries}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Logs</CardTitle>
          <CardDescription>
            Detailed processing activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {processingLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No logs available
              </p>
            ) : (
              processingLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="p-2 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${getLogLevelColor(log.log_level)}`}>
                      {log.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}