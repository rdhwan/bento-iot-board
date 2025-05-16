
import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { create } from 'zustand';

// Types for our MQTT store
export interface MqttMessage {
  topic: string;
  payload: string;
  timestamp: number;
  parsed?: any;
}

interface MqttState {
  client: MqttClient | null;
  connected: boolean;
  messages: Record<string, MqttMessage>;
  parserMap: Record<string, (payload: string) => any>;
  connect: (url: string, options?: IClientOptions) => void;
  disconnect: () => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  publish: (topic: string, message: string) => void;
  setParser: (topic: string, parser: (payload: string) => any) => void;
  clearMessages: () => void;
}

// Create a Zustand store for MQTT state management
export const useMqttStore = create<MqttState>((set, get) => ({
  client: null,
  connected: false,
  messages: {},
  parserMap: {},

  connect: (url, options = {}) => {
    // Disconnect if there's an existing connection
    if (get().client) {
      get().disconnect();
    }

    try {
      // Create new MQTT client
      const client = mqtt.connect(url, {
        ...options,
        reconnectPeriod: 1000,
      });

      // Set up event handlers
      client.on('connect', () => {
        console.log('MQTT Connected');
        set({ connected: true });
      });

      client.on('disconnect', () => {
        console.log('MQTT Disconnected');
        set({ connected: false });
      });

      client.on('error', (err) => {
        console.error('MQTT Error:', err);
      });

      client.on('message', (topic, payloadBuffer) => {
        const payload = payloadBuffer.toString();
        const timestamp = Date.now();
        const parserMap = get().parserMap;
        
        // Try to parse the payload using the custom parser for this topic if one exists
        let parsed = undefined;
        try {
          if (parserMap[topic]) {
            parsed = parserMap[topic](payload);
          } else {
            // Default: try to parse as JSON
            parsed = JSON.parse(payload);
          }
        } catch (e) {
          // If parsing fails, leave it as undefined
          console.log(`Failed to parse message on topic ${topic}:`, e);
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [topic]: {
              topic,
              payload,
              timestamp,
              parsed
            },
          },
        }));
      });

      // Set the client in state
      set({ client });
    } catch (error) {
      console.error('MQTT connection error:', error);
    }
  },

  disconnect: () => {
    const { client } = get();
    if (client) {
      client.end();
      set({ client: null, connected: false });
    }
  },

  subscribe: (topic) => {
    const { client } = get();
    if (client) {
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    }
  },

  unsubscribe: (topic) => {
    const { client } = get();
    if (client) {
      client.unsubscribe(topic);
    }
  },

  publish: (topic, message) => {
    const { client } = get();
    if (client) {
      client.publish(topic, message);
    }
  },

  setParser: (topic, parser) => {
    set((state) => ({
      parserMap: {
        ...state.parserMap,
        [topic]: parser,
      },
    }));
  },

  clearMessages: () => {
    set({ messages: {} });
  },
}));

// Utility functions to work with MQTT data
export function getLastMessageForTopic(topic: string): MqttMessage | null {
  const { messages } = useMqttStore.getState();
  return messages[topic] || null;
}

// Helper to extract a specific value from parsed payload
export function extractValue(
  message: MqttMessage | null,
  path: string | string[] | undefined = undefined
): any {
  if (!message || !message.parsed) return null;
  
  if (!path) return message.parsed;
  
  const pathArray = Array.isArray(path) ? path : path.split('.');
  let result = message.parsed;
  
  for (const key of pathArray) {
    if (result === undefined || result === null) return null;
    result = result[key];
  }
  
  return result;
}
