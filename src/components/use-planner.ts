import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { readPlanner, type Planner } from '@/lib/planner';

export function usePlanner() {
  const [data, setData] = useState<Planner | null>(null);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++request.current;
    setError(false);
    try {
      const result = await readPlanner();
      if (current === request.current) setData(result);
    } catch {
      if (current === request.current) { setData(null); setError(true); }
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { request.current++; setData(null); };
  }, [refresh]));
  return { data, error, refresh };
}
