
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StoredConversation, StoredData, UserInfo, STORAGE_VERSION, AnalysisType, AnalysesState, UserAnalysisCache } from '../types';
import * as userService from '../services/userService';
import * as devLogService from '../services/devLogService';
import { analyzeTrajectory, findHiddenPotential, performSkillMatching } from '../services/index';

import ConversationDetailModal from '../components/ConversationDetailModal';
import AddTextModal from '../components/AddTextModal';
import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import AnalysisDashboard from './AnalysisDashboard';
import AnalysisDisplay from '../components/AnalysisDisplay';
import SkillMatchingModal from '../components/SkillMatchingModal';
import PasswordChangeModal from '../components/PasswordChangeModal';

import TrashIcon from '../components/icons/TrashIcon';
import ImportIcon from '../components/icons/ImportIcon';
import KeyIcon from '../components/icons/KeyIcon';
import UserIcon from '../components/icons/UserIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import ShareIcon from '../components/icons/ShareIcon';
import LogIcon from '../components/icons/LogIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';
import BrainIcon from '../components/icons/BrainIcon';
import TargetIcon from '../components/icons/TargetIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';

type AdminTab = 'user' | 'comprehensive';

const initialAnalysesState: AnalysesState = {
  trajectory: { status: 'idle', data: null, error: null },
  skillMatching: { status: 'idle', data: null, error: null },
  hiddenPotential: { status: 'idle', data: null, error: null },
};


