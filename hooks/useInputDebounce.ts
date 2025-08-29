import { useState, useCallback, useRef, useEffect } from "react";

export function useInputDebounce(
  initialValue: string = "",
  delay: number = 100,
  onDebouncedChange?: (value: string) => void
) {
  const [localValue, setLocalValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSentValue = useRef(initialValue);

  // Handle input change with immediate local update and delayed parent update
  const handleChange = useCallback(
    (value: string) => {
      setLocalValue(value);

      // Clear existing timeout and set new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        // Only update parent if value actually changed and callback exists
        if (onDebouncedChange && value !== lastSentValue.current) {
          lastSentValue.current = value;
          onDebouncedChange(value);
        }
      }, delay);
    },
    [delay, onDebouncedChange]
  );

  // Sync with external value changes (but don't trigger parent update)
  useEffect(() => {
    if (initialValue !== lastSentValue.current) {
      setLocalValue(initialValue);
      lastSentValue.current = initialValue;
    }
  }, [initialValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    localValue,
    handleChange,
  };
}
