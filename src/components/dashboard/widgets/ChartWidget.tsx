
import React, { useState, useEffect } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore, extractValue } from '@/lib/mqtt';
import { TrendingUp, Layers, ExternalLink, Trash } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ChartWidgetProps {
  id?: string;
  title: string;
  topic: string;
  valuePath?: string;
  unit?: string;
  color?: string;
  maxDataPoints?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showControls?: boolean;
  onRemove?: () => void;
  onViewDetail?: () => void;
}

export function ChartWidget({
  id,
  title,
  topic,
  valuePath,
  unit = '',
  color = "#1EAEDB",
  maxDataPoints = 20,
  size = "lg",
  className,
  showControls = false,
  onRemove,
  onViewDetail
}: ChartWidgetProps) {
  const { messages, connected } = useMqttStore();
  const message = messages[topic];
  
  const [chartData, setChartData] = useState<Array<{time: string; value: number}>>([]);

  // Update chart data when a new message arrives
  useEffect(() => {
    if (message) {
      const value = extractValue(message, valuePath);
      if (typeof value === 'number') {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setChartData(prevData => {
          const newData = [...prevData, { time: timeString, value }];
          // Keep only the last maxDataPoints
          if (newData.length > maxDataPoints) {
            return newData.slice(newData.length - maxDataPoints);
          }
          return newData;
        });
      }
    }
  }, [message, valuePath, maxDataPoints]);

  return (
    <BentoCard 
      title={title}
      size={size}
      icon={<Layers className="h-5 w-5" />}
      className={cn(
        'transition-all duration-300',
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
      
      <div className="h-full w-full flex flex-col">
        <div className="flex-grow h-full min-h-[180px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }} 
                  tickCount={5}
                  stroke="#6B7280"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#6B7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(26, 31, 44, 0.8)', 
                    border: 'none',
                    borderRadius: '4px',
                    color: '#FFFFFF'
                  }}
                  formatter={(value) => [`${value} ${unit}`, 'Value']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={true}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <span>Waiting for data...</span>
            </div>
          )}
        </div>
      </div>
    </BentoCard>
  );
}
