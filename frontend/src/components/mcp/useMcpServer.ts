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

// Shared "is this inbound an MCP server" detection, used both by McpToolsPanel (to decide whether
// to render the tools list) and by EntryPointDetail's overview (to relabel the empty Protocol
// field). The backend's InboundEndpoint.protocol comes back empty for MCP inbounds in practice, so
// detection is driven entirely by a matching `*-mcp-config` LocalEntry rather than the protocol
// value — see findMcpConfigEntry in parseMcpTools.ts.

import { useMemo } from 'react';
import { useArtifacts, type GqlArtifact } from '../../api/queries';
import { findMcpConfigEntry } from './parseMcpTools';

// Stable empty array so useArtifacts' `data` fallback doesn't change identity every render (see the
// identical concern noted next to EntryPoints.tsx's EMPTY_ARTIFACTS).
const EMPTY_ARTIFACTS: GqlArtifact[] = [];

export interface McpConfigEntry {
  /** The matching `*-mcp-config` LocalEntry's name, or undefined when this inbound isn't an MCP server. */
  entryName: string | undefined;
  isMcp: boolean;
  loading: boolean;
}

export function useMcpConfigEntry(inboundName: string, envId: string, componentId: string, enabled = true): McpConfigEntry {
  const { data: localEntries = EMPTY_ARTIFACTS, isLoading } = useArtifacts('LocalEntry', envId, componentId, { enabled });
  const entryName = useMemo(
    () =>
      findMcpConfigEntry(
        localEntries.map((e) => e.name),
        inboundName,
      ),
    [localEntries, inboundName],
  );
  return { entryName, isMcp: !!entryName, loading: isLoading };
}
