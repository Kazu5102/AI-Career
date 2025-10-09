import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StoredConversation, StoredData, UserInfo, STORAGE_VERSION, UserAnalysisCache } from '../types';
import * as userService from '../services/userService';
import { getStoredPassword, setPassword } from '../services/authService';
import * as devLogService from '../services/devLogService';
import ConversationDetailModal from '../components/ConversationDetailModal';
import AddTextModal from '../components/AddTextModal';
import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import TrashIcon from '../components/icons/TrashIcon';
import ImportIcon from '../components/icons/ImportIcon';
import KeyIcon from '../components/icons/KeyIcon';
import UserIcon from '../components/icons/UserIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import ShareIcon from '../components/icons/ShareIcon';
import LogIcon from '../components/icons/LogIcon';

// A component to manage admin password changes
const PasswordManager: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = setPassword(newPassword, currentPassword);
        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setCurrentPassword('');
            setNewPassword('');
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setTimeout(() => setMessage(null), 4000);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><KeyIcon /> パスワード変更</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input type="password" placeholder="現在のパスワード" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-md" required />
                <input type="password" placeholder="新しいパスワード" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-md" required />
                <button type="submit" className="w-full bg-slate-600 text-white px-3 py-2 rounded-md hover:bg-slate-700">変更</button>
                {message && <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
            </form>
        </div>
    );
};


