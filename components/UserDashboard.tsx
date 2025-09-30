

import React, { useState } from 'react';
import { StoredConversation, SkillMatchingResult, STORAGE_VERSION, StoredData } from '../types';
import ConversationDetailModal from './ConversationDetailModal';
import SkillMatchingModal from './SkillMatchingModal';
import { performSkillMatching } from '../services/index';
import TargetIcon from './icons/TargetIcon';
import PlayIcon from './icons/PlayIcon';
import ExportIcon from './icons/ExportIcon';


interface UserDashboardProps {
  conversations: StoredConversation[];
  onNewChat: () => void;
  onResume: (conversation: StoredConversation) => void;
  userId: string;
  nickname: string;
  onSwitchUser: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ conversations, onNewChat, onResume, userId, nickname, onSwitchUser }) => {
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
  const [skillMatchingResult, setSkillMatchingResult] = useState<SkillMatchingResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAITypeDisplay = (conv: StoredConversation) => {
    if (!conv.aiType) return '';
    return conv.aiType === 'human' ? ' (人間)' : ' (犬)';
  };
  
  const handleRunSkillMatching = async () => {
    if (conversations.length === 0) {
        alert("診断には少なくとも1件の相談履歴が必要です。");
        return;
    }
    setIsMatching(true);
    setMatchingError(null);
    setSkillMatchingResult(null);
    setIsMatchingModalOpen(true);
    try {
        const result = await performSkillMatching(conversations);
        setSkillMatchingResult(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
        setMatchingError(`診断中にエラーが発生しました: ${errorMessage}`);
    } finally {
        setIsMatching(false);
    }
  };

  const handleExportUserData = () => {
      if (conversations.length === 0) {
          alert("エクスポートするデータがありません。");
          return;
      }
      const dataToStore: StoredData = {
          version: STORAGE_VERSION,
          data: conversations,
      };
      const blob = new Blob([JSON.stringify(dataToStore, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `consulting_data_${userId}_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-6 my-4 md:my-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {nickname}さんの相談履歴
            </h1>
             <p className="text-sm text-slate-500 mt-1 truncate" title={userId}>相談者ID: <span className="font-mono">{userId}</span></p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
                onClick={onSwitchUser}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-300 transition-all duration-200"
              >
                ユーザー選択に戻る
            </button>
            <button
                onClick={handleRunSkillMatching}
                disabled={isMatching || conversations.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <TargetIcon />
                適性診断
            </button>
            <button
              onClick={onNewChat}
              className="w-full sm:w-auto px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-all duration-200"
            >
              新しい相談を始める
            </button>
          </div>
        </header>

        <main className="pt-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={handleExportUserData}
              disabled={conversations.length === 0}
              className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                <ExportIcon />
                管理者へデータ提出
            </button>
          </div>
          {conversations.length > 0 ? (
            <div className="space-y-2">
              {[...conversations].reverse().map(conv => (
                <div
                  key={conv.id}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                >
                  <div className="flex-grow cursor-pointer" onClick={() => setSelectedConversation(conv)}>
                    <div className="font-semibold text-slate-700 flex items-center gap-2">
                      {formatDate(conv.date)}
                      {conv.status === 'interrupted' && <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">中断</span>}
                    </div>
                    <p className="text-sm text-slate-500">担当AI: {conv.aiName}{getAITypeDisplay(conv)}</p>
                  </div>
                  {conv.status === 'interrupted' && (
                    <button 
                      onClick={() => onResume(conv)}
                      className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 mt-2 sm:mt-0 px-4 py-2 bg-emerald-100 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      <PlayIcon />
                      続きから再開する
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4 rounded-lg bg-slate-50 min-h-[300px]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-bold text-slate-700">まだ相談履歴がありません</h3>
              <p className="mt-2 text-sm max-w-md">
                AIアシスタントとの対話を通じて、ご自身のキャリアについて考えてみませんか？
                「新しい相談を始める」ボタンから最初の相談を開始できます。
              </p>
            </div>
          )}
        </main>
      </div>

      {selectedConversation && (
        <ConversationDetailModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}

      <SkillMatchingModal
        isOpen={isMatchingModalOpen}
        onClose={() => setIsMatchingModalOpen(false)}
        result={skillMatchingResult}
        isLoading={isMatching}
        error={matchingError}
      />
    </>
  );
};

export default UserDashboard;