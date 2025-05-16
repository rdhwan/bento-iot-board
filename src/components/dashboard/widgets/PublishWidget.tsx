
import React, { useState } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore } from '@/lib/mqtt';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface PublishWidgetProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PublishWidget({ size = "md", className }: PublishWidgetProps) {
  const { connected, publish } = useMqttStore();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState('test/sensor');
  const [message, setMessage] = useState(JSON.stringify({ value: 25.5, unit: '°C' }, null, 2));
  const [interval, setInterval] = useState(5);
  const [isPublishing, setIsPublishing] = useState(false);
  const [intervalId, setIntervalId] = useState<number | undefined>(undefined);
  
  const handlePublish = () => {
    if (!connected) {
      toast({
        title: "Not Connected",
        description: "Please connect to an MQTT broker first",
        variant: "destructive",
      });
      return;
    }
    
    if (!topic || !message) {
      toast({
        title: "Missing Data",
        description: "Please enter both topic and message",
        variant: "destructive",
      });
      return;
    }
    
    try {
      publish(topic, message);
      toast({
        title: "Published",
        description: `Message published to ${topic}`,
      });
    } catch (error) {
      toast({
        title: "Publish Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };
  
  const toggleAutoPublish = () => {
    if (isPublishing) {
      // Stop publishing
      if (intervalId) {
        window.clearInterval(intervalId);
        setIntervalId(undefined);
      }
      setIsPublishing(false);
      
      toast({
        title: "Auto Publish Stopped",
        description: `Stopped publishing to ${topic}`,
      });
    } else {
      // Start publishing
      if (!connected) {
        toast({
          title: "Not Connected",
          description: "Please connect to an MQTT broker first",
          variant: "destructive",
        });
        return;
      }
      
      if (!topic || !message) {
        toast({
          title: "Missing Data",
          description: "Please enter both topic and message",
          variant: "destructive",
        });
        return;
      }
      
      try {
        // Try to parse the message to see if it's valid JSON
        const parsedMsg = JSON.parse(message);
        
        // Set up interval for auto publishing
        const id = window.setInterval(() => {
          // If it's a number, vary it slightly for realistic data
          if (parsedMsg.value && typeof parsedMsg.value === 'number') {
            const variation = (Math.random() - 0.5) * 2; // Random value between -1 and 1
            const newValue = parsedMsg.value + variation;
            const newMsg = { ...parsedMsg, value: parseFloat(newValue.toFixed(1)) };
            publish(topic, JSON.stringify(newMsg));
          } else {
            // If not a number, just publish as is
            publish(topic, message);
          }
        }, interval * 1000);
        
        setIntervalId(id);
        setIsPublishing(true);
        
        toast({
          title: "Auto Publish Started",
          description: `Publishing to ${topic} every ${interval} seconds`,
        });
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Message must be valid JSON",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <BentoCard
      title="Publish Test Data"
      size={size}
      className={className}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="pubTopic">Topic</Label>
          <Input 
            id="pubTopic" 
            placeholder="test/sensor" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isPublishing}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="pubMessage">Message (JSON)</Label>
          <Textarea 
            id="pubMessage" 
            placeholder='{"value": 25.5, "unit": "°C"}' 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-20 font-mono text-xs"
            disabled={isPublishing}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            className="flex-grow"
            onClick={handlePublish}
            disabled={!connected || isPublishing}
          >
            Publish Once
          </Button>
          
          <div className="w-20">
            <Input 
              type="number" 
              min="1" 
              max="60"
              value={interval} 
              onChange={(e) => setInterval(parseInt(e.target.value) || 5)}
              disabled={isPublishing}
            />
          </div>
          
          <Button 
            className={`flex-grow ${isPublishing ? 'bg-red-500 hover:bg-red-600' : ''}`}
            onClick={toggleAutoPublish}
            disabled={!connected}
          >
            {isPublishing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {isPublishing ? 'Stop Auto' : 'Start Auto'}
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
