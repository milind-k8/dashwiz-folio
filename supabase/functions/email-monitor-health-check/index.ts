import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`Email monitor health check received ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting email monitoring system health check');

    const healthReport = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {} as any,
      alerts: [] as string[],
      statistics: {} as any
    };

    // Check 1: Monitor configurations
    try {
      const { data: monitors, error: monitorsError } = await supabase
        .from('email_monitors')
        .select('id, user_id, monitoring_enabled, last_processed_timestamp')
        .eq('monitoring_enabled', true);

      if (monitorsError) throw monitorsError;

      healthReport.checks.activeMonitors = {
        status: 'pass',
        count: monitors?.length || 0,
        details: 'Active email monitors found'
      };

      healthReport.statistics.activeMonitors = monitors?.length || 0;

      // Check for stale monitors (no activity in 24 hours)
      const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const staleMonitors = monitors?.filter(m => 
        new Date(m.last_processed_timestamp) < staleThreshold
      ) || [];

      if (staleMonitors.length > 0) {
        healthReport.alerts.push(`${staleMonitors.length} monitors haven't processed emails in 24+ hours`);
        healthReport.checks.staleMonitors = {
          status: 'warn',
          count: staleMonitors.length,
          details: 'Some monitors appear stale'
        };
      }

    } catch (error: any) {
      healthReport.checks.activeMonitors = {
        status: 'fail',
        error: error.message,
        details: 'Failed to check monitor configurations'
      };
      healthReport.status = 'unhealthy';
    }

    // Check 2: Processing queue health
    try {
      const { data: queueStats, error: queueError } = await supabase
        .from('email_processing_queue')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (queueError) throw queueError;

      const statusCounts = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retry: 0
      };

      queueStats?.forEach(item => {
        statusCounts[item.status as keyof typeof statusCounts]++;
      });

      healthReport.statistics.queueStats = statusCounts;

      // Alert if too many failed items
      const failureRate = statusCounts.failed / (queueStats?.length || 1);
      if (failureRate > 0.1 && statusCounts.failed > 5) {
        healthReport.alerts.push(`High failure rate: ${(failureRate * 100).toFixed(1)}% (${statusCounts.failed} failed items)`);
        healthReport.status = 'unhealthy';
      }

      // Alert if queue is backing up
      if (statusCounts.pending > 100) {
        healthReport.alerts.push(`Queue backlog: ${statusCounts.pending} pending items`);
        healthReport.status = 'degraded';
      }

      // Check for stuck processing items (processing for >30 minutes)
      const { data: stuckItems, error: stuckError } = await supabase
        .from('email_processing_queue')
        .select('id, user_id, updated_at')
        .eq('status', 'processing')
        .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

      if (!stuckError && stuckItems && stuckItems.length > 0) {
        healthReport.alerts.push(`${stuckItems.length} items stuck in processing state`);
        
        // Reset stuck items to retry
        await supabase
          .from('email_processing_queue')
          .update({ 
            status: 'retry',
            scheduled_at: new Date().toISOString(),
            error_message: 'Reset from stuck processing state by health check'
          })
          .in('id', stuckItems.map(item => item.id));

        console.log(`Reset ${stuckItems.length} stuck processing items to retry`);
      }

      healthReport.checks.processingQueue = {
        status: 'pass',
        details: 'Processing queue is healthy',
        statistics: statusCounts
      };

    } catch (error: any) {
      healthReport.checks.processingQueue = {
        status: 'fail',
        error: error.message,
        details: 'Failed to check processing queue'
      };
      healthReport.status = 'unhealthy';
    }

    // Check 3: Recent processing activity
    try {
      const { data: recentLogs, error: logsError } = await supabase
        .from('processing_logs')
        .select('log_level, created_at')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;

      const logCounts = {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0
      };

      recentLogs?.forEach(log => {
        logCounts[log.log_level as keyof typeof logCounts]++;
      });

      healthReport.statistics.recentLogs = logCounts;

      // Alert if too many errors recently
      const errorRate = logCounts.error / (recentLogs?.length || 1);
      if (errorRate > 0.2 && logCounts.error > 10) {
        healthReport.alerts.push(`High error rate in logs: ${(errorRate * 100).toFixed(1)}% (${logCounts.error} errors in last hour)`);
        healthReport.status = 'degraded';
      }

      healthReport.checks.recentActivity = {
        status: 'pass',
        details: 'Recent processing activity looks normal',
        statistics: logCounts
      };

    } catch (error: any) {
      healthReport.checks.recentActivity = {
        status: 'fail',
        error: error.message,
        details: 'Failed to check recent activity'
      };
    }

    // Check 4: Token health (check for users with expired tokens)
    try {
      const { data: expiredTokenUsers, error: tokenError } = await supabase
        .from('profiles')
        .select('user_id, token_updated_at')
        .lt('token_updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!tokenError && expiredTokenUsers && expiredTokenUsers.length > 0) {
        healthReport.alerts.push(`${expiredTokenUsers.length} users may have expired tokens (>7 days old)`);
        healthReport.checks.tokenHealth = {
          status: 'warn',
          count: expiredTokenUsers.length,
          details: 'Some users may need to re-authenticate'
        };
      } else {
        healthReport.checks.tokenHealth = {
          status: 'pass',
          details: 'User tokens appear fresh'
        };
      }

    } catch (error: any) {
      healthReport.checks.tokenHealth = {
        status: 'fail',
        error: error.message,
        details: 'Failed to check token health'
      };
    }

    // Trigger background processor if there are pending items
    const pendingCount = healthReport.statistics.queueStats?.pending || 0;
    if (pendingCount > 0) {
      console.log(`Triggering background processor for ${pendingCount} pending items`);
      
      const { error: processorError } = await supabase.functions.invoke('background-transaction-processor', {
        body: {}
      });

      if (processorError) {
        console.error('Failed to trigger background processor:', processorError);
        healthReport.alerts.push('Failed to trigger background processor');
      }
    }

    // Clean up old logs (keep only last 7 days)
    const cleanupDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: cleanupError } = await supabase
      .from('processing_logs')
      .delete()
      .lt('created_at', cleanupDate);

    if (cleanupError) {
      console.error('Failed to cleanup old logs:', cleanupError);
    } else {
      console.log('Cleaned up old processing logs');
    }

    // Clean up old completed queue items
    const { error: queueCleanupError } = await supabase
      .from('email_processing_queue')
      .delete()
      .eq('status', 'completed')
      .lt('created_at', cleanupDate);

    if (queueCleanupError) {
      console.error('Failed to cleanup old queue items:', queueCleanupError);
    } else {
      console.log('Cleaned up old completed queue items');
    }

    // Log health check results
    await supabase.from('processing_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      log_level: healthReport.status === 'healthy' ? 'info' : 'warn',
      message: `Health check completed: ${healthReport.status}`,
      details: {
        status: healthReport.status,
        alerts: healthReport.alerts,
        statistics: healthReport.statistics
      }
    });

    console.log(`Health check completed with status: ${healthReport.status}`);
    if (healthReport.alerts.length > 0) {
      console.log('Alerts:', healthReport.alerts);
    }

    return new Response(
      JSON.stringify(healthReport),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ 
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
