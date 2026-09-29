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

// Presents an MCP server's tools (name, description, backing API/resource, parameters) below the
// Inbound overview — the MCP-server equivalent of ArtifactApiDefinition's resource accordions for a
// RestApi. Tools aren't in the inbound's own XML; they live in a LocalEntry named `*-mcp-config`
// (see parseMcpTools.ts), so this component locates that entry itself and renders nothing when the
// selected inbound isn't an MCP server — callers don't need to branch on artifact type.

import { useMemo, type ReactNode } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, CircularProgress, ListingTable, Stack, Typography } from '@wso2/oxygen-ui';
import { ChevronDown, Workflow, Wrench } from '@wso2/oxygen-ui-icons-react';
import { useLocalEntryValue } from '../../api/queries';
import type { TabProps } from '../artifact-config';
import { fieldPath, type FormField } from '../workflow/helpers';
import { SchemaDisclosure } from '../workflow/shared';
import { parseMcpTools, type McpTool } from './parseMcpTools';
import { useMcpConfigEntry } from './useMcpServer';
import { HTTP_METHOD_BADGE_COLORS, DEFAULT_METHOD_BADGE_COLOR, METHOD_BADGE_TEXT_SX } from '../../constants/methodBadgeStyles';

const emptySx = { py: 4, textAlign: 'center', color: 'text.secondary' } as const;

const getMethodBadgeColor = (method?: string) => (method ? (HTTP_METHOD_BADGE_COLORS[method.toUpperCase()] ?? DEFAULT_METHOD_BADGE_COLOR) : undefined);

const methodBadgeSx = (method: string) => ({
  ...METHOD_BADGE_TEXT_SX,
  bgcolor: getMethodBadgeColor(method),
  color: '#fff',
  px: 1,
  py: 0.5,
  flexShrink: 0,
});

/**
 * The type symbol shown right after the tool's name: a colored HTTP-method pill for a REST-backed
 * tool (matching the API resource list's badges), or a neutral icon + label for anything else — a
 * Sequence reference, or a backing this UI doesn't yet recognize (`unknown`, so a new MI tool kind
 * still gets a symbol instead of nothing).
 */
// Fixed so every row's symbol lands in the same spot regardless of the tool name's length — the
// summary row is laid out as a grid (name | symbol | detail) rather than a flex row for this reason.
const TYPE_SYMBOL_WIDTH = 96;

function ToolTypeSymbol({ tool }: { tool: McpTool }) {
  if (tool.kind === 'rest' && tool.method) {
    return <Box sx={{ ...methodBadgeSx(tool.method), width: TYPE_SYMBOL_WIDTH, minWidth: 'auto' }}>{tool.method.toUpperCase()}</Box>;
  }
  const label = tool.kind === 'sequence' ? 'Sequence' : 'Tool';
  const Icon = tool.kind === 'sequence' ? Workflow : Wrench;
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap={0.5} sx={{ width: TYPE_SYMBOL_WIDTH, px: 1, py: 0.5, borderRadius: 0.5, bgcolor: 'action.selected', flexShrink: 0 }}>
      <Icon size={12} />
      <Typography sx={{ ...METHOD_BADGE_TEXT_SX, minWidth: 0, color: 'text.secondary' }}>{label}</Typography>
    </Stack>
  );
}

function DetailLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="row" gap={1} alignItems="baseline">
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 110 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
        {children}
      </Typography>
    </Stack>
  );
}

interface ParamRow {
  field: FormField;
  path: string;
  depth: number;
}

/** Flattens a (possibly nested) field list into display rows, indenting nested-group children. */
function flattenParams(fields: FormField[], prefix = '', depth = 0): ParamRow[] {
  return fields.flatMap((field) => {
    const path = fieldPath(prefix, field.name);
    const row: ParamRow = { field, path, depth };
    return field.fields ? [row, ...flattenParams(field.fields, path, depth + 1)] : [row];
  });
}

