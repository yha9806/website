/**
 * WebSocket连接和实时更新Hook
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { createLogger } from '../utils/logger';

const logger = createLogger('WebSocket');

export interface WebSocketMessage {
  type: 'welcome' | 'battle_update' | 'evaluation_progress' | 'chat' | 'heartbeat' | 'pong';
  data?: any;
  message?: string;
  timestamp?: string;
}

export interface BattleUpdateData {
  id: string;
  model1_votes: number;
  model2_votes: number;
  total_votes: number;
  timestamp: string;
}

export interface EvaluationProgressData {
  id: string;
  progress: number;
  status: string;
  current_stage?: string;
  timestamp: string;
}

interface UseWebSocketOptions {
  room: 'battle' | 'evaluation' | 'global';
  onMessage?: (message: WebSocketMessage) => void;
  onBattleUpdate?: (data: BattleUpdateData) => void;
  onEvaluationProgress?: (data: EvaluationProgressData) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    room,
    onMessage,
    onBattleUpdate,
    onEvaluationProgress,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [useSSE, setUseSSE] = useState(false); // 是否降级到SSE
  const [connectionDisabled, setConnectionDisabled] = useState(false); // 完全停止连接尝试
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionHealthRef = useRef<boolean>(false);
  
  // WebSocket URL - 生产环境强制使用正确URL，环境变量可能包含旧值
  const PRODUCTION_API_URL = 'https://wenxin-moyun-api-229980166599.asia-east1.run.app';
  const getWebSocketUrl = useCallback(() => {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    const apiBaseUrl = isProduction
      ? PRODUCTION_API_URL  // Always use correct production URL
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001');
    const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';
    
    // 将 http/https 转换为 ws/wss
    const wsUrl = apiBaseUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    
    return `${wsUrl}/api/${apiVersion}/ws/${room}`;
  }, [room]);

  // 发送心跳
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && connectionHealthRef.current) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
        logger.log('WebSocket heartbeat sent');
      } catch (error) {
        logger.error('Failed to send heartbeat:', error);
        connectionHealthRef.current = false;
      }
    }
  }, []);

  // 连接WebSocket
  const connect = useCallback(() => {
    // 如果连接已被完全禁用，直接返回
    if (connectionDisabled) {
      logger.log('WebSocket: Connection disabled, skipping connect attempt');
      return;
    }

    // 渐进式重连延迟：防止过于频繁的连接尝试
    const now = Date.now();
    const timeSinceLastAttempt = now - lastConnectionAttempt;
    const minDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // 指数退避，最大30秒

    if (timeSinceLastAttempt < minDelay) {
      logger.log(`WebSocket: waiting ${minDelay - timeSinceLastAttempt}ms before retry`);
      setTimeout(connect, minDelay - timeSinceLastAttempt);
      return;
    }

    try {
      const url = getWebSocketUrl();
      logger.log(`Connecting to WebSocket: ${url} (attempt ${reconnectAttempts + 1})`);
      
      setLastConnectionAttempt(now);
      connectionHealthRef.current = false;
      
      wsRef.current = new WebSocket(url);

      // 设置连接超时
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          logger.warn('WebSocket connection timeout');
          wsRef.current.close();
          setConnectionError('Connection timeout');
          
          // 达到最大重连次数后降级到SSE并完全禁用重连
          if (reconnectAttempts >= maxReconnectAttempts - 1) {
            logger.log('Max reconnect attempts reached, disabling WebSocket completely');
            setUseSSE(true);
            setConnectionDisabled(true);
          }
        }
      }, 10000); // 增加到10秒超时

      wsRef.current.onopen = () => {
        logger.log(`WebSocket connected to ${room} room`);
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        connectionHealthRef.current = true;
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        setUseSSE(false);
        
        // 开始心跳 - 更频繁的心跳保持连接
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, 15000); // 每15秒心跳
        
        // 立即发送一次心跳确认连接
        setTimeout(sendHeartbeat, 1000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.log('WebSocket message received:', message);
          
          // 调用通用消息处理器
          onMessage?.(message);
          
          // 根据消息类型调用特定处理器
          switch (message.type) {
            case 'battle_update':
              if (message.data && onBattleUpdate) {
                onBattleUpdate(message.data as BattleUpdateData);
              }
              break;
              
            case 'evaluation_progress':
              if (message.data && onEvaluationProgress) {
                onEvaluationProgress(message.data as EvaluationProgressData);
              }
              break;
              
            case 'pong':
              // 心跳响应，无需处理
              break;
              
            default:
              logger.log('Unhandled message type:', message.type);
          }
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        logger.log('WebSocket closed:', event.code, event.reason);
        connectionHealthRef.current = false;
        setIsConnected(false);
        
        // 清理心跳
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        // 只有在非正常关闭时才重连
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => prev + 1);
          setConnectionError(`Connection lost (${event.code}), retrying...`);
          
          // 使用渐进式延迟重连
          const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttempts), 30000);
          logger.log(`Will attempt to reconnect in ${delay}ms (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError('Connection failed after multiple attempts');
          setUseSSE(true); // 降级到SSE
          setConnectionDisabled(true); // 完全禁用重连
          logger.log('WebSocket: Max reconnect attempts reached, connection disabled');
        } else if (event.code === 1000) {
          setConnectionError(null); // 正常关闭，不显示错误
        }
      };

      wsRef.current.onerror = (error) => {
        logger.error('WebSocket error:', error);
        setConnectionError('WebSocket connection failed');
      };

    } catch (error) {
      logger.error('Error creating WebSocket connection:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown connection error');
    }
  }, [room, getWebSocketUrl, onMessage, onBattleUpdate, onEvaluationProgress, reconnectAttempts, maxReconnectAttempts, reconnectInterval, sendHeartbeat, connectionDisabled]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setReconnectAttempts(0);
    setConnectionError(null);
    setUseSSE(false);
    setConnectionDisabled(false); // 重置禁用状态，允许手动重连
  }, []);

  // 发送消息
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    logger.warn('WebSocket is not connected');
    return false;
  }, []);

  // 发送聊天消息
  const sendChatMessage = useCallback((message: string, user = 'Anonymous') => {
    return sendMessage({
      type: 'chat',
      message,
      user,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  // 发送投票消息（仅用于测试）
  const sendVoteMessage = useCallback((battleId: string, model: 'model1' | 'model2') => {
    return sendMessage({
      type: 'vote',
      battle_id: battleId,
      model,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  // 组件挂载时连接，卸载时断开
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    useSSE,
    connectionDisabled,
    sendMessage,
    sendChatMessage,
    sendVoteMessage,
    connect,
    disconnect
  };
}

/**
 * SSE (Server-Sent Events) Hook - WebSocket的降级方案
 */
