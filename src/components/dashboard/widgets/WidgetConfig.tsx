
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
        description: "Please select a topic for your widget",
        variant: "destructive",
      });
      return;
    }
    
    // Set custom parser if provided
    if (parserFunction.trim()) {
      try {
        // Create a parser function from the string input
        // eslint-disable-next-line no-new-func
        const parser = new Function('payload', `try { ${parserFunction} } catch(e) { console.error(e); return null; }`);
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
    
    // Create widget configuration
    const widget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: widgetTitle,
      topic: widgetTopic,
      valuePath: valuePath || undefined,
      unit: unit || undefined,
    };
    
    // Call the onAddWidget callback if provided
    if (onAddWidget) {
      onAddWidget(widget);
      
      // Reset form
      setWidgetTitle('');
      setValuePath('');
      setUnit('');
      
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
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {availableTopics.length > 0 ? (
                availableTopics.map(topic => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No topics available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
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
