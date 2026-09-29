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

// Pure parser for an MCP server's tool list. MI exposes an MCP inbound's tools through a
// LocalEntry (named `<...>-mcp-config`) holding a Synapse `<mcptools>` XML document — not through
// the inbound's own XML. Kept free of React and I/O so it can be exercised directly, mirroring
// workflow/helpers.ts.

import { parseFormSchema, type FormField } from '../workflow/helpers';

/**
 * What a tool is backed by, driving the type symbol shown next to its name. `rest` covers the
 * `<api>/<resource>/<method>` tools seen so far; `sequence` covers a `<sequence>` reference (the
 * common WSO2 building block for non-REST logic); `unknown` is any other/unrecognized backing so a
 * new kind added on the MI side still renders (generically) instead of being dropped.
 */
export type McpToolKind = 'rest' | 'sequence' | 'unknown';

export interface McpTool {
  name: string;
  description?: string;
  kind: McpToolKind;
  api?: string;
  resource?: string;
  method?: string;
  sequence?: string;
  /** Parsed form fields for the tool's inputSchema; empty when the tool takes no parameters. */
  params: FormField[];
  /** Pretty-printed JSON of the parsed schema, or the raw text when it couldn't be parsed. */
  rawSchema?: string;
  /** True when the tool declared an inputSchema that couldn't be interpreted as an object schema. */
  schemaUnparsed: boolean;
}

/**
 * Finds the LocalEntry that holds a given inbound's MCP tool definitions. The real entry name is
 * `com.microintegrator.projects__<project>__<version>__<inbound>-mcp-config`, so the project/version
 * prefix isn't reconstructed here — candidates are matched by their `-mcp-config` suffix instead.
 *
 * Deliberately has no "only one candidate in the component" fallback: a component can hold several
 * inbounds side by side, only one of which is an MCP server, and guessing from a lone unrelated
 * candidate would wrongly attach that MCP server's tools to every other inbound.
 */
export function findMcpConfigEntry(localEntryNames: string[], inboundName: string): string | undefined {
  const normalizedInbound = inboundName.toLowerCase();
  return localEntryNames.find((name) => {
    const lower = name.toLowerCase();
    if (!lower.endsWith('-mcp-config')) return false;
    const withoutSuffix = lower.slice(0, lower.length - '-mcp-config'.length);
    return withoutSuffix === normalizedInbound || withoutSuffix.endsWith(`__${normalizedInbound}`);
  });
}

/** Reads the trimmed text of the first direct child with the given local name, ignoring namespace. */
function childText(element: Element, localName: string): string | undefined {
  const child = Array.from(element.children).find((c) => c.localName === localName);
  const text = child?.textContent?.trim();
  return text ? text : undefined;
}

function parseTool(element: Element): McpTool {
  const name = element.getAttribute('name') ?? '';
  const api = childText(element, 'api');
  const resource = childText(element, 'resource');
  const method = childText(element, 'method');
  const sequence = childText(element, 'sequence');
  const description = childText(element, 'description');
  const inputSchemaText = childText(element, 'inputSchema');
  const kind: McpToolKind = method ? 'rest' : sequence ? 'sequence' : 'unknown';
  const base = { name, description, kind, api, resource, method, sequence };

  if (!inputSchemaText) {
    return { ...base, params: [], schemaUnparsed: false };
  }

  try {
    const parsed: unknown = JSON.parse(inputSchemaText);
    const hasProperties = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && typeof (parsed as { properties?: unknown }).properties === 'object';
    if (!hasProperties) {
      return { ...base, params: [], rawSchema: inputSchemaText, schemaUnparsed: true };
    }
    const params = parseFormSchema(parsed) ?? [];
    return { ...base, params, rawSchema: JSON.stringify(parsed, null, 2), schemaUnparsed: false };
  } catch {
    return { ...base, params: [], rawSchema: inputSchemaText, schemaUnparsed: true };
  }
}

/** Parses a Synapse `<mcptools>` XML document into its tool list. Returns null when parsing fails. */
export function parseMcpTools(xml: string): McpTool[] | null {
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return null;
    if (doc.documentElement?.localName !== 'mcptools') return null;

    const tools = Array.from(doc.getElementsByTagName('*')).filter((el) => el.localName === 'tool');
    return tools.map(parseTool);
  } catch {
    return null;
  }
}

/** The network config an MCP inbound listens on, read from its own `<inboundEndpoint>` source XML. */
export interface McpInboundNetworkConfig {
  port?: string;
  context?: string;
}

/**
 * Parses an MCP inbound's own source XML for the listening port and context path. MI's GraphQL
 * InboundEndpoint type has no `url`/`context` fields at all (unlike RestApi, whose management API
 * reports a ready-made URL), so this reads the same `<parameter name="…">` entries the "View
 * Parameters" panel already fetches, straight from `<inboundEndpoint><parameters>`:
 *   <parameter name="inbound.http.port">8300</parameter>
 *   <parameter name="inbound.http.context">/mcp</parameter>
 * `inbound.mcp.port` (seen carrying the same value as `inbound.http.port`) is a fallback in case a
 * future MI build only sets one of the two. Returns null when parsing fails.
 */
export function parseInboundNetworkConfig(xml: string): McpInboundNetworkConfig | null {
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return null;

    const params = new Map<string, string>();
    Array.from(doc.getElementsByTagName('*'))
      .filter((el) => el.localName === 'parameter')
      .forEach((el) => {
        const name = el.getAttribute('name');
        const value = el.textContent?.trim();
        if (name && value) params.set(name, value);
      });

    const port = params.get('inbound.http.port') ?? params.get('inbound.mcp.port');
    const context = params.get('inbound.http.context');
    return { port, context };
  } catch {
    return null;
  }
}
