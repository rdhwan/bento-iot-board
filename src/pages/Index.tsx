
import React, { useState, useEffect } from 'react';
import { BentoGrid, BentoCard } from '@/components/dashboard/BentoGrid';
import { ConnectionWidget } from '@/components/dashboard/widgets/ConnectionWidget';
import { SubscriptionWidget } from '@/components/dashboard/widgets/SubscriptionWidget';
import { WidgetConfig } from '@/components/dashboard/widgets/WidgetConfig';
import { PublishWidget } from '@/components/dashboard/widgets/PublishWidget';
import { SensorWidget } from '@/components/dashboard/widgets/SensorWidget';
import { ChartWidget } from '@/components/dashboard/widgets/ChartWidget';
import { ActuatorWidget } from '@/components/dashboard/widgets/ActuatorWidget';
import { useMqttStore } from '@/lib/mqtt';
import { Button } from '@/components/ui/button';
import { Kanban, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useNavigate } from 'react-router-dom';

// Type definition for our dynamic widgets
interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  topic: string;
  valuePath?: string;
  unit?: string;
  actuatorType?: 'switch' | 'toggle' | 'button';
  pinMode?: 'digital' | 'pwm';
}

const Index = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const { connected } = useMqttStore();
  const navigate = useNavigate();

  // Load widgets from localStorage on component mount
  useEffect(() => {
    const savedWidgets = localStorage.getItem('iot-dashboard-widgets');
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    }
  }, []);

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('iot-dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  // Function to add a new widget
  const handleAddWidget = (widgetConfig: WidgetConfig) => {
    setWidgets([...widgets, widgetConfig]);
    toast.success(`Added ${widgetConfig.title} widget`);
  };

  // Function to remove a widget
  const handleRemoveWidget = (id: string) => {
    const widgetToRemove = widgets.find(w => w.id === id);
    if (widgetToRemove) {
      setWidgets(widgets.filter(widget => widget.id !== id));
      toast.success(`Removed ${widgetToRemove.title} widget`);
    }
  };

  // Function to navigate to sensor detail page
  const handleViewSensorDetail = (widget: WidgetConfig) => {
    navigate(`/sensor/${widget.id}`, { state: { widget } });
  };

  // Render the appropriate widget based on its type
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'sensor':
        return (
          <SensorWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            topic={widget.topic}
            valuePath={widget.valuePath}
            unit={widget.unit}
            size="md"
            onRemove={() => handleRemoveWidget(widget.id)}
            onViewDetail={() => handleViewSensorDetail(widget)}
            showControls={true}
          />
        );
      case 'chart':
        return (
          <ChartWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            topic={widget.topic}
            valuePath={widget.valuePath}
            unit={widget.unit}
            size="lg"
            onRemove={() => handleRemoveWidget(widget.id)}
            onViewDetail={() => handleViewSensorDetail(widget)}
            showControls={true}
          />
        );
      case 'actuator':
        return (
          <ActuatorWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            topic={widget.topic}
            type={widget.actuatorType}
            pinMode={widget.pinMode}
            size="md"
            onRemove={() => handleRemoveWidget(widget.id)}
            onViewDetail={() => handleViewSensorDetail(widget)}
            showControls={true}
          />
        );
      default:
        return null;
    }
  };

  // Group widgets by type for better organization
  const sensorWidgets = widgets.filter(widget => widget.type === 'sensor' || widget.type === 'chart');
  const actuatorWidgets = widgets.filter(widget => widget.type === 'actuator');

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

      {/* Breadcrumb */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6">
        {/* Configuration Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <BentoGrid>
            <ConnectionWidget size="md" />
            <SubscriptionWidget size="md" />
            <WidgetConfig size="md" onAddWidget={handleAddWidget} />
            <PublishWidget size="md" />
          </BentoGrid>
        </div>
        
        <Separator className="my-6" />
        
        {/* Sensor Readings Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Sensor Readings</h2>
          {sensorWidgets.length === 0 ? (
            <div className="bg-white dark:bg-iot-dark p-8 rounded-lg text-center">
              <p className="text-gray-500">No sensors configured yet. Use the configuration section to add sensors.</p>
            </div>
          ) : (
            <BentoGrid>
              {sensorWidgets.map(renderWidget)}
            </BentoGrid>
          )}
        </div>

        <Separator className="my-6" />
        
        {/* Actuators Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Actuators & Controls</h2>
          {actuatorWidgets.length === 0 ? (
            <div className="bg-white dark:bg-iot-dark p-8 rounded-lg text-center">
              <p className="text-gray-500">No actuators configured yet. Use the configuration section to add actuators.</p>
            </div>
          ) : (
            <BentoGrid>
              {actuatorWidgets.map(renderWidget)}
            </BentoGrid>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
