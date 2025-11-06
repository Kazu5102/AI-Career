
import React, { useMemo } from 'react';
import CheckIcon from './icons/CheckIcon';
import EmailIcon from './icons/EmailIcon';

interface ExportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  nickname: string;
}

const ExportGuideModal: React.FC<ExportGuideModalProps> = ({ isOpen, onClose, userId, nickname }) => {
  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream, []);

  const mailtoLink = useMemo(() => {
    const adminEmail = "admin@example.com"; // Placeholder email
    const subject = `キャリア相談データ提出 (${nickname} / ID: ${userId})`;
    const body = `お世話になっております、${nickname}です。\n\nキャリア相談データを提出しますので、ご確認ください。\n\n（ここに先ほど保存したファイルを添付してください）`;
    return `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [userId, nickname]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                <CheckIcon />
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center">ステップ 1: データ保存完了</h2>
            <p className="text-slate-600 mt-2 text-center">
              {isIOS ? (
                <>
                  ファイルは「ファイル」アプリ内の<br/>
                  <strong className="text-sky-700">「ダウンロード」フォルダ</strong>に保存されました。
                </>
              ) : (
                "データのエクスポートが完了しました。"
              )}
            </p>

            <div className="my-6 pt-6 border-t border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 text-center">ステップ 2: メールで提出</h2>
                <p className="text-slate-600 mt-2 text-center mb-4">
                    下のボタンを押してメールソフトを開き、<br/>先ほど保存したファイルを添付して送信してください。
                </p>
                 <a
                  href={mailtoLink}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700"
                >
                  <EmailIcon />
                  メールソフトを開く
                </a>
            </div>
        </div>
        
        <div className="p-5 bg-slate-50 border-t rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 font-semibold rounded-lg transition-all duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300"
            >
              閉じる
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportGuideModal;