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

import { Box } from '@wso2/oxygen-ui';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type JSX, type ReactNode, type UIEvent } from 'react';

/**
 * Minimal fixed-height-per-row virtualization, with no new dependency (react-window/virtuoso
 * aren't installed - see the entry point picker's design notes). Every row's height must be
 * knowable up front from `rowHeight` alone; nothing is measured from the DOM, so there's no
 * reflow pass and no scroll-position jump once real heights replace estimates.
 */
export default function VirtualList<T>({
  rows,
  rowHeight,
  renderRow,
  rowKey,
  height,
  overscan = 8,
  scrollToIndex,
  onTopIndexChange,
}: {
  rows: T[];
  rowHeight: (row: T, index: number) => number;
  renderRow: (row: T, index: number) => ReactNode;
  /** Stable key per row (defaults to array index). Pass one whenever a row can shift position
   * between renders (e.g. as a search filters the list) so items don't remount and lose state. */
  rowKey?: (row: T, index: number) => string | number;
  height: number;
  overscan?: number;
  /** Scrolls the given row into view (e.g. following a deep-linked or keyboard-moved selection). */
  scrollToIndex?: number;
  /** Fires with the index of the row currently at the top of the viewport. Virtualized rows are
   * `position: absolute`, which takes them out of normal flow and breaks CSS `position: sticky` on
   * a row (e.g. a group header) — this is how a caller rebuilds a sticky-looking header instead:
   * render its own pinned overlay showing whichever group `onTopIndexChange` currently reports. */
  onTopIndexChange?: (index: number) => void;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Prefix sums of row offsets — exact, since only two fixed heights (group header / item) ever
  // occur, recomputed only when the row list itself changes.
  const offsets = useMemo(() => {
    const out = new Array<number>(rows.length + 1);
    out[0] = 0;
    for (let i = 0; i < rows.length; i++) out[i + 1] = out[i] + rowHeight(rows[i], i);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const totalHeight = offsets[rows.length] ?? 0;

  // First row index whose end offset exceeds `target` — i.e. the first row visible at that scroll position.
  function indexAtOffset(target: number): number {
    let lo = 0;
    let hi = rows.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid + 1] <= target) lo = mid + 1;
      else hi = mid;
    }
    return Math.min(lo, Math.max(0, rows.length - 1));
  }

  const firstVisible = indexAtOffset(scrollTop);
  const lastVisible = indexAtOffset(scrollTop + height);
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(rows.length, lastVisible + overscan + 1);

  useEffect(() => {
    onTopIndexChange?.(firstVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstVisible]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (scrollToIndex === undefined || !el || rows.length === 0) return;
    const idx = Math.max(0, Math.min(rows.length - 1, scrollToIndex));
    const top = offsets[idx];
    const bottom = offsets[idx + 1];
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + height) el.scrollTop = bottom - height;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToIndex, offsets, height]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);

  return (
    <Box ref={containerRef} onScroll={handleScroll} sx={{ height, overflowY: 'auto', position: 'relative' }}>
      <Box sx={{ height: totalHeight, position: 'relative' }}>
        {rows.slice(start, end).map((row, i) => {
          const index = start + i;
          const key = rowKey ? rowKey(row, index) : index;
          return (
            <Box key={key} sx={{ position: 'absolute', top: offsets[index], left: 0, right: 0 }}>
              {renderRow(row, index)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
