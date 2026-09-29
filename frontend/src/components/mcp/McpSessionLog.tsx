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

import { Box, Chip, Stack, Typography } from '@wso2/oxygen-ui';
import { Activity } from '@wso2/oxygen-ui-icons-react';
import { SchemaDisclosure } from '../workflow/shared';
import type { McpSessionLog as McpSessionLogType } from './useMcpSession';

interface McpSessionLogProps {
  log: McpSessionLogType[];
}

const CHIP_COLOR: Record<McpSessionLogType['type'], 'error' | 'info' | 'success' | 'default'> = {
  error: 'error',
  request: 'info',
  response: 'success',
  info: 'default',
};

// Border colors mirror CHIP_COLOR but as theme paths ('default' has no palette group of its own,
// unlike the Chip `color` prop, so it falls back to the neutral divider color instead).
const BORDER_COLOR: Record<McpSessionLogType['type'], string> = {
  error: 'error.main',
  request: 'info.main',
  response: 'success.main',
  info: 'divider',
};

export function McpSessionLog({ log }: McpSessionLogProps) {
  return (
    <Stack gap={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Activity size={20} aria-hidden="true" />
          Activity Log
        </Typography>
        {log.length > 0 && <Chip label={`${log.length} ${log.length === 1 ? 'entry' : 'entries'}`} size="small" variant="outlined" />}
      </Stack>

      {log.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No activity yet — connect to the MCP server to see requests and responses here.
        </Typography>
      ) : (
        <Box sx={{ maxHeight: 400, overflowY: 'auto', bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
          <Stack gap={1}>
            {log.map((entry, idx) => (
              <Box
                key={idx}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 0.5,
                  borderLeft: '3px solid',
                  borderColor: BORDER_COLOR[entry.type],
                  px: 1.5,
                  py: 1,
                }}
              >
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, fontFamily: 'monospace' }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Chip label={entry.type} size="small" color={CHIP_COLOR[entry.type]} variant="outlined" sx={{ height: 20 }} />
                </Stack>
                <Typography variant="body2" sx={{ mb: entry.details ? 0.5 : 0 }}>
                  {entry.message}
                </Typography>
                {entry.details && <SchemaDisclosure schema={JSON.stringify(entry.details, null, 2)} label="Details" />}
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
