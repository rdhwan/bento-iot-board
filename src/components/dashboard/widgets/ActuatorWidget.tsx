
import React, { useState, useEffect } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore } from '@/lib/mqtt';
import { Power, ExternalLink, Trash, ToggleLeft, ToggleRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ActuatorWidgetProps {
  id?: string;
  title: string;
  topic: string;
  type?: 'switch' | 'toggle' | 'button';
  pinMode?: 'digital' | 'pwm'; // PWM for analog output
  size?: "sm" | "md" | "lg";
  className?: string;
  showControls?: boolean;
  onRemove?: () => void;
  onViewDetail?: () => void;
  onStateChange?: (state: boolean | number) => void;
  initialState?: boolean | number;
}

export function ActuatorWidget({
  id,
  title = "GPIO Control",
  topic = "device/gpio",
  type = "switch",
  pinMode = "digital",
  size = "md",
  className,
  showControls = false,
  onRemove,
  onViewDetail,
  onStateChange,
  initialState = false,
}: ActuatorWidgetProps) {
  const { publish, connected, messages } = useMqttStore();
  const { toast } = useToast();
  
  // For digital pins (on/off)
  const [isActive, setIsActive] = useState<boolean>(
    typeof initialState === 'boolean' ? initialState : false
  );
  
  // For PWM pins (0-100%)
  const [pwmValue, setPwmValue] = useState<number>(
    typeof initialState === 'number' ? initialState : 0
  );
  
  // Listen for feedback on state changes from the device
  const feedbackTopic = `${topic}/feedback`;
  const feedbackMessage = messages[feedbackTopic];
  
  useEffect(() => {
    if (feedbackMessage) {
      try {
        const data = JSON.parse(feedbackMessage.payload);
        if (pinMode === 'digital' && typeof data.state === 'boolean') {
          setIsActive(data.state);
          if (onStateChange) onStateChange(data.state);
        } else if (pinMode === 'pwm' && typeof data.value === 'number') {
          setPwmValue(data.value);
          if (onStateChange) onStateChange(data.value);
        }
      } catch (error) {
        console.error('Error parsing feedback:', error);
      }
    }
  }, [feedbackMessage, pinMode, onStateChange]);

  // Handle toggle for digital actuators
  const handleToggle = (state: boolean) => {
    if (!connected) {
      toast({
        title: "Not Connected",
        description: "Please connect to MQTT broker first",
        variant: "destructive",
      });
      return;
    }

    setIsActive(state);
    
    const payload = JSON.stringify({
      state,
      timestamp: Date.now()
    });
    
    try {
      publish(topic, payload);
      toast({
        title: `GPIO ${state ? 'Activated' : 'Deactivated'}`,
        description: `Command sent to ${topic}`,
      });
      
      if (onStateChange) {
        onStateChange(state);
      }
    } catch (error) {
      toast({
        title: "Command Failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };
  
  // Handle PWM value changes
  const handlePwmChange = (value: number) => {
    if (!connected) {
      toast({
        title: "Not Connected",
        description: "Please connect to MQTT broker first",
        variant: "destructive",
      });
      return;
    }

    setPwmValue(value);
    
    const payload = JSON.stringify({
      value,
      timestamp: Date.now()
    });
    
    try {
      publish(topic, payload);
      toast({
        title: "PWM Updated",
        description: `Value ${value}% sent to ${topic}`,
      });
      
      if (onStateChange) {
        onStateChange(value);
      }
    } catch (error) {
      toast({
        title: "Command Failed",
        description: String(error),
        variant: "destructive",
      });
    }
  };
  
  const renderControl = () => {
    if (pinMode === 'digital') {
      switch (type) {
        case 'switch':
          return (
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isActive} 
                onCheckedChange={handleToggle}
                disabled={!connected}
              />
              <Label>{isActive ? 'ON' : 'OFF'}</Label>
            </div>
          );
          
        case 'toggle':
          return (
            <div className="flex justify-center">
              <Button
                variant="outline"
                className={`w-full h-16 text-lg ${isActive ? 'bg-green-100 border-green-500' : 'bg-gray-100'}`}
                onClick={() => handleToggle(!isActive)}
                disabled={!connected}
              >
                {isActive ? (
                  <ToggleRight className="mr-2 h-6 w-6 text-green-500" />
                ) : (
                  <ToggleLeft className="mr-2 h-6 w-6" />
                )}
                {isActive ? 'ON' : 'OFF'}
              </Button>
            </div>
          );
          
        case 'button':
          return (
            <div className="flex justify-center">
              <Button 
                variant="outline"
                size="lg"
                className="w-full h-16 text-lg"
                onClick={() => {
                  handleToggle(true);
                  // Auto revert after 500ms
                  setTimeout(() => handleToggle(false), 500);
                }}
                disabled={!connected || isActive}
              >
                <Power className={`mr-2 h-6 w-6 ${isActive ? 'text-green-500' : ''}`} />
                Press to Trigger
              </Button>
            </div>
          );
        
        default:
          return null;
      }
    } else if (pinMode === 'pwm') {
      // PWM control for analog output
      const pwmValues = [0, 25, 50, 75, 100];
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">PWM: {pwmValue}%</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePwmChange(0)}
              disabled={!connected}
            >
              Reset
            </Button>
          </div>
          
          <ToggleGroup 
            type="single" 
            value={String(pwmValue)} 
            onValueChange={(value) => value && handlePwmChange(Number(value))}
            className="justify-between w-full"
          >
            {pwmValues.map((value) => (
              <ToggleGroupItem 
                key={value} 
                value={String(value)} 
                disabled={!connected}
                className={cn(
                  "flex-1 text-center",
                  pwmValue === value && "bg-blue-100 text-blue-700"
                )}
              >
                {value}%
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      );
    }
    
    return null;
  };

  return (
    <BentoCard 
      title={title}
      size={size}
      icon={<Power className={`h-5 w-5 ${isActive && pinMode === 'digital' ? 'text-green-500' : ''}`} />}
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
      
      <div className="flex flex-col h-full pt-4">
        <div className="flex-grow flex items-center justify-center">
          {renderControl()}
        </div>
        
        <div className="text-xs text-gray-500 mt-4">
          Topic: {topic}
        </div>
      </div>
    </BentoCard>
  );
}
