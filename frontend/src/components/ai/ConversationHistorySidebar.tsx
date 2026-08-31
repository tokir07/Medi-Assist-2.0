import React from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import type { ConversationThread } from '../../types/aiAssistant';

interface ConversationHistorySidebarProps {
  conversations: ConversationThread[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationHistorySidebar: React.FC<ConversationHistorySidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-4 sm:p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] flex flex-col justify-between h-full min-h-[550px]">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F4F8FC]">
          <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Conversations</h3>
          <button
            type="button"
            onClick={onNewConversation}
            className="w-7 h-7 rounded-xl border border-[#D9E1EA] text-[#0FA3A3] hover:bg-[#EEF5FF] hover:border-[#0FA3A3] flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs"
            title="Start New Conversation"
            aria-label="Start New Conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="space-y-2 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
          {conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#F4F9FF] border-[#0FA3A3]/40 shadow-xs'
                    : 'bg-white hover:bg-[#F7FAFF] border-[#E7EDF4]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? 'bg-[#0FA3A3]' : 'border border-[#8A98AA]'
                      }`}
                    />
                    <h4
                      className={`text-xs font-bold truncate leading-tight ${
                        isActive ? 'text-[#0FA3A3]' : 'text-[#102A56]'
                      }`}
                    >
                      {conv.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#8A98AA] shrink-0 font-medium">
                    {conv.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-[#5F6F86] truncate mt-1 pl-4 font-normal">
                  {conv.snippet}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="pt-3 border-t border-[#F4F8FC]">
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full py-2 px-3 text-xs font-semibold text-[#5F6F86] hover:text-[#102A56] hover:bg-[#F4F8FC] rounded-xl border border-[#D9E1EA]/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#8A98AA]" />
          <span>View All Conversations</span>
        </button>
      </div>
    </div>
  );
};
