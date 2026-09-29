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

import { Box, Button, Chip, ListItemButton, ListSubheader, Stack, Typography } from '@wso2/oxygen-ui';
import { useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent } from 'react';
import SearchField from './SearchField';
import VirtualList from './VirtualList';
import { ENTRY_POINT_CONFIG, ENTRY_POINT_GROUP_ORDER, type EntryPointOption } from './artifact-config';
import { EntryTypeChip } from './EntryTypeChip';

const ITEM_HEIGHT = 36;
const ITEM_HEIGHT_WITH_META = 52;
const HEADER_HEIGHT = 28;
const LIST_HEIGHT = 360;
// Below this many rows, render everything (no windowing) so the browser's own Ctrl+F still works
// on the list - the common case (most environments have a handful of entry points), where
// virtualizing buys nothing and only costs find-in-page.
const VIRTUALIZE_THRESHOLD = 60;

type Row = { kind: 'header'; type: string; count: number } | { kind: 'item'; option: EntryPointOption; matchedMeta: boolean };

function matchOption(option: EntryPointOption, query: string): { hit: boolean; matchedMeta: boolean } {
  if (!query) return { hit: true, matchedMeta: false };
  const q = query.toLowerCase();
  if (option.label.toLowerCase().includes(q)) return { hit: true, matchedMeta: false };
  if (option.meta?.toLowerCase().includes(q)) return { hit: true, matchedMeta: true };
  const cfg = ENTRY_POINT_CONFIG[option.type];
  if (cfg?.label.toLowerCase().includes(q)) return { hit: true, matchedMeta: false };
  return { hit: false, matchedMeta: false };
}

