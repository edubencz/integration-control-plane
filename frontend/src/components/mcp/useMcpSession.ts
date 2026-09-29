/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { mcpInboundRpcApiUrl, mcpInboundSseApiUrl } from '../../config/api';
import { getAccessToken } from '../../auth/tokenManager';
import { openMcpSseStream } from './mcpSseClient';

// Auth for this proxy is the ICP user's own JWT (validated by icp_server's JWT listener config),
// not the free-text "Auth Header" field on the HTTP tab (that one is forwarded to the target
// MI service being tested, a completely different credential).
function authorizationHeader(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated: no access token available');
  }
  return `Bearer ${token}`;
}

export type McpSessionState = 'idle' | 'connecting' | 'initializing' | 'ready' | 'error' | 'closed' | 'disconnected-after-ready';

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpRpcMessage {
  jsonrpc: string;
  id?: number | string;
  method?: string;
  result?: unknown;
  error?: { code: number; message: string };
  params?: Record<string, unknown>;
}

export interface McpSessionLog {
  timestamp: number;
  type: 'request' | 'response' | 'error' | 'info';
  message: string;
  details?: Record<string, unknown>;
}

interface McpSessionOptions {
  componentId: string;
  environmentId: string;
  runtimeId: string;
  inboundName: string;
  useHttps443?: boolean;
  connectionTimeoutMs?: number;
  staticTools?: McpTool[]; // Tools from LocalEntry XML, for detecting configuration issues
}