export function useServerSentEvents(options: {
  room: 'battle' | 'evaluation' | 'global';
  onMessage?: (message: WebSocketMessage) => void;
  onBattleUpdate?: (data: BattleUpdateData) => void;
  onEvaluationProgress?: (data: EvaluationProgressData) => void;
}) {
  const { room, onMessage, onBattleUpdate, onEvaluationProgress } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    try {
      // 生产环境强制使用正确URL，环境变量可能包含旧值
      const PRODUCTION_API_URL = 'https://wenxin-moyun-api-229980166599.asia-east1.run.app';
      const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      const apiBaseUrl = isProduction
        ? PRODUCTION_API_URL  // Always use correct production URL
        : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001');
      const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';
      const url = `${apiBaseUrl}/api/${apiVersion}/sse/${room}`;
      logger.log(`Connecting to SSE: ${url}`);
      
      eventSourceRef.current = new EventSource(url);

      eventSourceRef.current.onopen = () => {
        logger.log(`SSE connected to ${room} room`);
        setIsConnected(true);
        setConnectionError(null);
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.log('SSE message received:', message);
          
          onMessage?.(message);
          
          switch (message.type) {
            case 'battle_update':
              if (message.data && onBattleUpdate) {
                onBattleUpdate(message.data as BattleUpdateData);
              }
              break;
              
            case 'evaluation_progress':
              if (message.data && onEvaluationProgress) {
                onEvaluationProgress(message.data as EvaluationProgressData);
              }
              break;
          }
        } catch (error) {
          logger.error('Error parsing SSE message:', error);
        }
      };

      eventSourceRef.current.onerror = () => {
        logger.error('SSE connection error');
        setIsConnected(false);
        setConnectionError('SSE connection failed');
      };

    } catch (error) {
      logger.error('Error creating SSE connection:', error);
      setConnectionError(error instanceof Error ? error.message : 'Unknown SSE error');
    }
  }, [room, onMessage, onBattleUpdate, onEvaluationProgress]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    disconnect
  };
}