export default function EntryPointPicker({
  options,
  selectedKey,
  onSelect,
  label,
  showTypeFilter,
}: {
  options: EntryPointOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  label: string;
  showTypeFilter: boolean;
}): JSX.Element {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [onlyInactive, setOnlyInactive] = useState(false);
  // The index currently at the top of the scrolled viewport, reported by VirtualList only while
  // virtualized - used to fake a sticky group header (see the render below for why a real one breaks).
  const [topIndex, setTopIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of options) counts.set(o.type, (counts.get(o.type) ?? 0) + 1);
    return counts;
  }, [options]);

  const matched = useMemo(() => options.map((option) => ({ option, match: matchOption(option, debouncedQuery) })).filter(({ match }) => match.hit), [options, debouncedQuery]);

  const filtered = useMemo(
    () =>
      matched.filter(({ option }) => {
        if (typeFilter !== 'all' && option.type !== typeFilter) return false;
        if (onlyInactive && option.enabled !== false) return false;
        return true;
      }),
    [matched, typeFilter, onlyInactive],
  );

  const groupTypes = useMemo(() => ENTRY_POINT_GROUP_ORDER.filter((t) => typeCounts.has(t)), [typeCounts]);
  // A single visible group makes the header pure repetition of the type filter already selected.
  const showHeaders = showTypeFilter && groupTypes.length > 1 && typeFilter === 'all';

  const rows: Row[] = useMemo(() => {
    if (!showHeaders) return filtered.map(({ option, match }) => ({ kind: 'item' as const, option, matchedMeta: match.matchedMeta }));
    const out: Row[] = [];
    for (const type of groupTypes) {
      const items = filtered.filter(({ option }) => option.type === type);
      if (items.length === 0) continue;
      out.push({ kind: 'header', type, count: items.length });
      for (const { option, match } of items) out.push({ kind: 'item', option, matchedMeta: match.matchedMeta });
    }
    return out;
  }, [filtered, showHeaders, groupTypes]);

  const flatOptions = useMemo(() => rows.filter((r): r is Extract<Row, { kind: 'item' }> => r.kind === 'item').map((r) => r.option), [rows]);
  const selectedIndex = flatOptions.findIndex((o) => o.key === selectedKey);
  const selectedRowIndex = rows.findIndex((r) => r.kind === 'item' && r.option.key === selectedKey);

  const moveSelection = (delta: number) => {
    if (flatOptions.length === 0) return;
    const next = flatOptions[Math.max(0, Math.min(flatOptions.length - 1, selectedIndex + delta))];
    if (next) onSelect(next.key);
  };

  const handleListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveSelection(-1);
    }
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && flatOptions.length > 0) {
      e.preventDefault();
      if (selectedIndex < 0) onSelect(flatOptions[0].key);
      listRef.current?.focus();
    } else if (e.key === 'Escape' && query) {
      setQuery('');
    }
  };

  const rowHeight = (row: Row) => (row.kind === 'header' ? HEADER_HEIGHT : row.matchedMeta ? ITEM_HEIGHT_WITH_META : ITEM_HEIGHT);
  const rowKey = (row: Row) => (row.kind === 'header' ? `h-${row.type}` : row.option.key);

  const renderRow = (row: Row) => {
    if (row.kind === 'header') {
      const cfg = ENTRY_POINT_CONFIG[row.type];
      return (
        <ListSubheader key={`h-${row.type}`} sx={{ lineHeight: `${HEADER_HEIGHT}px`, bgcolor: 'background.paper', fontSize: 11, fontWeight: 700 }}>
          {(cfg?.label ?? row.type).toUpperCase()} ({row.count})
        </ListSubheader>
      );
    }
    const { option, matchedMeta } = row;
    const cfg = ENTRY_POINT_CONFIG[option.type];
    const isSelected = option.key === selectedKey;
    return (
      <ListItemButton
        key={option.key}
        id={`entry-point-option-${option.key}`}
        selected={isSelected}
        onClick={() => onSelect(option.key)}
        role="option"
        aria-selected={isSelected}
        tabIndex={-1}
        sx={{
          height: matchedMeta ? ITEM_HEIGHT_WITH_META : ITEM_HEIGHT,
          py: 0,
          gap: 1,
          // A stronger anchor than the selected-state tint alone (barely visible against the
          // theme's off-white background) - scanning a list of 100+ for "where am I" needs more
          // than a faint shade difference.
          borderLeft: '3px solid',
          borderLeftColor: isSelected ? 'primary.main' : 'transparent',
        }}>
        <Box
          sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: option.enabled === undefined ? 'transparent' : option.enabled ? 'success.main' : 'text.disabled' }}
          title={option.enabled === undefined ? undefined : option.enabled ? 'Active' : 'Inactive'}
        />
        {showTypeFilter && <EntryTypeChip cfg={cfg} />}
        <Stack sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={option.label}>
            {option.label}
          </Typography>
          {matchedMeta && option.meta && (
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {option.meta}
            </Typography>
          )}
        </Stack>
      </ListItemButton>
    );
  };

  const useVirtual = rows.length > VIRTUALIZE_THRESHOLD;
  // `label` is a heading ("Endpoint", "Workflow Definitions") - naively appending "s" would double up
  // on the one that's already plural, so only pluralize the ones that actually need it.
  const pluralLabel = label.toLowerCase().endsWith('s') ? label.toLowerCase() : `${label.toLowerCase()}s`;

  // The nearest header at or above `topIndex` — i.e. which group the row currently scrolled to the
  // top belongs to. Only meaningful (and only rendered) while virtualized: below the threshold, the
  // list is plain DOM flow and ListSubheader's own CSS `position: sticky` already handles this.
  const topGroup = useMemo(() => {
    if (!showHeaders) return null;
    for (let i = Math.min(topIndex, rows.length - 1); i >= 0; i--) {
      const r = rows[i];
      if (r.kind === 'header') return r;
    }
    return null;
  }, [showHeaders, topIndex, rows]);

  return (
    <Stack sx={{ minWidth: 0 }} gap={1}>
      <SearchField value={query} onChange={setQuery} onKeyDown={handleSearchKeyDown} inputRef={searchInputRef} placeholder={`Search ${pluralLabel}…`} />

      {showTypeFilter && groupTypes.length > 1 && (
        <Stack direction="row" gap={0.75} flexWrap="wrap">
          <Chip label={`All (${options.length})`} size="small" variant={typeFilter === 'all' ? 'filled' : 'outlined'} onClick={() => setTypeFilter('all')} />
          {groupTypes.map((type) => {
            const cfg = ENTRY_POINT_CONFIG[type];
            return <Chip key={type} label={`${cfg?.label ?? type} (${typeCounts.get(type)})`} size="small" variant={typeFilter === type ? 'filled' : 'outlined'} onClick={() => setTypeFilter(type)} />;
          })}
        </Stack>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography variant="caption" color="text.secondary">
          {filtered.length} of {options.length} {pluralLabel}
        </Typography>
        <Chip
          label="Inactive only"
          size="small"
          variant={onlyInactive ? 'filled' : 'outlined'}
          color={onlyInactive ? 'warning' : 'default'}
          onClick={() => setOnlyInactive((v) => !v)}
        />
      </Stack>

      <Box
        ref={listRef}
        role="listbox"
        aria-label={label}
        aria-activedescendant={selectedKey ? `entry-point-option-${selectedKey}` : undefined}
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 200, position: 'relative', ...(useVirtual ? {} : { maxHeight: 420, overflowY: 'auto' }) }}>
        {rows.length === 0 ? (
          <Stack alignItems="center" gap={1} sx={{ py: 4, px: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              No {pluralLabel} match «{debouncedQuery}»
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setQuery('');
                setTypeFilter('all');
                setOnlyInactive(false);
              }}>
              Clear filters
            </Button>
          </Stack>
        ) : useVirtual ? (
          <>
            {/* Stands in for a sticky ListSubheader, which virtualization breaks (every row,
                headers included, is `position: absolute` — see VirtualList's onTopIndexChange doc).
                Pinned over whichever group the row now at the very top belongs to; when that row
                *is* the group header itself, this sits exactly on top of it, indistinguishable. */}
            {topGroup && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', px: 2, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="overline" sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', lineHeight: 1 }}>
                  {(ENTRY_POINT_CONFIG[topGroup.type]?.label ?? topGroup.type).toUpperCase()} ({topGroup.count})
                </Typography>
              </Box>
            )}
            <VirtualList rows={rows} rowHeight={rowHeight} rowKey={rowKey} renderRow={renderRow} height={LIST_HEIGHT} scrollToIndex={selectedRowIndex >= 0 ? selectedRowIndex : undefined} onTopIndexChange={setTopIndex} />
          </>
        ) : (
          rows.map((row) => renderRow(row))
        )}
      </Box>
    </Stack>
  );
}
