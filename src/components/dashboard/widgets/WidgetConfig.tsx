
import React, { useState } from 'react';
import { BentoCard } from '../BentoGrid';
import { useMqttStore } from '@/lib/mqtt';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WidgetConfigProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  onAddWidget?: (widget: any) => void;
}

export function WidgetConfig({ size = "md", className, onAddWidget }: WidgetConfigProps) {
  const { toast } = useToast();
  const { messages, setParser } = useMqttStore();
  
  const [widgetType, setWidgetType] = useState('sensor');
  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetTopic, setWidgetTopic] = useState('');
  const [valuePath, setValuePath] = useState('');
  const [unit, setUnit] = useState('');
  const [parserFunction, setParserFunction] = useState('');
  
  // Actuator specific states
  const [actuatorType, setActuatorType] = useState('switch');
  const [pinMode, setPinMode] = useState('digital');
  
  const availableTopics = Object.keys(messages);
  
  const handleAddWidget = () => {
    if (!widgetTitle) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your widget",
        variant: "destructive",
      });
      return;
    }
    
    if (!widgetTopic) {
      toast({
        title: "Missing Topic",
        description: "Please select or enter a topic for your widget",
        variant: "destructive",
      });
      return;
    }
    
    // Set custom parser if provided
    if (parserFunction.trim() && (widgetType === 'sensor' || widgetType === 'chart')) {
      try {
        // Create a parser function from the string input with the correct type signature
        const parser = (payload: string): any => {
          try {
            // eslint-disable-next-line no-new-func
            return new Function('payload', `return (${parserFunction})`)(payload);
          } catch(e) {
            console.error('Parser error:', e);
            return null;
          }
        };
        
        setParser(widgetTopic, parser);
        
        toast({
          title: "Parser Set",
          description: `Custom parser set for ${widgetTopic}`,
        });
      } catch (e) {
        toast({
          title: "Parser Error",
          description: `Invalid parser function: ${String(e)}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Create widget configuration based on type
    let widget: any = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: widgetTitle,
      topic: widgetTopic,
    };
    
    if (widgetType === 'sensor' || widgetType === 'chart') {
      widget = {
        ...widget,
        valuePath: valuePath || undefined,
        unit: unit || undefined,
      };
    } else if (widgetType === 'actuator') {
      widget = {
        ...widget,
        actuatorType,
        pinMode,
      };
    }
    
    // Call the onAddWidget callback if provided
    if (onAddWidget) {
      onAddWidget(widget);
      
      // Reset form
      setWidgetTitle('');
      setWidgetTopic('');
      setValuePath('');
      setUnit('');
      setParserFunction('');
      
      toast({
        title: "Widget Added",
        description: `Added ${widgetType} widget for ${widgetTopic}`,
      });
    }
  };
  
  return (
    <BentoCard
      title="Configure Widget"
      size={size}
      icon={<Settings className="h-5 w-5" />}
      className={className}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="widgetType">Widget Type</Label>
          <Select 
            value={widgetType} 
            onValueChange={setWidgetType}
          >
            <SelectTrigger id="widgetType">
              <SelectValue placeholder="Select widget type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sensor">Sensor Value</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
              <SelectItem value="actuator">Actuator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="widgetTitle">Widget Title</Label>
          <Input 
            id="widgetTitle" 
            placeholder="Temperature" 
            value={widgetTitle}
            onChange={(e) => setWidgetTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="widgetTopic">MQTT Topic</Label>
          <Select 
            value={widgetTopic} 
            onValueChange={setWidgetTopic}
          >
            <SelectTrigger id="widgetTopic">
              <SelectValue placeholder="Select topic or enter new" />
            </SelectTrigger>
            <SelectContent>
              {availableTopics.length > 0 ? (
                availableTopics.map(topic => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))
              ) : (
                <SelectItem value="no-topics" disabled>No topics available</SelectItem>
              )}
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>
          
          {widgetTopic === 'custom' && (
            <Input 
              className="mt-2"
              placeholder="Enter custom topic" 
              onChange={(e) => setWidgetTopic(e.target.value === '' ? 'custom' : e.target.value)}
            />
          )}
        </div>
        
        {/* Conditional fields based on widget type */}
        {(widgetType === 'sensor' || widgetType === 'chart') && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="valuePath">Value Path</Label>
                <Input 
                  id="valuePath" 
                  placeholder="data.temp" 
                  value={valuePath}
                  onChange={(e) => setValuePath(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="unit">Unit</Label>
                <Input 
                  id="unit" 
                  placeholder="°C" 
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="parser">Custom Parser Function (JS)</Label>
              <Textarea 
                id="parser" 
                placeholder="return JSON.parse(payload).value;" 
                value={parserFunction}
                onChange={(e) => setParserFunction(e.target.value)}
                className="h-20 font-mono text-xs"
              />
              <p className="text-xs text-gray-500">Write JavaScript to parse the payload string</p>
            </div>
          </>
        )}
        
        {widgetType === 'actuator' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="actuatorType">Control Type</Label>
              <Select 
                value={actuatorType} 
                onValueChange={setActuatorType}
              >
                <SelectTrigger id="actuatorType">
                  <SelectValue placeholder="Select control type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="switch">Switch</SelectItem>
                  <SelectItem value="toggle">Toggle Button</SelectItem>
                  <SelectItem value="button">Momentary Button</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Switch: Toggle On/Off, Toggle: Large button, Button: Momentary pulse
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="pinMode">Pin Mode</Label>
              <Select 
                value={pinMode} 
                onValueChange={setPinMode}
              >
                <SelectTrigger id="pinMode">
                  <SelectValue placeholder="Select pin mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital (On/Off)</SelectItem>
                  <SelectItem value="pwm">PWM (0-100%)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Digital for binary control, PWM for variable output
              </p>
            </div>
          </div>
        )}
        
        <Button 
          className="w-full"
          onClick={handleAddWidget}
        >
          Add Widget
        </Button>
      </div>
    </BentoCard>
  );
}
