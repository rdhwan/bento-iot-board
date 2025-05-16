
import React, { useState } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore } from '@/lib/mqtt';
import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ConnectionWidgetProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ConnectionWidget({ size = "md", className }: ConnectionWidgetProps) {
  const { connected, connect, disconnect } = useMqttStore();
  const { toast } = useToast();
  
  const [broker, setBroker] = useState('wss://broker.shiftr.io');
  const [clientId, setClientId] = useState(`iot-dashboard-${Math.random().toString(16).slice(2, 10)}`);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleConnect = () => {
    if (!broker) {
      toast({
        title: "Error",
        description: "Please enter a broker URL",
        variant: "destructive",
      });
      return;
    }
    
    try {
      connect(broker, {
        clientId,
        username: username || undefined,
        password: password || undefined,
      });
      
      toast({
        title: "Connecting",
        description: `Attempting to connect to ${broker}...`
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };
  
  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Disconnected",
      description: "MQTT connection closed",
    });
  };
  
  return (
    <BentoCard
      title="MQTT Connection"
      size={size}
      icon={<Database className="h-5 w-5" />}
      className={className}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="broker">Broker URL</Label>
          <Input 
            id="broker" 
            placeholder="wss://broker.shiftr.io" 
            value={broker}
            onChange={(e) => setBroker(e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="clientId">Client ID</Label>
          <Input 
            id="clientId" 
            placeholder="iot-dashboard-client" 
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        
        <Button 
          className={cn(
            "w-full mt-2",
            connected ? "bg-red-500 hover:bg-red-600" : "bg-iot-blue hover:bg-blue-600"
          )}
          onClick={connected ? handleDisconnect : handleConnect}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", connected && "animate-spin")} />
          {connected ? "Disconnect" : "Connect"}
        </Button>
        
        <div className={cn(
          "text-xs text-center mt-1",
          connected ? "text-green-500" : "text-gray-500"
        )}>
          Status: {connected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </BentoCard>
  );
}
