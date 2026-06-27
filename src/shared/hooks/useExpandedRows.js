import { useState, useCallback } from "react";



export function useExpandedRows() {
  const [expanded, setExpanded] = useState(new Set());
  const toggleExpand = useCallback((id) => {

    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  return { expanded, toggleExpand };
}