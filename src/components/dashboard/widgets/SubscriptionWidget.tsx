
import React, { useState } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore } from '@/lib/mqtt';
import { List, Square, SquareKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionWidgetProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SubscriptionWidget({ size = "md", className }: SubscriptionWidgetProps) {
  const { connected, subscribe, unsubscribe, messages } = useMqttStore();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState('');
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  
  const handleSubscribe = () => {
    if (!connected) {
      toast({
        title: "Not Connected",
        description: "Please connect to an MQTT broker first",
        variant: "destructive",
      });
      return;
    }
    
    if (!topic) {
      toast({
        title: "Error",
        description: "Please enter a topic to subscribe to",
        variant: "destructive",
      });
      return;
    }
    
    if (activeTopics.includes(topic)) {
      toast({
        title: "Already Subscribed",
        description: `Already subscribed to ${topic}`,
        variant: "default",
      });
      return;
    }
    
    subscribe(topic);
    setActiveTopics([...activeTopics, topic]);
    setTopic('');
    
    toast({
      title: "Subscribed",
      description: `Subscribed to ${topic}`,
    });
  };
  
  const handleUnsubscribe = (topicToRemove: string) => {
    unsubscribe(topicToRemove);
    setActiveTopics(activeTopics.filter(t => t !== topicToRemove));
    
    toast({
      title: "Unsubscribed",
      description: `Unsubscribed from ${topicToRemove}`,
    });
  };
  
  // Count messages for each topic
  const topicMessageCounts = activeTopics.map(topic => {
    return {
      topic,
      count: messages[topic] ? 1 : 0,
      lastUpdate: messages[topic]?.timestamp
    };
  });
  
  return (
    <BentoCard
      title="Topic Subscriptions"
      icon={<SquareKanban className="h-5 w-5" />}
      size={size}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex space-x-2">
          <div className="flex-grow">
            <Input 
              placeholder="Enter topic (e.g., sensors/temperature)" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
              disabled={!connected}
            />
          </div>
          <Button 
            onClick={handleSubscribe}
            disabled={!connected || !topic}
          >
            Subscribe
          </Button>
        </div>
        
        <div className="border rounded-md">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 border-b rounded-t-md">
            <div className="flex items-center text-sm font-medium">
              <List className="h-4 w-4 mr-2" />
              Active Subscriptions
            </div>
          </div>
          
          <ScrollArea className="h-[120px] rounded-b-md">
            {activeTopics.length > 0 ? (
              <ul className="p-2 space-y-1">
                {topicMessageCounts.map(({ topic, count, lastUpdate }) => (
                  <li key={topic} className="flex items-center justify-between p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm">
                    <div className="flex items-center space-x-2 truncate">
                      <Square className="h-3 w-3 text-iot-blue" />
                      <span className="truncate">{topic}</span>
                      {count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(lastUpdate!).toLocaleTimeString()}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleUnsubscribe(topic)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No active subscriptions
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </BentoCard>
  );
}