const AdminView: React.FC = () => {
    const [allConversations, setAllConversations] = useState<StoredConversation[]>([]);
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
    const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
    const [userToShare, setUserToShare] = useState<UserInfo | null>(null);
    const [isDevLogModalOpen, setIsDevLogModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = () => {
        const users = userService.getUsers();
        setAllUsers(users);

        const allDataRaw = localStorage.getItem('careerConsultations');
        if (allDataRaw) {
            try {
                const parsed = JSON.parse(allDataRaw) as StoredData | StoredConversation[];
                const conversations = ('data' in parsed && Array.isArray(parsed.data)) ? parsed.data : Array.isArray(parsed) ? parsed : [];
                setAllConversations(conversations);
            } catch (e) {
                console.error("Failed to parse conversations", e);
                setAllConversations([]);
            }
        } else {
            setAllConversations([]);
        }

        if (users.length > 0 && !selectedUserId) {
            setSelectedUserId(users[0].id);
        }
    };

    useEffect(loadData, []);

    const conversationsByUser = useMemo(() => {
        return allConversations.reduce<Record<string, StoredConversation[]>>((acc, conv) => {
            if (!acc[conv.userId]) acc[conv.userId] = [];
            acc[conv.userId].push(conv);
            return acc;
        }, {});
    }, [allConversations]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text.");
                
                const importedData = JSON.parse(text) as StoredData;
                if (importedData.version !== STORAGE_VERSION || !Array.isArray(importedData.data)) {
                    throw new Error("Invalid data format or version mismatch.");
                }

                // Simple merge: add new, don't update existing for simplicity.
                const existingIds = new Set(allConversations.map(c => c.id));
                const newConversations = importedData.data.filter(c => !existingIds.has(c.id));
                
                const updatedConversations = [...allConversations, ...newConversations];
                
                const dataToStore: StoredData = { version: STORAGE_VERSION, data: updatedConversations };
                localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
                alert(`${newConversations.length}件の新しい相談履歴がインポートされました。`);
                loadData();

            } catch (error) {
                alert(`インポートに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
            } finally {
                // Reset file input
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleClearAllData = () => {
        if (window.confirm("本当にすべてのユーザーと相談履歴を削除しますか？この操作は元に戻せません。")) {
            localStorage.removeItem('careerConsultations');
            localStorage.removeItem('careerConsultingUsers_v1');
            devLogService.clearLogs();
            loadData();
            setSelectedUserId(null);
            alert("すべてのデータが削除されました。");
        }
    };

    const handleClearUserData = (userId: string) => {
        const user = allUsers.find(u => u.id === userId);
        if (window.confirm(`本当に「${user?.nickname}」のすべての相談履歴 (${conversationsByUser[userId]?.length || 0}件) を削除しますか？`)) {
            const updatedConversations = allConversations.filter(c => c.userId !== userId);
            const dataToStore: StoredData = { version: STORAGE_VERSION, data: updatedConversations };
            localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
            alert(`「${user?.nickname}」のデータが削除されました。`);
            loadData();
        }
    };
    
    const handleAddTextSubmit = (newConversation: StoredConversation) => {
        const updatedConversations = [...allConversations, newConversation];
        const dataToStore: StoredData = { version: STORAGE_VERSION, data: updatedConversations };
        localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
        
        // Check if it's a new user and add them
        if (!allUsers.some(u => u.id === newConversation.userId)) {
            userService.saveUsers([...allUsers, { id: newConversation.userId, nickname: ` imported_${newConversation.userId}`, pin: '0000'}]);
        }

        loadData();
        setIsAddTextModalOpen(false);
        setSelectedUserId(newConversation.userId);
        alert('テキストから新しい相談履歴が追加されました。');
    };
    
    const selectedUserConversations = selectedUserId ? (conversationsByUser[selectedUserId] || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-2xl border border-slate-200 my-4 md:my-6 min-h-[80vh]">
            <header className="pb-4 border-b border-slate-200 mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h1>
                <button
                    onClick={() => setIsDevLogModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg text-sm transition-colors text-white flex items-center gap-2 shadow-md"
                    title="開発ログを表示"
                >
                    <LogIcon />
                    <span className="hidden sm:inline">開発ログ</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Users & Actions */}
                <aside className="lg:col-span-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                        <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 transition-all"><ImportIcon /> データインポート</button>
                        <button onClick={() => setIsAddTextModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-600 transition-all"><PlusCircleIcon /> テキストから追加</button>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-2">相談者一覧 ({allUsers.length}名)</h2>
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                            {allUsers.map(user => (
                                <button key={user.id} onClick={() => setSelectedUserId(user.id)} className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${selectedUserId === user.id ? 'bg-sky-100 ring-2 ring-sky-500' : 'hover:bg-slate-100'}`}>
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><UserIcon /></div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold text-slate-700 truncate" title={user.nickname}>{user.nickname}</p>
                                        <p className="text-xs text-slate-500">{conversationsByUser[user.id]?.length || 0}件の相談</p>
                                    </div>
                                </button>
                            ))}
                            {allUsers.length === 0 && <p className="text-sm text-slate-500 text-center p-4">ユーザーデータがありません。</p>}
                        </div>
                    </div>
                    <PasswordManager />
                    <button onClick={handleClearAllData} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-all"><TrashIcon /> 全データ削除</button>
                </aside>

                {/* Right Panel: Conversations */}
                <main className="lg:col-span-8">
                    {selectedUserId && allUsers.find(u => u.id === selectedUserId) ? (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-full">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 truncate" title={allUsers.find(u => u.id === selectedUserId)?.nickname}>{allUsers.find(u => u.id === selectedUserId)?.nickname} の相談履歴</h2>
                                    <p className="text-sm text-slate-500 font-mono">{selectedUserId}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setUserToShare(allUsers.find(u => u.id === selectedUserId) || null)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"><ShareIcon /> レポート共有</button>
                                    <button onClick={() => handleClearUserData(selectedUserId)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"><TrashIcon /> このユーザーのデータを削除</button>
                                </div>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                                {selectedUserConversations.map(conv => (
                                    <button key={conv.id} onClick={() => setSelectedConversation(conv)} className="w-full text-left p-3 bg-white rounded-lg hover:bg-sky-50 border transition-colors shadow-sm">
                                        <p className="font-semibold text-slate-700">{new Date(conv.date).toLocaleString('ja-JP')}</p>
                                        <p className="text-sm text-slate-500 truncate">担当: {conv.aiName} | {conv.summary.substring(0, 50)}...</p>
                                    </button>
                                ))}
                                {selectedUserConversations.length === 0 && <p className="text-sm text-slate-500 text-center p-8">このユーザーの相談履歴はありません。</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg p-8">
                            <p>左のリストから相談者を選択してください。</p>
                        </div>
                    )}
                </main>
            </div>

            {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
            
            <AddTextModal 
                isOpen={isAddTextModalOpen} 
                onClose={() => setIsAddTextModalOpen(false)} 
                onSubmit={handleAddTextSubmit}
                existingUserIds={allUsers.map(u => u.id)}
            />
            
            {userToShare && (
                <ShareReportModal
                    isOpen={!!userToShare}
                    onClose={() => setUserToShare(null)}
                    userId={userToShare.id}
                    conversations={conversationsByUser[userToShare.id] || []}
                    analysisCache={null} // Admin view doesn't generate analysis, so pass null
                />
            )}
             <DevLogModal 
                isOpen={isDevLogModalOpen}
                onClose={() => setIsDevLogModalOpen(false)}
            />
        </div>
    );
};

export default AdminView;