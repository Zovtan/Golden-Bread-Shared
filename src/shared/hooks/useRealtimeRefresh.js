





import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";

export function useRealtimeRefresh(channelName, tables, onRefresh, debounceMs = 400) {
  const timerRef = useRef(null);
  const refreshRef = useRef(onRefresh);
  const retryRef = useRef(null);
  const mountedRef = useRef(true);
  const channelRef = useRef(null);



  useEffect(() => {refreshRef.current = onRefresh;}, [onRefresh]);


  const handleChange = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => refreshRef.current?.(), debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    if (!tables.length) return;
    mountedRef.current = true;

    const subscribe = () => {


      let isRetrying = false;

      const ch = supabase.channel(channelName);
      tables.forEach((table) => {
        ch.on("postgres_changes", { event: "*", schema: "public", table }, handleChange);
      });
      ch.subscribe((status) => {

        if (isRetrying || !mountedRef.current) return;

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          isRetrying = true;
          console.warn(`[Realtime] ${channelName}: ${status} - retry in 5s`);
          supabase.removeChannel(ch);
          channelRef.current = null;
          retryRef.current = setTimeout(() => {
            if (mountedRef.current) subscribe();
          }, 5000);
        }
      });
      channelRef.current = ch;
    };

    subscribe();

    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      clearTimeout(retryRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, tables.join(","), handleChange]);
}