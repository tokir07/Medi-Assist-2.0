import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import {
  MessageSquare,
  Send,
  User,
  Paperclip,
  Bell,
  FileText,
  Pill,
  Calendar,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  timestamp: string;
}

interface Conversation {
  patient_id: string;
  patient_name: string;
  patient_age: number;
  last_message: string;
  timestamp: string;
  unread: boolean;
}

export const DoctorMessagesPage: React.FC = () => {
  const navigate = useNavigate();

  const [conversations] = useState<Conversation[]>([
    {
      patient_id: 'pat-demo-1',
      patient_name: 'Rahul Sharma',
      patient_age: 24,
      last_message: 'Doctor, my fever is still around 101°F. Should I take Paracetamol again?',
      timestamp: '10:15 AM',
      unread: true,
    },
    {
      patient_id: 'pat-demo-2',
      patient_name: 'Priya Singh',
      patient_age: 31,
      last_message: 'I have uploaded my latest CBC report as requested.',
      timestamp: '09:30 AM',
      unread: true,
    },
    {
      patient_id: 'pat-demo-3',
      patient_name: 'Amit Kumar',
      patient_age: 42,
      last_message: 'Thank you for the prescription doctor. Feeling much better.',
      timestamp: 'Yesterday',
      unread: false,
    },
    {
      patient_id: 'pat-demo-4',
      patient_name: 'Neha Gupta',
      patient_age: 29,
      last_message: 'When should I schedule my follow-up checkup?',
      timestamp: '28 Aug',
      unread: false,
    },
  ]);

  const [activeConv, setActiveConv] = useState<Conversation>(conversations[0]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'pat-demo-1': [
      {
        id: 'm1',
        sender: 'patient',
        text: 'Doctor, my fever is still around 101°F. Should I take Paracetamol again?',
        timestamp: '10:15 AM',
      },
      {
        id: 'm2',
        sender: 'doctor',
        text: 'How many hours ago did you take your last dose of Paracetamol?',
        timestamp: '10:18 AM',
      },
      {
        id: 'm3',
        sender: 'patient',
        text: 'Around 6 hours ago at 4 AM.',
        timestamp: '10:20 AM',
      },
      {
        id: 'm4',
        sender: 'doctor',
        text: 'Yes, you can take a 500mg Paracetamol tablet now after light food. Please keep drinking fluids and stay rested.',
        timestamp: '10:22 AM',
      },
    ],
  });

  const [inputVal, setInputVal] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [reminderType, setReminderType] = useState<string>('Report');
  const [reminderTitle, setReminderTitle] = useState<string>('Upload CBC Blood Report');
  const [reminderNote, setReminderNote] = useState<string>(
    'Please upload your latest CBC blood test report before your upcoming appointment.'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = () => {
    if (!inputVal.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'doctor',
      text: inputVal.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const patId = activeConv.patient_id;
    setMessages((prev) => ({
      ...prev,
      [patId]: [...(prev[patId] || []), newMsg],
    }));

    setInputVal('');
  };

  const handleSendReminder = async () => {
    try {
      await doctorService.sendPatientReminder({
        patient_id: activeConv.patient_id,
        reminder_type: reminderType,
        title: reminderTitle,
        message: reminderNote,
      });
      showToast('Reminder sent directly to patient portal!');
      setShowReminderModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const activeMessages = messages[activeConv.patient_id] || [
    {
      id: 'm-default',
      sender: 'patient',
      text: activeConv.last_message,
      timestamp: activeConv.timestamp,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Chat Layout Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-[75vh] flex flex-col md:flex-row overflow-hidden">
        {/* Left Conversations Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 space-y-2">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <span>Patient Messages</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.map((c) => {
              const selected = c.patient_id === activeConv.patient_id;
              return (
                <div
                  key={c.patient_id}
                  onClick={() => setActiveConv(c)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    selected ? 'bg-teal-50/80 border-l-4 border-teal-600' : 'hover:bg-slate-100/80'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0">
                    {c.patient_name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{c.patient_name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{c.last_message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center & Right Chat Window */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold flex items-center justify-center text-xs">
                {activeConv.patient_name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeConv.patient_name}</h3>
                <span className="text-[11px] text-teal-600 font-semibold">• Active Patient</span>
              </div>
            </div>

            {/* Quick Actions Bar inside Chat */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowReminderModal(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Send Reminder</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/doctor/patients/${activeConv.patient_id}`)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Patient Profile
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
            {activeMessages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'doctor'
                      ? 'bg-teal-700 text-white rounded-tr-xs shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium px-1 mt-1">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Type message to ${activeConv.patient_name}...`}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!inputVal.trim()}
              className="w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shrink-0 shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Send Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <span>Send Reminder to {activeConv.patient_name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reminder Category</label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="Report">Report Reminder</option>
                  <option value="Medicine">Medicine Adherence</option>
                  <option value="Appointment">Upcoming Appointment</option>
                  <option value="Follow-up">Follow-up Consultation</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message</label>
                <textarea
                  rows={3}
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReminder}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Send Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
