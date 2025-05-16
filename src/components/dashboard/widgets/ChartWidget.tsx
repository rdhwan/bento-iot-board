import React, { useState, useEffect } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore, extractValue } from '@/lib/mqtt';
import { TrendingUp, Layers } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ChartWidgetProps {
  title: string;
  topic: string;
  valuePath?: string;
  unit?: string;
  color?: string;
  maxDataPoints?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ChartWidget({
  title,
  topic,
  valuePath,
  unit = '',
  color = "#1EAEDB",
  maxDataPoints = 20,
  size = "lg",
  className,
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
