import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
  score?: number;
  className?: string;
}

export function ConfidenceBadge({ level, score, className }: ConfidenceBadgeProps) {
  const config = {
    high: {
      color: 'text-success bg-success/10 border-success/20',
      icon: ShieldCheck,
      label: 'High Confidence'
    },
    medium: {
      color: 'text-warning bg-warning/10 border-warning/20',
      icon: Sparkles,
      label: 'Medium Confidence'
    },
    low: {
      color: 'text-destructive bg-destructive/10 border-destructive/20',
      icon: AlertTriangle,
      label: 'Low Confidence'
    }
  };

  const { color, icon: Icon, label } = config[level] || config.medium;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium", color, className)}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label} {score ? `(${Math.round(score * 100)}%)` : ''}</span>
    </div>
  );
}