function ParametersTable({ tool }: { tool: McpTool }) {
  if (tool.params.length === 0 && !tool.schemaUnparsed) {
    return <Typography sx={emptySx}>This tool takes no parameters.</Typography>;
  }
  if (tool.schemaUnparsed) {
    return tool.rawSchema ? <SchemaDisclosure schema={tool.rawSchema} label="Input schema" /> : <Typography sx={emptySx}>Unable to read this tool's input schema.</Typography>;
  }

  const rows = flattenParams(tool.params);
  return (
    <ListingTable>
      <ListingTable.Head>
        <ListingTable.Row>
          <ListingTable.Cell>Name</ListingTable.Cell>
          <ListingTable.Cell>Type</ListingTable.Cell>
          <ListingTable.Cell>Required</ListingTable.Cell>
          <ListingTable.Cell>Description</ListingTable.Cell>
        </ListingTable.Row>
      </ListingTable.Head>
      <ListingTable.Body>
        {rows.map((row) => (
          <ListingTable.Row key={row.path}>
            <ListingTable.Cell>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', pl: row.depth * 2 }}>
                {row.field.name}
              </Typography>
            </ListingTable.Cell>
            <ListingTable.Cell>
              <Typography variant="body2" color="text.secondary">
                {row.field.type}
              </Typography>
            </ListingTable.Cell>
            <ListingTable.Cell>{row.field.required ? <Chip label="Required" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: 11 }} /> : null}</ListingTable.Cell>
            <ListingTable.Cell>
              <Typography variant="body2" color="text.secondary">
                {row.field.description ?? '—'}
              </Typography>
            </ListingTable.Cell>
          </ListingTable.Row>
        ))}
      </ListingTable.Body>
    </ListingTable>
  );
}

function ToolAccordion({ tool }: { tool: McpTool }) {
  // Trailing detail next to the type symbol — the API/path for a REST-backed tool, the sequence
  // name for a Sequence-backed one, nothing for a backing this UI doesn't recognize.
  const trailingDetail = tool.kind === 'rest' ? [tool.api, [tool.method, tool.resource].filter(Boolean).join(' ')].filter(Boolean).join(' · ') : tool.kind === 'sequence' ? tool.sequence : undefined;

  return (
    <Accordion disableGutters sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 0.5, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ChevronDown size={16} />} sx={{ minHeight: 42, px: 1, py: 0, '& .MuiAccordionSummary-content': { my: 0.75 } }}>
        {/* A grid, not a flex row, so the type symbol lines up in the same column across tools
            regardless of how long each one's name is — a ragged flex row is what made the list
            read as disorganized. */}
        <Box sx={{ display: 'grid', gridTemplateColumns: `${TYPE_SYMBOL_WIDTH}px minmax(140px, 320px) 1fr`, alignItems: 'center', columnGap: 1.5, width: '100%' }}>
          <ToolTypeSymbol tool={tool} />
          <Typography noWrap title={tool.name} sx={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>
            {tool.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ textAlign: 'right' }}>
            {trailingDetail ?? ''}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: 'background.paper', px: 1.5, py: 1.25 }}>
        <Stack gap={1.25}>
          {tool.description && <Typography variant="body2">{tool.description}</Typography>}
          {tool.kind === 'rest' && tool.api && (
            <DetailLine label="Backing API">
              {tool.api}
              {tool.method || tool.resource ? ` · ${[tool.method, tool.resource].filter(Boolean).join(' ')}` : ''}
            </DetailLine>
          )}
          {tool.kind === 'sequence' && tool.sequence && <DetailLine label="Backing sequence">{tool.sequence}</DetailLine>}
          <ParametersTable tool={tool} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export function McpToolsPanel({ artifact, envId, componentId }: TabProps) {
  const inboundName = artifact.name?.toString() ?? '';
  const { entryName, isMcp, loading: loadingEntries } = useMcpConfigEntry(inboundName, envId, componentId);

  const { data: xml, isLoading: loadingXml, error } = useLocalEntryValue(componentId, entryName ?? '', envId);
  const tools = useMemo(() => (xml ? parseMcpTools(xml) : null), [xml]);

  // Not an MCP inbound at all: render nothing, so a regular Inbound's panel (toggles, "View
  // Parameters", overview) is unaffected. isMcp is exactly "a matching LocalEntry was found", so
  // entryName is always set below this point.
  if (!isMcp) return null;

  const loading = loadingEntries || loadingXml;

  let body: ReactNode;
  if (loading) {
    body = <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', py: 4 }} />;
  } else if (error || !xml || tools === null) {
    body = <Typography sx={emptySx}>Unable to read the MCP tool definitions.</Typography>;
  } else if (tools.length === 0) {
    body = <Typography sx={emptySx}>This MCP server declares no tools.</Typography>;
  } else {
    body = (
      <Stack gap={0.75}>
        {tools.map((tool, i) => (
          <ToolAccordion key={`${tool.name}-${i}`} tool={tool} />
        ))}
      </Stack>
    );
  }

  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
      {/* The inbound's own name is already shown above (the Endpoint selector), so this section
          header only needs to say what the list below it is — with the source LocalEntry kept as
          a hover tooltip rather than a permanent line, since it's provenance detail, not something
          someone reads by default. */}
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }} title={entryName ? `from ${entryName}` : undefined}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Tools
        </Typography>
        {tools && tools.length > 0 && <Chip label={tools.length} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />}
      </Stack>
      {body}
    </Box>
  );
}
