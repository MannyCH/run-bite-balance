
import React from 'react';

interface MultiSelectFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label: string;
}

export const MultiSelectField = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add',
  label,
}: MultiSelectFieldProps) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        const newValue = [...value, inputValue.trim()];
        onChange(newValue);
      }
      setInputValue('');
    }
  };

  const removeItem = (itemToRemove: string) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((item) => (
            <div
              key={item}
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="ml-2 text-primary hover:text-primary/80"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