export function useMcpSession(options: McpSessionOptions) {
  const {
    componentId,
    environmentId,
    runtimeId,
    inboundName,
    useHttps443 = false,
    connectionTimeoutMs = 10000,
    staticTools = [],
  } = options;

  const [state, setState] = useState<McpSessionState>('idle');
  const [sessionId, setSessionId] = useState<string>('');
  const [tools, setTools] = useState<McpTool[]>([]);
  const [log, setLog] = useState<McpSessionLog[]>([]);
  const [error, setError] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const connectedRef = useRef(false);
  // rpcCall/connect need the session id synchronously, within the same connect() call that just
  // obtained it — setSessionId's state update isn't visible until the next render, so a rpcCall
  // invoked right after it would still see the stale (empty) `sessionId` from its own closure.
  // This ref is updated synchronously alongside the state (state stays purely for UI display).
  const sessionIdRef = useRef<string>('');
  // MI's MCP transport answers a POST with 202 Accepted and an empty body, delivering the actual
  // JSON-RPC response asynchronously as a plain SSE "message" event on the already-open stream,
  // correlated by id — not in the POST response itself. Pending calls are tracked here so the SSE
  // event handler (registered once per connect(), see below) can resolve/reject the right one.
  const pendingRequestsRef = useRef<Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>>(new Map());

  const updateSessionId = useCallback((id: string) => {
    sessionIdRef.current = id;
    setSessionId(id);
  }, []);

  // Add log entry
  const addLog = useCallback((type: McpSessionLog['type'], message: string, details?: Record<string, unknown>) => {
    setLog((prev) => [...prev, { timestamp: Date.now(), type, message, details }]);
  }, []);

  // Handles every SSE frame other than the initial "endpoint" one: MI multiplexes JSON-RPC
  // responses (and any server-initiated notifications) as plain-text JSON on this same stream.
  const handleSseMessage = useCallback(
    (data: string) => {
      let parsed: McpRpcMessage;
      try {
        parsed = JSON.parse(data);
      } catch {
        return; // Not JSON (e.g. a keep-alive comment/ping) — nothing to correlate.
      }

      const pending = typeof parsed.id === 'number' ? pendingRequestsRef.current.get(parsed.id) : undefined;
      if (!pending) {
        // Either a notification (no id) or a response to a call this session no longer tracks
        // (e.g. after a timeout already rejected it) — surface it for visibility only.
        addLog('info', 'Received via SSE', parsed as unknown as Record<string, unknown>);
        return;
      }

      pendingRequestsRef.current.delete(parsed.id as number);
      addLog('response', 'Received via SSE', parsed as unknown as Record<string, unknown>);
      if (parsed.error) {
        pending.reject(new Error(`RPC error: ${parsed.error.message}`));
      } else {
        pending.resolve(parsed.result);
      }
    },
    [addLog],
  );

  // Make JSON-RPC call via POST, awaiting the response either in the POST's own body (if the
  // target answers synchronously) or via a matching SSE "message" event (if it answers 202).
  const rpcCall = useCallback(
    async (method: string, params: Record<string, unknown> = {}): Promise<unknown> => {
      const activeSessionId = sessionIdRef.current;
      if (!activeSessionId) {
        throw new Error('Session not initialized');
      }

      const id = ++requestIdRef.current;
      const request: McpRpcMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      addLog('request', `${method}`, request as unknown as Record<string, unknown>);

      const url = mcpInboundRpcApiUrl(componentId, environmentId, runtimeId, inboundName, `?sessionId=${activeSessionId}`);

      // Registered before the POST is sent so a reply arriving on the SSE stream can never race
      // ahead of this call starting to listen for it.
      const viaSse = new Promise<unknown>((resolve, reject) => {
        pendingRequestsRef.current.set(id, { resolve, reject });
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authorizationHeader(),
            ...(useHttps443 ? { 'X-MCP-Target-Port': '443' } : {}),
          },
          body: JSON.stringify(request),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const bodyText = await response.text();
        if (bodyText.trim()) {
          pendingRequestsRef.current.delete(id);
          const result = JSON.parse(bodyText);
          addLog('response', `${method} completed`, result);
          if (result.error) {
            throw new Error(`RPC error: ${result.error.message}`);
          }
          return result.result;
        }

        // Empty body (202 Accepted) — wait for the correlated SSE message instead.
        let sseTimeout: ReturnType<typeof setTimeout> | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          sseTimeout = setTimeout(() => {
            pendingRequestsRef.current.delete(id);
            reject(new Error(`Timed out waiting for ${method} response on the SSE stream`));
          }, 15000);
        });
        try {
          return await Promise.race([viaSse, timeoutPromise]);
        } finally {
          if (sseTimeout) clearTimeout(sseTimeout);
        }
      } catch (err) {
        pendingRequestsRef.current.delete(id);
        const message = err instanceof Error ? err.message : String(err);
        addLog('error', `${method} failed`, { error: message });
        throw err;
      }
    },
    [componentId, environmentId, runtimeId, inboundName, useHttps443, addLog],
  );

  // Connect to MCP server
  const connect = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    connectedRef.current = false;
    updateSessionId('');
    setTools([]);
    setLog([]);
    setError('');
    setState('connecting');
    addLog('info', 'Connecting to MCP server...');

    try {
      let connectionTimeout: NodeJS.Timeout | null = null;

      const timeoutPromise = new Promise<never>((_, reject) => {
        connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout: SSE endpoint not received'));
        }, connectionTimeoutMs);
      });

      const ssePromise = new Promise<string>((resolve, reject) => {
        const sseUrl = mcpInboundSseApiUrl(componentId, environmentId, runtimeId, inboundName);

        openMcpSseStream(
          sseUrl,
          authorizationHeader(),
          useHttps443,
          (event) => {
            if (event.event === 'endpoint') {
              const match = event.data.match(/sessionId=([a-f0-9-]+)/);
              if (match) {
                if (connectionTimeout) clearTimeout(connectionTimeout);
                addLog('info', 'Session ID received', { sessionId: match[1] });
                resolve(match[1]);
              }
              return;
            }
            // Every other frame on this same long-lived stream carries a JSON-RPC response
            // (or server-initiated notification) — see handleSseMessage's comment for why.
            handleSseMessage(event.data);
          },
          abortControllerRef.current?.signal as AbortSignal,
        ).catch(reject);
      });

      const id = await Promise.race([ssePromise, timeoutPromise]);
      updateSessionId(id);
      connectedRef.current = true;

      setState('initializing');
      addLog('info', 'Handshaking MCP session...');

      // Step 1: initialize
      await rpcCall('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'integration-control-plane', version: '1.0.0' },
      });
      addLog('info', 'MCP initialize completed');

      // Step 2: notifications/initialized
      const initNotifyRequest: McpRpcMessage = {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      };
      const url = mcpInboundRpcApiUrl(componentId, environmentId, runtimeId, inboundName, `?sessionId=${id}`);
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorizationHeader(),
          ...(useHttps443 ? { 'X-MCP-Target-Port': '443' } : {}),
        },
        body: JSON.stringify(initNotifyRequest),
        signal: abortControllerRef.current?.signal,
      });
      addLog('info', 'MCP notifications/initialized sent');

      // Step 3: tools/list
      setState('ready');
      const toolsList = (await rpcCall('tools/list', {})) as unknown as Record<string, unknown>;
      const toolsArray = (Array.isArray(toolsList?.tools) ? toolsList.tools : []) as McpTool[];

      // Detect the bug: tools/list is empty but LocalEntry has tools
      if (toolsArray.length === 0 && staticTools.length > 0) {
        addLog('error', 'MCP tools list is empty but configuration declares tools', {
          suggestion: 'Check that mcp.tools.localentry parameter in MCP-server.xml uses the fully-qualified key (groupId__artifactId__version__name), not just the base name.',
          configuredTools: staticTools.length,
        });
      }

      setTools(toolsArray);
      addLog('info', `Loaded ${toolsArray.length} tools from MCP server`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState('error');
      setError(message);
      addLog('error', 'Connection failed', { error: message });
    }
  }, [componentId, environmentId, runtimeId, inboundName, useHttps443, connectionTimeoutMs, addLog, rpcCall, staticTools, updateSessionId, handleSseMessage]);

  // Call a tool
  const callTool = useCallback(
    async (toolName: string, args: Record<string, unknown>) => {
      if (state !== 'ready' && state !== 'disconnected-after-ready') {
        throw new Error(`Cannot call tool in state '${state}'`);
      }

      try {
        addLog('info', `Calling tool: ${toolName}`, args);
        const result = await rpcCall('tools/call', {
          name: toolName,
          arguments: args,
        });
        addLog('info', `Tool '${toolName}' completed successfully`, (typeof result === 'object' && result !== null ? result as Record<string, unknown> : undefined));
        return result;
      } catch (err) {
        if (state === 'ready') {
          setState('disconnected-after-ready');
        }
        throw err;
      }
    },
    [state, rpcCall, addLog],
  );

  // Disconnect
  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    connectedRef.current = false;
    updateSessionId('');
    setTools([]);
    setState('idle');
    for (const pending of pendingRequestsRef.current.values()) {
      pending.reject(new Error('MCP session disconnected'));
    }
    pendingRequestsRef.current.clear();
    addLog('info', 'Disconnected');
  }, [addLog, updateSessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current && connectedRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    state,
    sessionId,
    tools,
    log,
    error,
    connect,
    callTool,
    disconnect,
    addLog,
  };
}
