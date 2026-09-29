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

import { useEffect, useMemo, useState } from 'react';
import {
  alpha,
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@wso2/oxygen-ui';
import { AlertCircle, Plug, PlugZap, Wrench } from '@wso2/oxygen-ui-icons-react';
import { useArtifactSource, useArtifacts, useLocalEntryValue, type GqlArtifact } from '../../api/queries';
import EmptyListing from '../EmptyListing';
import { findMcpConfigEntry, parseInboundNetworkConfig } from './parseMcpTools';
import { useMcpSession, type McpSessionState } from './useMcpSession';
import { McpToolCallForm } from './McpToolCallForm';
import { McpSessionLog } from './McpSessionLog';

// Stable empty array so useArtifacts' `data` fallback doesn't change identity every render.
const EMPTY_ARTIFACTS: GqlArtifact[] = [];

interface McpTesterPanelProps {
  componentId: string;
  environmentId: string;
}

export function McpTesterPanel({ componentId, environmentId }: McpTesterPanelProps) {
  const theme = useTheme();
  const { data: inboundEndpoints = EMPTY_ARTIFACTS, isLoading: loadingInbounds } = useArtifacts(
    'InboundEndpoint',
    environmentId,
    componentId,
  );
  const { data: localEntries = EMPTY_ARTIFACTS, isLoading: loadingLocalEntries } = useArtifacts(
    'LocalEntry',
    environmentId,
    componentId,
  );
  const localEntryNames = useMemo(() => localEntries.map((e) => e.name), [localEntries]);

  // Filter to only MCP servers — findMcpConfigEntry is a pure function, so it's safe to call per
  // inbound here (unlike a hook, which cannot be called inside a loop/callback).
  const mcpServers = useMemo(
    () => inboundEndpoints.filter((ib) => !!findMcpConfigEntry(localEntryNames, ib.name?.toString() ?? '')),
    [inboundEndpoints, localEntryNames],
  );

  const [selectedInboundName, setSelectedInboundName] = useState<string>('');

  useEffect(() => {
    if (!selectedInboundName && mcpServers.length > 0) {
      setSelectedInboundName(mcpServers[0].name?.toString() ?? '');
    }
  }, [mcpServers, selectedInboundName]);

  const selectedInbound = mcpServers.find((s) => s.name === selectedInboundName);
  const runtimeId = (selectedInbound?.runtimes as Array<{ runtimeId: string; status: string }> | undefined)?.[0]?.runtimeId ?? '';
  const isRunning = (selectedInbound?.runtimes as Array<{ runtimeId: string; status: string }> | undefined)?.[0]?.status === 'RUNNING';
  const { data: inboundSource } = useArtifactSource(environmentId, componentId, 'inbound-endpoint', selectedInboundName);
  const inboundPort = useMemo(() => (inboundSource ? parseInboundNetworkConfig(inboundSource)?.port : undefined), [inboundSource]);
  const [useHttps443, setUseHttps443] = useState(false);

  // Get static tools from LocalEntry for detecting config issues
  const mcpConfigEntryName = useMemo(
    () => findMcpConfigEntry(localEntryNames, selectedInboundName),
    [localEntryNames, selectedInboundName],
  );
  const { data: mcpConfigXml } = useLocalEntryValue(componentId, mcpConfigEntryName ?? '', environmentId);
  const staticTools = useMemo(() => {
    if (!mcpConfigXml) return [];
    try {
      const doc = new DOMParser().parseFromString(mcpConfigXml, 'text/xml');
      return Array.from(doc.getElementsByTagName('tool')).map((el) => ({
        name: el.getAttribute('name') ?? '',
      }));
    } catch {
      return [];
    }
  }, [mcpConfigXml]);

  // Session management
  const session = useMcpSession({
    componentId,
    environmentId,
    runtimeId,
    inboundName: selectedInboundName,
    useHttps443,
    staticTools,
  });

  const [selectedToolName, setSelectedToolName] = useState<string>('');

  useEffect(() => {
    if (!selectedToolName && session.tools.length > 0) {
      setSelectedToolName(session.tools[0].name);
    }
  }, [session.tools, selectedToolName]);

  const selectedTool = session.tools.find((t) => t.name === selectedToolName);
  const isReady = session.state === 'ready' || session.state === 'disconnected-after-ready';

  // Drives both the status dot/border and its soft background tint — a single source of truth
  // so the "glow" and the panel border always agree with each other.
  const STATE_COLOR: Record<McpSessionState, string> = {
    idle: theme.palette.text.disabled,
    connecting: theme.palette.info.main,
    initializing: theme.palette.info.main,
    ready: theme.palette.success.main,
    'disconnected-after-ready': theme.palette.success.main,
    error: theme.palette.error.main,
    closed: theme.palette.text.disabled,
  };
  const stateColor = STATE_COLOR[session.state];

  if (loadingInbounds || loadingLocalEntries) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (mcpServers.length === 0) {
    return (
      <EmptyListing
        icon={<PlugZap size={48} />}
        title="No MCP servers found"
        description="This environment has no Inbound Endpoint configured as an MCP server yet."
      />
    );
  }

  return (
    <Stack direction="column" gap={2.5} sx={{ maxWidth: 900 }}>
      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <PlugZap size={20} aria-hidden="true" />
            MCP Connection
          </Typography>

          {/* Inbound Selector */}
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 500, color: 'text.secondary' }}>
              MCP Server
            </Typography>
            <Autocomplete
              size="small"
              sx={{ minWidth: 320 }}
              options={mcpServers}
              getOptionLabel={(ib) => ib.name?.toString() ?? ''}
              value={selectedInbound ?? null}
              isOptionEqualToValue={(a, b) => a.name === b.name}
              onChange={(_, v) => {
                setSelectedInboundName(v?.name?.toString() ?? '');
                setSelectedToolName('');
                session.disconnect();
              }}
              renderInput={(params) => <TextField {...params} placeholder="Select MCP server" />}
            />
          </Stack>

          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 500, color: 'text.secondary' }}>
              Request port
            </Typography>
            <RadioGroup row value={useHttps443 ? '443' : 'artifact'} onChange={(_, value) => {
              const nextUseHttps443 = value === '443';
              if (nextUseHttps443 !== useHttps443) {
                session.disconnect();
                setSelectedToolName('');
                setUseHttps443(nextUseHttps443);
              }
            }}>
              <FormControlLabel value="artifact" control={<Radio size="small" />} label={inboundPort ? `Artifact port (${inboundPort})` : 'Artifact port'} />
              <FormControlLabel value="443" control={<Radio size="small" />} label="HTTPS/443" />
            </RadioGroup>
          </Stack>

          {!isRunning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Selected MCP server is not running. Start the runtime to test.
            </Alert>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Connection status bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              p: 1.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: alpha(stateColor, 0.4),
              bgcolor: alpha(stateColor, 0.06),
            }}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: stateColor,
                  boxShadow: isReady ? `0 0 0 4px ${alpha(stateColor, 0.25)}` : 'none',
                  transition: 'box-shadow 0.3s ease',
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {session.state.replace(/-/g, ' ')}
              </Typography>
              {session.sessionId && (
                <Chip
                  label={session.sessionId}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontSize: 11, height: 22 }}
                />
              )}
            </Stack>

            <Stack direction="row" alignItems="center" gap={1}>
              {session.state === 'idle' && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Plug size={16} />}
                  onClick={() => session.connect()}
                  disabled={!isRunning}
                >
                  Connect
                </Button>
              )}

              {isReady && (
                <Button variant="outlined" size="small" onClick={() => session.disconnect()}>
                  Disconnect
                </Button>
              )}

              {session.state === 'error' && (
                <Button variant="contained" size="small" onClick={() => session.connect()} disabled={!isRunning}>
                  Reconnect
                </Button>
              )}

              {(session.state === 'connecting' || session.state === 'initializing') && <CircularProgress size={20} />}
            </Stack>
          </Box>

          {session.error && (
            <Alert severity="error" sx={{ mt: 2 }} icon={<AlertCircle size={20} />}>
              {session.error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tool call */}
      {isReady && (
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <Wrench size={20} aria-hidden="true" />
              Call a Tool
            </Typography>

            <Stack direction="row" alignItems="center" gap={2} sx={{ mb: session.tools.length > 0 ? 2.5 : 0 }}>
              <Typography variant="body2" sx={{ minWidth: 120, fontWeight: 500, color: 'text.secondary' }}>
                Tool
              </Typography>
              {session.tools.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tools available
                </Typography>
              ) : (
                <Autocomplete
                  size="small"
                  sx={{ minWidth: 320 }}
                  options={session.tools}
                  getOptionLabel={(t) => t.name}
                  value={selectedTool ?? null}
                  isOptionEqualToValue={(a, b) => a.name === b.name}
                  onChange={(_, v) => setSelectedToolName(v?.name ?? '')}
                  renderInput={(params) => <TextField {...params} placeholder="Select tool" />}
                />
              )}
            </Stack>

            {selectedTool && <McpToolCallForm tool={selectedTool} onCall={session.callTool} />}
          </CardContent>
        </Card>
      )}

      {/* Session Log */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <McpSessionLog log={session.log} />
        </CardContent>
      </Card>
    </Stack>
  );
}
