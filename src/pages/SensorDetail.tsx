import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMqttStore, extractValue } from '@/lib/mqtt';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowLeft, Clock, Save, Trash } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface HistoryDataPoint {
  timestamp: string;
  value: number;
}

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  topic: string;
  valuePath?: string;
  unit?: string;
}

const MAX_HISTORY_POINTS = 100;

const SensorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const widget = location.state?.widget as WidgetConfig;
  const { messages } = useMqttStore();
  
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Redirect if no widget data
  useEffect(() => {
    if (!widget) {
      navigate('/');
    }
  }, [widget, navigate]);

  // Process incoming messages
  useEffect(() => {
    if (!widget) return;
    
    const message = messages[widget.topic];
    if (message) {
      const value = extractValue(message, widget.valuePath);
      
      if (typeof value === 'number') {
        setCurrentValue(value);
        setLastUpdated(new Date(message.timestamp || Date.now()));
        
        // Add to history
        const timestamp = new Date(message.timestamp || Date.now()).toLocaleTimeString();
        setHistory(prev => {
          const newHistory = [...prev, { timestamp, value }];
          // Keep history length limited
          return newHistory.slice(-MAX_HISTORY_POINTS);
        });
      }
    }
  }, [messages, widget]);

  // Load previously stored history from localStorage
  useEffect(() => {
    if (!widget || !widget.id) return;
    
    const storedHistory = localStorage.getItem(`sensor-history-${widget.id}`);
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        setHistory(parsedHistory);
      } catch (e) {
        console.error('Failed to parse stored history', e);
      }
    }
  }, [widget]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!widget || !widget.id || history.length === 0) return;
    
    localStorage.setItem(`sensor-history-${widget.id}`, JSON.stringify(history));
  }, [history, widget]);

  if (!widget) {
    return <div className="p-8">Sensor not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iot-soft-gray to-white dark:from-iot-dark dark:to-gray-900 pb-8">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-between bg-white dark:bg-iot-dark shadow-sm">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href="/">Dashboard</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{widget.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sensor info card */}
          <div className="w-full md:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle>{widget.title}</CardTitle>
                <CardDescription>
                  Topic: {widget.topic}
                  {widget.valuePath && <> • Path: {widget.valuePath}</>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center p-4">
                  <span className="text-4xl font-bold">
                    {currentValue !== null ? currentValue.toFixed(1) : "—"}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    {widget.unit || ""}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historical data section */}
          <div className="w-full md:w-2/3">
            <Tabs defaultValue="chart">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="chart" className="flex-1">Chart View</TabsTrigger>
                <TabsTrigger value="table" className="flex-1">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="p-1 min-h-[400px]">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-[400px] p-4">
                      {history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={history}
                            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis 
                              dataKey="timestamp" 
                              tick={{ fontSize: 11 }}
                              stroke="#6B7280"
                              interval="preserveStartEnd"
                            />
                            <YAxis 
                              tick={{ fontSize: 11 }}
                              stroke="#6B7280"
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(26, 31, 44, 0.8)', 
                                border: 'none',
                                borderRadius: '4px',
                                color: '#FFFFFF'
                              }}
                              formatter={(value) => [`${value} ${widget.unit || ''}`, 'Value']}
                              labelFormatter={(label) => `Time: ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#1EAEDB" 
                              strokeWidth={2} 
                              dot={{ r: 2 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <span>No historical data available</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="table">
                <Card>
                  <CardHeader>
                    <CardTitle>Sensor History</CardTitle>
                    <CardDescription>
                      Most recent readings for {widget.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {history.length > 0 ? (
                      <div className="max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...history].reverse().map((record, idx) => (
                              <TableRow key={`${record.timestamp}-${idx}`}>
                                <TableCell>{record.timestamp}</TableCell>
                                <TableCell>{record.value.toFixed(2)} {widget.unit || ''}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-400">
                        No historical data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDetail;
