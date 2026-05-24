import { useState, useEffect, useRef, forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  debounce?: number;
}

export const DebouncedInput = forwardRef<HTMLInputElement, DebouncedInputProps>(
  ({ value, onChange, debounce = 200, className, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(value);
    const onChangeRef = useRef(onChange);

    // Keep ref up to date
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    // Sync external value changes to local state
    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Handle debounced callback
    useEffect(() => {
      if (localValue === value) return;
      
      const handler = setTimeout(() => {
        onChangeRef.current(String(localValue));
      }, debounce);

      return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localValue, debounce]);

    return (
      <input
        {...props}
        ref={ref}
        className={className}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={(e) => {
          onChangeRef.current(e.target.value);
          if (props.onBlur) props.onBlur(e);
        }}
      />
    );
  }
);

DebouncedInput.displayName = 'DebouncedInput';
