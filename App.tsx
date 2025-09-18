
import React, { useState, useEffect } from 'react';
import UserView from './views/UserView';
import AdminView from './views/AdminView';
import PasswordModal from './components/PasswordModal';
import { checkPassword } from './services/authService';
import { checkServerStatus } from './services/index';

type AppMode = 'user' | 'admin';
type ServerStatus = 'checking' | 'ok' | 'error';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('user');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');

    useEffect(() => {
        const verifyServer = async () => {
            try {
                await checkServerStatus();
                setServerStatus('ok');
            } catch (error) {
                console.error("Server health check failed:", error);
                setServerStatus('error');
            }
        };
        verifyServer();
    }, []);

    const handleSwitchToAdmin = () => {
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = (password: string): boolean => {
        if (checkPassword(password)) {
            setMode('admin');
            setIsPasswordModalOpen(false);
            return true;
        }
        return false;
    };

    const handleSwitchMode = () => {
        if (mode === 'user') {
            handleSwitchToAdmin();
        } else {
            setMode('user');
        }
    };

    const ServerStatusBanner: React.FC = () => {
        if (serverStatus === 'ok') return null;

        const message = serverStatus === 'checking' 
            ? 'バックエンドサーバーの接続を確認中...'
            : 'サーバー通信エラー: プレビュー環境がサーバー機能に未対応か、設定に問題がある可能性があります。';
        
        const bgColor = serverStatus === 'checking' ? 'bg-blue-600' : 'bg-red-600';

        return (
            <div className={`w-full p-2 text-center text-white text-sm font-semibold ${bgColor}`}>
                {message}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen font-sans bg-slate-100">
            <div className="bg-slate-800 text-white p-3 text-center shadow-md z-10">
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
                    <span className="font-bold text-sm sm:text-base">
                        表示モード: {mode === 'user' ? <span>ユーザー画面<span className="hidden md:inline"> (AIキャリア相談)</span></span> : '管理者画面'}
                    </span>
                    <button
                        onClick={handleSwitchMode}
                        className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md text-sm transition-colors"
                    >
                        {mode === 'user' ? '管理者画面へ' : 'ユーザー画面へ'}
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">（これはデモ用の表示切り替え機能です）</p>
            </div>
            
            <ServerStatusBanner />

            <div className="flex-1 overflow-y-auto">
              {serverStatus === 'ok' ? (
                  mode === 'user' ? <UserView /> : <AdminView />
              ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 p-4 text-center">
                    {serverStatus === 'checking' && <p>サーバー接続待機中...</p>}
                    {serverStatus === 'error' && (
                        <div>
                            <h2 className="text-xl font-bold text-red-500 mb-2">表示エラー</h2>
                            <p>アプリケーションの表示に必要なサーバー機能との通信に失敗しました。<br/>
                            「考え中」で停止する問題を防ぐため、コンテンツの表示を中断しています。</p>
                        </div>
                    )}
                  </div>
              )}
            </div>

            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
            />
        </div>
    );
}

export default App;
