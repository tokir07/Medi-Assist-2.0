import React, { useState } from 'react';
import { CheckCheck, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import type { ChatMessage } from '../../types/aiAssistant';

interface ChatMessageItemProps {
  message: ChatMessage;
  onLike?: (id: string, liked: boolean) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onLike }) => {
  const [copied, setCopied] = useState(false);
  const [localLiked, setLocalLiked] = useState<boolean | null>(message.liked ?? null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLikeClick = (liked: boolean) => {
    const newVal = localLiked === liked ? null : liked;
    setLocalLiked(newVal);
    if (onLike) {
      onLike(message.id, newVal ?? false);
    }
  };

  const rawText = message?.text || (message as any)?.content || (message as any)?.message || '';

  if (message.sender === 'user') {
    return (
      <div className="flex justify-end mb-4 sm:mb-5">
        <div className="max-w-md sm:max-w-lg rounded-2xl rounded-tr-xs bg-[#EEF5FF] border border-[#D9E1EA]/60 p-3.5 sm:p-4 text-[#102A56] shadow-2xs">
          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
            {rawText}
          </p>
          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-[#5F6F86] font-medium">
            <span>{message.timestamp || 'Just now'}</span>
            <CheckCheck className="w-3.5 h-3.5 text-[#0FA3A3]" />
          </div>
        </div>
      </div>
    );
  }

  // AI Response
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 mb-5 sm:mb-6">
      {/* MediAssist AI Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-[#D9E1EA] p-1 flex items-center justify-center shrink-0 shadow-2xs">
        <img src={logoImg} alt="MediAssist AI" className="w-full h-full object-contain" />
      </div>

      {/* Message Card */}
      <div className="max-w-xl sm:max-w-2xl rounded-2xl rounded-tl-xs bg-white border border-[#D9E1EA]/90 p-4 sm:p-5 text-[#102A56] shadow-[0_4px_16px_rgba(16,42,86,0.03)] space-y-3">
        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal text-[#102A56] space-y-2">
          {rawText.split('\n\n').map((paragraph: string, pIdx: number) => {
            // Check for bullet lists
            if (paragraph.includes('•') || paragraph.startsWith('-')) {
              const items = paragraph.split('\n');
              return (
                <div key={pIdx} className="space-y-1 my-2 pl-1">
                  {items.map((item: string, iIdx: number) => {
                    const cleanItem = item.replace(/^[•\-*]\s*/, '').trim();
                    if (!cleanItem) return null;
                    return (
                      <div key={iIdx} className="flex items-start gap-2">
                        <span className="text-[#0FA3A3] font-bold mt-0.5">•</span>
                        <span>{cleanItem}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Bold headers
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <h4 key={pIdx} className="font-bold text-[#102A56] text-xs sm:text-sm">
                  {paragraph.replace(/\*\*/g, '')}
                </h4>
              );
            }

            return <p key={pIdx}>{paragraph}</p>;
          })}
        </div>

        {/* Action Controls & Timestamp Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F4F8FC] text-[11px] text-[#8A98AA]">
          <span className="font-medium">{message.timestamp}</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleLikeClick(true)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                localLiked === true
                  ? 'text-[#0FA3A3] bg-[#EEF5FF]'
                  : 'text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC]'
              }`}
              title="Helpful response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleLikeClick(false)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                localLiked === false
                  ? 'text-[#D64545] bg-red-50'
                  : 'text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC]'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#1FA774]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
