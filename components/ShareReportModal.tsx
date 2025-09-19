import React, { useState } from 'react';
import { StoredConversation, IndividualAnalysisData } from '../types';
import { generateReport } from '../services/reportService';
import ShareIcon from './icons/ShareIcon';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  conversations: StoredConversation[];
  individualAnalysisData: IndividualAnalysisData | null;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({ isOpen, onClose, userId, conversations, individualAnalysisData }) => {
  const [password, setPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください。');
      return;
    }
    setError('');
    setIsGenerating(true);
    try {
      const dataToReport = {
        userId,
        conversations,
        analysis: individualAnalysisData,
      };
      const reportBlob = await generateReport(dataToReport, password);
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${userId}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error("Failed to generate report", err);
      const message = err instanceof Error ? err.message : '不明なエラー';
      setError(`レポートの生成に失敗しました: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleModalClose = () => {
    if (isGenerating) return;
    setPassword('');
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleModalClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">共有レポートを作成</h2>
          <p className="text-sm text-slate-500 mt-1 truncate" title={userId}>相談者ID: {userId}</p>
        </header>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            この相談者の全データを含む、パスワードで暗号化された単一のHTMLファイルを生成します。
            このファイルとパスワードを共有することで、安全に情報を連携できます。
          </p>
          <div>
            <label htmlFor="report-password" className="block text-sm font-bold text-slate-700 mb-2">
              レポート閲覧用パスワード
            </label>
            <input
              id="report-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上のパスワード"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              autoFocus
            />
             {error && <p className="text-xs text-red-500 mt-1.5 px-1">{error}</p>}
          </div>
        </div>

        <footer className="p-5 bg-slate-50 border-t border-slate-200 flex gap-4">
          <button
            onClick={handleModalClose}
            className="w-full px-4 py-2 font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
            disabled={isGenerating}
          >
            キャンセル
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || password.length < 8}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <ShareIcon className="w-5 h-5"/>
                生成してダウンロード
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ShareReportModal;