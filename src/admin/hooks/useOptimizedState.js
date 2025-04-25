import { useCallback, useState } from "react";

export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((newState) => {
    setState((prevState) => {
      if (JSON.stringify(prevState) === JSON.stringify(newState)) {
        return prevState;
      }
      return newState;
    });
  }, []);

  return [state, updateState];
};
