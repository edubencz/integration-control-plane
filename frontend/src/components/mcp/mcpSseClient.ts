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

/**
 * Manual SSE (Server-Sent Events) client for MCP server connections.
 * Cannot use the native EventSource API because:
 * 1. EventSource does not support custom Authorization header
 * 2. MCP SSE streams are never-closing (keep-alive indefinitely)
 * 3. The proxy requires JWT authentication in the Authorization header
 *
 * This client uses fetch() + ReadableStream to implement SSE parsing
 * with full control over headers and lifecycle.
 */

export interface McpSseEvent {
  event: string;
  data: string;
}

export type McpSseEventHandler = (event: McpSseEvent) => void;

export async function openMcpSseStream(
  url: string,
  authorizationHeader: string,
  useHttps443: boolean,
  onEvent: McpSseEventHandler,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: authorizationHeader,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...(useHttps443 ? { 'X-MCP-Target-Port': '443' } : {}),
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('SSE response has no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split by double newline to identify complete events
      const parts = buffer.split('\n\n');

      // Keep the last incomplete part in the buffer
      buffer = parts[parts.length - 1];

      // Process all complete events
      for (let i = 0; i < parts.length - 1; i++) {
        const eventText = parts[i].trim();
        if (!eventText) continue;

        const event = parseSseEvent(eventText);
        if (event) {
          onEvent(event);
        }
      }
    }

    // Process any remaining buffered data
    if (buffer.trim()) {
      const event = parseSseEvent(buffer.trim());
      if (event) {
        onEvent(event);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseEvent(text: string): McpSseEvent | null {
  const lines = text.split('\n');
  let eventType = 'message';
  let data = '';

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.startsWith('event:')) {
      eventType = line.substring('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      data = line.substring('data:'.length).trim();
      // In SSE, multiple data lines are joined with \n, but for our use case
      // each event has only one data line
    }
  }

  return { event: eventType, data };
}
