
import React, { useState, useMemo } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore, extractValue } from '@/lib/mqtt';
import { Gauge, TrendingUp, TrendingDown, Clock, ExternalLink, Trash, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SensorWidgetProps {
  id?: string;
  title: string;
  topic: string;
  valuePath?: string;
  unit?: string;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  formatValue?: (value: any) => string;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  showControls?: boolean;
  onRemove?: () => void;
  onViewDetail?: () => void;
}

export function SensorWidget({
  id,
  title,
  topic,
  valuePath,
  unit = '',
  min = 0,
  max = 100,
  size = "md",
  className,
  formatValue,
  thresholds = {},
  showControls = false,
  onRemove,
  onViewDetail
}: SensorWidgetProps) {
  const { messages, connected } = useMqttStore();
  const message = messages[topic];

  // Extract the value from the message
  const value = useMemo(() => {
    const rawValue = extractValue(message, valuePath);
    return typeof rawValue === 'number' ? rawValue : null;
  }, [message, valuePath]);

  // Format the value for display
  const displayValue = useMemo(() => {
    if (value === null) return '—';
    if (formatValue) return formatValue(value);
    return value.toFixed(1);
  }, [value, formatValue]);

  // Calculate the trend by comparing with previous values
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    if (value !== null && prevValue !== null) {
      if (value > prevValue) {
        setTrend('up');
      } else if (value < prevValue) {
        setTrend('down');
      }
    }
    setPrevValue(value);
  }, [value]);

  // Determine the status based on thresholds
  const status = useMemo(() => {
    if (value === null) return 'neutral';
    if (thresholds.critical !== undefined && value >= thresholds.critical) return 'critical';
    if (thresholds.warning !== undefined && value >= thresholds.warning) return 'warning';
    return 'normal';
  }, [value, thresholds]);

  // Get the timestamp for the last update
  const lastUpdate = message?.timestamp ? new Date(message.timestamp) : null;
  const timeString = lastUpdate ? lastUpdate.toLocaleTimeString() : '—';

  return (
    <BentoCard 
      title={title}
      size={size}
      icon={<Gauge className="h-5 w-5" />}
      className={cn(
        'transition-all duration-300',
        status === 'warning' ? 'border-l-4 border-yellow-500' : '',
        status === 'critical' ? 'border-l-4 border-red-500' : '',
        !connected && 'opacity-60',
        className
      )}
    >
      {showControls && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onViewDetail && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail();
              }}
              title="View Details"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove Widget"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      <div className="flex flex-col h-full">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <span className={cn(
                "text-3xl font-bold",
                status === 'warning' ? 'text-yellow-500' : '',
                status === 'critical' ? 'text-red-500' : '',
                !value && 'text-gray-400 animate-pulse-subtle'
              )}>
                {displayValue}
              </span>
              <span className="ml-1 text-gray-500">{unit}</span>
              
              {trend && (
                <div className="ml-2">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center justify-end mt-2">
          <Clock className="h-3 w-3 mr-1" /> 
          <span>Last update: {timeString}</span>
        </div>
      </div>
    </BentoCard>
  );
}
