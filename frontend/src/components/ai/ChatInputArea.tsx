import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, Send, Loader2 } from 'lucide-react';

interface ChatInputAreaProps {
  onSendMessage: (text: string) => void;
  onVoiceTrigger?: () => void;
  loading?: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  onVoiceTrigger,
  loading = false,
}) => {
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Auto-focus textarea when loading completes
  useEffect(() => {
    if (!loading) {
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  }, [loading]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;
    onSendMessage(trimmed);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendMessage(`[Attached Document: ${file.name}] Please review this medical report.`);
    }
  };

  return (
    <div className="space-y-2">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
      />

      {/* Main Input Card */}
      <div className="bg-white rounded-2xl border border-[#D9E1EA] p-3 sm:p-3.5 shadow-[0_2px_12px_rgba(16,42,86,0.04)] focus-within:border-[#0FA3A3] focus-within:ring-2 focus-within:ring-[#0FA3A3]/15 transition-all">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MediAssist anything about your health..."
          rows={1}
          disabled={loading}
          className="w-full resize-none bg-transparent text-xs sm:text-sm text-[#102A56] placeholder:text-[#9AA7B8] focus:outline-none max-h-32"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F4F8FC]">
          {/* Left Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            title="Attach medical document or image"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Right Voice & Send Button */}
          <div className="flex items-center gap-2">
            {onVoiceTrigger && (
              <button
                type="button"
                onClick={onVoiceTrigger}
                className="p-1.5 rounded-lg text-[#8A98AA] hover:text-[#0FA3A3] hover:bg-[#EEF5FF] transition-colors cursor-pointer"
                title="Speak to MediAssist"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
              className="w-8 h-8 rounded-full bg-[#0FA3A3] hover:bg-[#0D8E8E] active:bg-[#0B7A7A] text-white flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="Send query"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Safety Disclaimer */}
      <p className="text-center text-[10px] text-[#8A98AA] font-normal">
        MediAssist AI can make mistakes. Please verify important information.
      </p>
    </div>
  );
};
