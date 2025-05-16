
import React, { useState, useEffect } from 'react';
import { BentoGrid, BentoCard } from '@/components/dashboard/BentoGrid';
import { ConnectionWidget } from '@/components/dashboard/widgets/ConnectionWidget';
import { SubscriptionWidget } from '@/components/dashboard/widgets/SubscriptionWidget';
import { WidgetConfig } from '@/components/dashboard/widgets/WidgetConfig';
import { PublishWidget } from '@/components/dashboard/widgets/PublishWidget';
import { SensorWidget } from '@/components/dashboard/widgets/SensorWidget';
import { ChartWidget } from '@/components/dashboard/widgets/ChartWidget';
import { useMqttStore } from '@/lib/mqtt';
import { Button } from '@/components/ui/button';
import { Kanban } from 'lucide-react';

// Type definition for our dynamic widgets
interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  topic: string;
  valuePath?: string;
  unit?: string;
}

const Index = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const { connected } = useMqttStore();

  // Function to add a new widget
  const handleAddWidget = (widgetConfig: WidgetConfig) => {
    setWidgets([...widgets, widgetConfig]);
  };

  // Function to remove a widget
  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
  };

  // Render the appropriate widget based on its type
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'sensor':
        return (
          <SensorWidget
            key={widget.id}
            title={widget.title}
            topic={widget.topic}
            valuePath={widget.valuePath}
            unit={widget.unit}
            size="md"
          />
        );
      case 'chart':
        return (
          <ChartWidget
            key={widget.id}
            title={widget.title}
            topic={widget.topic}
            valuePath={widget.valuePath}
            unit={widget.unit}
            size="lg"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iot-soft-gray to-white dark:from-iot-dark dark:to-gray-900">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-between bg-white dark:bg-iot-dark shadow-sm">
        <div className="flex items-center space-x-3">
          <Kanban className="h-6 w-6 text-iot-blue" />
          <h1 className="text-xl font-bold">Bento IoT Dashboard</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-6">
        <BentoGrid>
          {/* Configuration Widgets */}
          <ConnectionWidget size="md" />
          <SubscriptionWidget size="md" />
          <WidgetConfig size="md" onAddWidget={handleAddWidget} />
          <PublishWidget size="md" />

          {/* User-added Widgets */}
          {widgets.map(renderWidget)}
        </BentoGrid>
      </div>
    </div>
  );
};

export default Index;
