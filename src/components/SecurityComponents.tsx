import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, EyeOff, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

interface SecurityBadgeProps {
  level: 'high' | 'medium' | 'low';
  label: string;
}

export function SecurityBadge({ level, label }: SecurityBadgeProps) {
  const getSecurityStyles = () => {
    switch (level) {
      case 'high':
        return 'bg-income/10 text-income border-income/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-expense/10 text-expense border-expense/20';
    }
  };

  return (
    <Badge className={`${getSecurityStyles()} gap-1`}>
      <Shield className="w-3 h-3" />
      {label}
    </Badge>
  );
}

interface SecureDataDisplayProps {
  data: string;
  maskPattern?: 'card' | 'account' | 'amount' | 'custom';
  customMask?: string;
  className?: string;
}

export function SecureDataDisplay({ 
  data, 
  maskPattern = 'custom', 
  customMask = '****',
  className = "" 
}: SecureDataDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getMaskedData = () => {
    if (isVisible) return data;
    
    switch (maskPattern) {
      case 'card':
        return `****-****-****-${data.slice(-4)}`;
      case 'account':
        return `${data.slice(0, 2)}*****${data.slice(-3)}`;
      case 'amount':
        return '₹****';
      default:
        return customMask;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-sm">{getMaskedData()}</span>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="p-1 hover:bg-muted rounded transition-colors"
      >
        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </div>
  );
}

interface SecurityIndicatorProps {
  lastLogin: Date;
  location: string;
  deviceCount: number;
  securityScore: number;
}

export function SecurityIndicator({ 
  lastLogin, 
  location, 
  deviceCount, 
  securityScore 
}: SecurityIndicatorProps) {
  const getSecurityLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-security/5 to-security/10 border-security/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-security/10 rounded-full">
            <Lock className="w-4 h-4 text-security" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Account Security</h3>
            <p className="text-xs text-muted-foreground">Last updated just now</p>
          </div>
        </div>
        <SecurityBadge level={getSecurityLevel(securityScore)} label={`${securityScore}%`} />
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Last login: {lastLogin.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>Location: {location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>{deviceCount} active device{deviceCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </Card>
  );
}