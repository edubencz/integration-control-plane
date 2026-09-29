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

import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@wso2/oxygen-ui';
import { Send } from '@wso2/oxygen-ui-icons-react';
import { parseFormSchema, buildFormResult } from '../workflow/helpers';
import SchemaFormFields from '../workflow/SchemaFormFields';
import { SchemaDisclosure } from '../workflow/shared';
import { HTTP_METHOD_BADGE_COLORS, DEFAULT_METHOD_BADGE_COLOR, METHOD_BADGE_TEXT_SX } from '../../constants/methodBadgeStyles';
import type { McpTool } from './useMcpSession';

interface McpToolCallFormProps {
  tool: McpTool;
  onCall: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
}

// Tools generated from a REST resource follow a "GET_"/"POST_"/... name prefix (confirmed
// against a live MI MCP server) — reusing the app-wide HTTP method badge palette here (the same
// one ArtifactTabs' resource rows and the Swagger UI overrides use) makes a tool backed by, say,
// a GET resource read the same way here as it does everywhere else a method shows up.
function detectHttpMethod(toolName: string): string | null {
  const match = toolName.match(/^(GET|POST|PUT|DELETE|PATCH)_/i);
  return match ? match[1].toUpperCase() : null;
}

export function McpToolCallForm({ tool, onCall }: McpToolCallFormProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [callError, setCallError] = useState<string>('');
  // Remounts the result's SchemaDisclosure on every call (see its `key` below) so a fresh result
  // always opens expanded — even if the user had manually collapsed a previous call's result,
  // which a plain `defaultOpen` alone wouldn't re-trigger since the element itself doesn't unmount.
  const [callCount, setCallCount] = useState(0);

  const fields = parseFormSchema(tool.inputSchema) ?? [];
  const httpMethod = detectHttpMethod(tool.name);
  const methodBadgeColor = httpMethod ? (HTTP_METHOD_BADGE_COLORS[httpMethod] ?? DEFAULT_METHOD_BADGE_COLOR) : null;

  const handleCall = async () => {
    try {
      setLoading(true);
      setCallError('');
      setResult(null);

      const { result: args, errors } = buildFormResult(fields, values);

      if (Object.keys(errors).length > 0) {
        setCallError(`Validation errors: ${Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join('; ')}`);
        return;
      }

      const response = await onCall(tool.name, args);
      setResult(response);
      setCallCount((n) => n + 1);
    } catch (err) {
      setCallError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'action.hover', p: 2.5, borderRadius: 1 }}>
      <Stack gap={2}>
        {/* Tool identity */}
        <Stack direction="row" alignItems="center" gap={1.5}>
          {httpMethod && <Box sx={{ ...METHOD_BADGE_TEXT_SX, bgcolor: methodBadgeColor, color: '#fff', px: 1, py: 0.5, flexShrink: 0 }}>{httpMethod}</Box>}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
            {tool.name}
          </Typography>
        </Stack>

        {/* Tool description */}
        {tool.description && (
          <Typography variant="body2" color="text.secondary">
            {tool.description}
          </Typography>
        )}

        {/* Input schema disclosure if unparseable */}
        {tool.inputSchema && !fields.length && (
          <SchemaDisclosure schema={JSON.stringify(tool.inputSchema, null, 2)} label="Input Schema (Advanced)" />
        )}

        {/* Form fields */}
        {fields.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: 10, fontWeight: 600, display: 'block', mb: 1 }}>
              Arguments
            </Typography>
            <SchemaFormFields
              fields={fields}
              values={values}
              errors={{}}
              onChange={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
            />
          </Box>
        )}

        {/* Call button */}
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
            onClick={handleCall}
            disabled={loading}
          >
            Call Tool
          </Button>
        </Stack>

        {/* Error */}
        {callError && <Alert severity="error">{callError}</Alert>}

        {/* Result — expanded by default so it's visible right after the call, no click needed */}
        {result !== null && (
          <SchemaDisclosure key={callCount} schema={JSON.stringify(result, null, 2)} label="Result" defaultOpen />
        )}
      </Stack>
    </Box>
  );
}