const UserManagementPanel: React.FC<{
    allUsers: UserInfo[],
    selectedUserId: string | null,
    onUserSelect: (userId: string) => void,
    conversationsByUser: Record<string, StoredConversation[]>,
}> = ({ allUsers, selectedUserId, onUserSelect, conversationsByUser }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-2">相談者一覧 ({allUsers.length}名)</h2>
        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {allUsers.map(user => (
                <button key={user.id} onClick={() => onUserSelect(user.id)} className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${selectedUserId === user.id ? 'bg-sky-100 ring-2 ring-sky-500' : 'hover:bg-slate-100'}`}>
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
);


const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('user');
    const [allConversations, setAllConversations] = useState<StoredConversation[]>([]);
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
    const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
    const [userToShare, setUserToShare] = useState<UserInfo | null>(null);
    const [isDevLogModalOpen, setIsDevLogModalOpen] = useState(false);
    const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);
    const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

    const [analysesState, setAnalysesState] = useState<AnalysesState>(initialAnalysesState);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    const loadData = () => {
        const users = userService.getUsers();
        setAllUsers(users);

        const allDataRaw = localStorage.getItem('careerConsultations');
        if (allDataRaw) {
            try {
                const parsed = JSON.parse(allDataRaw) as StoredData | StoredConversation[];
                const conversations = ('data' in parsed && Array.isArray(parsed.data)) ? parsed.data : Array.isArray(parsed) ? parsed : [];
                setAllConversations(conversations);
            } catch (e) { console.error("Failed to parse conversations", e); setAllConversations([]); }
        } else {
            setAllConversations([]);
        }

        if (users.length > 0 && !users.some(u => u.id === selectedUserId)) {
            setSelectedUserId(users[0]?.id || null);
        }
    };

    useEffect(loadData, []);
    
    useEffect(() => {
        setAnalysesState(initialAnalysesState);
    }, [selectedUserId]);

    // Close actions menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setIsActionsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const conversationsByUser = useMemo(() => {
        return allConversations.reduce<Record<string, StoredConversation[]>>((acc, conv) => {
            if (!acc[conv.userId]) acc[conv.userId] = [];
            acc[conv.userId].push(conv);
            return acc;
        }, {});
    }, [allConversations]);

    const handleImportClick = () => fileInputRef.current?.click();

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text.");
                const importedData = JSON.parse(text) as StoredData;
                if (importedData.version !== STORAGE_VERSION || !Array.isArray(importedData.data)) throw new Error("Invalid data format or version mismatch.");
                const existingIds = new Set(allConversations.map(c => c.id));
                const newConversations = importedData.data.filter(c => !existingIds.has(c.id));
                const updatedConversations = [...allConversations, ...newConversations];
                localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updatedConversations }));
                alert(`${newConversations.length}件の新しい相談履歴がインポートされました。`);
                loadData();
            } catch (error) {
                alert(`インポートに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
            } finally {
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };
    
    const handleRunAnalysis = async (type: AnalysisType, conversations: StoredConversation[], userId: string) => {
      if (conversations.length === 0) {
          alert("分析には少なくとも1件の相談履歴が必要です。");
          return;
      }

      setAnalysesState(prev => ({
        ...prev,
        [type]: { status: 'loading', data: prev[type].data, error: null }
      }));
      
      if (type === 'skillMatching') {
        setIsMatchingModalOpen(true);
      }
      
      try {
          let result;
          if (type === 'trajectory') result = await analyzeTrajectory(conversations, userId);
          else if (type === 'skillMatching') result = await performSkillMatching(conversations);
          else if (type === 'hiddenPotential') result = await findHiddenPotential(conversations, userId);
          
          setAnalysesState(prev => ({
            ...prev,
            [type]: { status: 'success', data: result, error: null }
          }));

      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
          console.error(`Analysis failed for ${type}:`, errorMessage);
          setAnalysesState(prev => ({
            ...prev,
            [type]: { status: 'error', data: prev[type].data, error: errorMessage }
          }));
      }
    };

    const handleClearAllData = () => {
        if (window.confirm("本当にすべてのユーザーと相談履歴を削除しますか？この操作は元に戻せません。")) {
            localStorage.removeItem('careerConsultations');
            localStorage.removeItem('careerConsultingUsers_v1');
            devLogService.clearLogs();
            setAllConversations([]);
            setAllUsers([]);
            setSelectedUserId(null);
            alert("すべてのデータが削除されました。");
        }
    };

    const handleClearUserData = (userId: string) => {
        const user = allUsers.find(u => u.id === userId);
        if (window.confirm(`本当に「${user?.nickname}」のすべての相談履歴 (${conversationsByUser[userId]?.length || 0}件) を削除しますか？`)) {
            const updatedConversations = allConversations.filter(c => c.userId !== userId);
            localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updatedConversations }));
            alert(`「${user?.nickname}」のデータが削除されました。`);
            loadData();
        }
    };
    
    const handleAddTextSubmit = (newConversation: StoredConversation) => {
        const updatedConversations = [...allConversations, newConversation];
        localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updatedConversations }));
        if (!allUsers.some(u => u.id === newConversation.userId)) {
            userService.saveUsers([...allUsers, { id: newConversation.userId, nickname: ` imported_${newConversation.userId}`, pin: '0000'}]);
        }
        loadData();
        setIsAddTextModalOpen(false);
        setSelectedUserId(newConversation.userId);
        alert('テキストから新しい相談履歴が追加されました。');
    };
    
    const selectedUserConversations = selectedUserId ? (conversationsByUser[selectedUserId] || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
    const isAnyAnalysisLoading = Object.values(analysesState).some(s => s.status === 'loading');
    
    const convertStateToCacheForReport = (state: AnalysesState): UserAnalysisCache => {
        const cache: UserAnalysisCache = {};
        
        if (state.trajectory.status === 'success' && state.trajectory.data) {
            cache.trajectory = state.trajectory.data;
        } else if (state.trajectory.status === 'error' && state.trajectory.error) {
            cache.trajectory = { error: state.trajectory.error };
        }

        if (state.skillMatching.status === 'success' && state.skillMatching.data) {
            cache.skillMatching = state.skillMatching.data;
        } else if (state.skillMatching.status === 'error' && state.skillMatching.error) {
            cache.skillMatching = { error: state.skillMatching.error };
        }

        if (state.hiddenPotential.status === 'success' && state.hiddenPotential.data) {
            cache.hiddenPotential = state.hiddenPotential.data;
        } else if (state.hiddenPotential.status === 'error' && state.hiddenPotential.error) {
            cache.hiddenPotential = { error: state.hiddenPotential.error };
        }
        
        return cache;
    };


    const TabButton: React.FC<{ tabId: AdminTab; children: React.ReactNode }> = ({ tabId, children }) => (
        <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tabId ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>
    );
    
    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-2xl border border-slate-200 my-4 md:my-6 min-h-[80vh]">
            <header className="pb-4 border-b border-slate-200 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h1>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                        <TabButton tabId="user">ユーザー別分析</TabButton>
                        <TabButton tabId="comprehensive">総合分析</TabButton>
                    </div>
                </div>
            </header>

            {activeTab === 'user' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <aside className="lg:col-span-4 space-y-4">
                       <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                            <h3 className="text-md font-bold text-slate-700">アクション</h3>
                            <div className="flex gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                                <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 transition-all text-sm"><ImportIcon /> インポート</button>
                                <button onClick={() => setIsAddTextModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-600 transition-all text-sm"><PlusCircleIcon /> テキスト追加</button>
                            </div>
                            <div className="relative" ref={actionsMenuRef}>
                                <button onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-all text-sm">
                                    その他アクション <ChevronDownIcon className="w-4 h-4" />
                                </button>
                                {isActionsMenuOpen && (
                                    <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border z-10">
                                        <button onClick={() => { setIsPasswordChangeModalOpen(true); setIsActionsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 rounded-t-lg"><KeyIcon /> パスワード変更</button>
                                        <button onClick={() => { setIsDevLogModalOpen(true); setIsActionsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"><LogIcon /> 開発ログ表示</button>
                                        <button onClick={() => { handleClearAllData(); setIsActionsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-b-lg"><TrashIcon /> 全データ削除</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <UserManagementPanel allUsers={allUsers} selectedUserId={selectedUserId} onUserSelect={setSelectedUserId} conversationsByUser={conversationsByUser} />
                    </aside>

                    <main className="lg:col-span-8">
                        {selectedUserId && allUsers.find(u => u.id === selectedUserId) ? (
                           <div className="bg-slate-50 rounded-lg border border-slate-200 h-full flex flex-col">
                                <div className="p-4 border-b border-slate-200">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 truncate" title={allUsers.find(u => u.id === selectedUserId)?.nickname}>{allUsers.find(u => u.id === selectedUserId)?.nickname} のデータ</h2>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setUserToShare(allUsers.find(u => u.id === selectedUserId) || null)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"><ShareIcon /> レポート共有</button>
                                            <button onClick={() => handleClearUserData(selectedUserId)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"><TrashIcon /> データ削除</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {(['trajectory', 'skillMatching', 'hiddenPotential'] as AnalysisType[]).map(type => (
                                            <button key={type} onClick={() => handleRunAnalysis(type, selectedUserConversations, selectedUserId)} disabled={isAnyAnalysisLoading || selectedUserConversations.length === 0} className="relative group flex items-center justify-center gap-2 p-2 text-sm font-semibold rounded-md transition-colors bg-white border hover:bg-slate-100 disabled:bg-slate-200 disabled:cursor-not-allowed">
                                                {analysesState[type].status === 'loading' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-md">
                                                        <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                {type === 'trajectory' ? <TrajectoryIcon /> : type === 'skillMatching' ? <TargetIcon /> : <BrainIcon />}
                                                <span>{type === 'trajectory' ? '相談の軌跡' : type === 'skillMatching' ? '適性診断' : '隠れた可能性'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-1 overflow-y-auto">
                                    <AnalysisDisplay 
                                        trajectoryState={analysesState.trajectory}
                                        hiddenPotentialState={analysesState.hiddenPotential}
                                    />
                                </div>

                                <div className="p-4 border-t border-slate-200 bg-slate-100 max-h-48 overflow-y-auto">
                                    <h3 className="font-bold text-slate-700 mb-2">相談履歴 ({selectedUserConversations.length}件)</h3>
                                    <div className="space-y-1">
                                        {selectedUserConversations.map(conv => (
                                            <button key={conv.id} onClick={() => setSelectedConversation(conv)} className="w-full text-left p-2 rounded-md hover:bg-slate-200 text-xs flex justify-between items-center">
                                                <span>{new Date(conv.date).toLocaleString('ja-JP')} - {conv.aiName}</span>
                                                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${conv.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{conv.status === 'completed' ? '完了' : '中断'}</span>
                                            </button>
                                        ))}
                                        {selectedUserConversations.length === 0 && <p className="text-xs text-slate-500 text-center py-2">このユーザーの相談履歴はありません。</p>}
                                    </div>
                                </div>
                           </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                                <UserIcon />
                                <h2 className="mt-2 font-semibold">相談者を選択してください</h2>
                                <p className="text-sm">左のリストから分析したい相談者を選択できます。</p>
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <AnalysisDashboard conversations={allConversations} />
            )}
            
            {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
            <AddTextModal isOpen={isAddTextModalOpen} onClose={() => setIsAddTextModalOpen(false)} onSubmit={handleAddTextSubmit} existingUserIds={allUsers.map(u => u.id)} />
            {userToShare && <ShareReportModal isOpen={!!userToShare} onClose={() => setUserToShare(null)} userId={userToShare.id} conversations={conversationsByUser[userToShare.id] || []} analysisCache={convertStateToCacheForReport(analysesState)} />}
            <DevLogModal isOpen={isDevLogModalOpen} onClose={() => setIsDevLogModalOpen(false)} />
            <SkillMatchingModal 
                isOpen={isMatchingModalOpen} 
                onClose={() => {
                    setIsMatchingModalOpen(false);
                    if (analysesState.skillMatching.status === 'loading') {
                       setAnalysesState(prev => ({...prev, skillMatching: {...prev.skillMatching, status: 'idle'} }));
                    }
                }}
                analysisState={analysesState.skillMatching}
            />
            <PasswordChangeModal 
                isOpen={isPasswordChangeModalOpen} 
                onClose={() => setIsPasswordChangeModalOpen(false)} 
            />
        </div>
    );
};

export default AdminView;
