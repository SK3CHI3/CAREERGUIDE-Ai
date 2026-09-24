import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, forwardRef, useImperativeHandle } from 'react';

interface ChatInputProps {
  message: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  'aria-label'?: string;
  autoFocus?: boolean;
}

export interface ChatInputHandle {
  focus: () => void;
}

// Shared auto-resizing textarea chat input component
export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({
  message,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask about careers...',
  className = '',
  inputClassName = '',
  buttonClassName = '',
  'aria-label': ariaLabel = 'Chat message',
  autoFocus = false,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
  }));

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`flex gap-2 items-center rounded-2xl p-2 transition-all ${className}`}>
      <textarea
        ref={textareaRef}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        autoFocus={autoFocus}
        className={`min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base flex-1 py-2 ${inputClassName}`}
      />
      <Button
        onClick={onSend}
        disabled={disabled || !message.trim()}
        size="icon"
        aria-label="Send message"
        className={`h-10 w-10 shrink-0 rounded-xl ${buttonClassName}`}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
