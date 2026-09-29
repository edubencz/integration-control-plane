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

import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Mirrors an environment card's entry point selection into `?env=<id>&entry=<Type>::<name>`, so a
 * chosen endpoint is a shareable, refresh-proof link — same `?env=` convention TestConsole and
 * Workflows already use.
 *
 * A component page renders one card per environment, all mounted at once, but the URL can only
 * point at one of them. So: the URL is only consulted as this card's *initial* value (deep link /
 * refresh), for the one card whose `env` param actually matches; picking a different entry in this
 * card takes over local state (and rewrites the URL to describe it) without waiting on or being
 * knocked over by another card's own selection.
 */
export function useEntryPointSelection(envId: string, fallbackKey: string, validKeys: Set<string>): [string, (key: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlKey = searchParams.get('env') === envId ? searchParams.get('entry') : null;
  const [localKey, setLocalKey] = useState('');

  const rawKey = localKey || urlKey || '';
  const activeKey = rawKey && validKeys.has(rawKey) ? rawKey : fallbackKey;

  const select = useCallback(
    (key: string) => {
      setLocalKey(key);
      // replace: true — clicking through several entry points must not each push a history entry,
      // or the browser's Back button would just step back through past selections instead of
      // leaving the page.
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('env', envId);
          next.set('entry', key);
          return next;
        },
        { replace: true },
      );
    },
    [envId, setSearchParams],
  );

  return [activeKey, select];
}
