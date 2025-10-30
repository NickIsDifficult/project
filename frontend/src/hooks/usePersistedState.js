// src/hooks/usePersistedState.js
import { useEffect, useState } from "react";

export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => localStorage.getItem(key) || initialValue);
  useEffect(() => localStorage.setItem(key, state), [key, state]);
  return [state, setState];
}
