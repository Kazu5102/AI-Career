import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StoredConversation, StoredData, STORAGE_VERSION, AnalysisData, AIAssistant, UserAnalysisCache, TrajectoryAnalysisData, SkillMatchingResult, HiddenPotentialData } from '../types';
import { analyzeConversations, generateSummaryFromText, analyzeTrajectory, performSkillMatching, findHiddenPotential } from '../services/index';
import { setPassword } from '../services/authService';
import ConversationDetailModal from '../components/ConversationDetailModal';
import AnalysisDisplay from '../components/AnalysisDisplay';
import AddTextModal from '../components/AddTextModal';
import ShareReportModal from '../components/ShareReportModal';
import AnalyticsIcon from '../components/icons/AnalyticsIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ImportIcon from '../components/icons/ImportIcon';
import ExportIcon from '../components/icons/ExportIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import KeyIcon from '../components/icons/KeyIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import ShareIcon from '../components/icons/ShareIcon';
import { ASSISTANTS } from '../config/aiAssistants';
import BrainIcon from '../components/icons/BrainIcon';

interface GroupedConversations {
    [userId: string]: StoredConversation[];
}

const comprehensiveLoadingMessages = [
    'AIが総合分析を開始しました...',
    '全相談データを読み込んでいます...',
    '全体の傾向を抽出中です。これには数分かかる場合があります。',
    'インサイトをまとめています...',
    'レポートを生成しています。もうしばらくお待ちください。'
];

type AnalysisType = 'trajectory' | 'skillMatching' | 'hiddenPotential';
type AnalysisStatus = 'idle' | 'loading' | 'error';
type IndividualAnalysisState = {
    [key in AnalysisType]?: AnalysisStatus;
};

const AdminView: React.FC = () => {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [userAnalysesCache, setUserAnalysesCache] = useState<Record<string, UserAnalysisCache>>({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [individualAnalysisStates, setIndividualAnalysisStates] = useState<Record<string, IndividualAnalysisState>>({});
  
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [analyzedUserId, setAnalyzedUserId] = useState<string | null>(null);
  
  const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userToShare, setUserToShare] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Load initial data from localStorage
  useEffect(() => {
    // Load conversations
    const storedDataRaw = localStorage.getItem('careerConsultations');
    if (storedDataRaw) {
        // ... (existing conversation loading logic remains the same)
        let loadedConversations: StoredConversation[] = [];
        let needsResave = false;

        try {
            const parsedData = JSON.parse(storedDataRaw);
            let dataToProcess: any[] | null = null;
            if (parsedData && typeof parsedData === 'object' && 'version' in parsedData && Array.isArray(parsedData.data)) {
                dataToProcess = parsedData.data;
            } else if (Array.isArray(parsedData)) {
                dataToProcess = parsedData;
                needsResave = true;
            }
            if (dataToProcess) {
                loadedConversations = dataToProcess.map(conv => ({...conv, status: conv.status || 'completed'}));
                setConversations(loadedConversations);
                if (needsResave) {
                    const dataToStore: StoredData = { version: STORAGE_VERSION, data: loadedConversations };
                    localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
                }
            }
        } catch (e) {
            console.error("Failed to load conversations", e);
        }
    }
    
    // Load analysis cache
    const cachedAnalysesRaw = localStorage.getItem('userAnalysesCache');
    if (cachedAnalysesRaw) {
        try {
            setUserAnalysesCache(JSON.parse(cachedAnalysesRaw));
        } catch (e) {
            console.error("Failed to load user analyses cache", e);
        }
    }
  }, []);
  
  const isAnyIndividualAnalysisLoading = Object.values(individualAnalysisStates).some(userState => 
    Object.values(userState).some(status => status === 'loading')
  );
  const isAnalyzingAnything = isAnalyzing || isAnyIndividualAnalysisLoading || isImporting;
  
  // Update loading message for comprehensive analysis
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAnalyzing) {
        let messageIndex = 0;
        setLoadingMessage(comprehensiveLoadingMessages[messageIndex]);
        interval = setInterval(() => {
            messageIndex = (messageIndex + 1) % comprehensiveLoadingMessages.length;
            setLoadingMessage(comprehensiveLoadingMessages[messageIndex]);
        }, 4000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isAnalyzing]);

  const groupedConversations = useMemo<GroupedConversations>(() => {
    return conversations.reduce((acc, conv) => {
        const userId = conv.userId || `user_unknown_${conv.id}`;
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(conv);
        return acc;
    }, {} as GroupedConversations);
  }, [conversations]);

  Object.values(groupedConversations).forEach(group => {
      group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  const handleRunAnalysis = async () => {
    if (conversations.length < 2) {
      alert("分析には少なくとも2件の相談履歴が必要です。");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisData(null);
    setAnalyzedUserId(null);
    setError(null);
    try {
      const result = await analyzeConversations(conversations);
      setAnalysisData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(`分析中にエラーが発生しました: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleRunIndividualAnalysis = async (userId: string, type: AnalysisType) => {
    const userConvs = groupedConversations[userId];
    if (!userConvs || userConvs.length === 0) {
        alert("このユーザーには分析可能な相談履歴がありません。");
        return;
    }
    
    setIndividualAnalysisStates(prev => ({
        ...prev,
        [userId]: { ...prev[userId], [type]: 'loading' }
    }));
    setAnalyzedUserId(userId);
    setError(null);
    setAnalysisData(null);
    
    try {
        let result: TrajectoryAnalysisData | SkillMatchingResult | HiddenPotentialData;
        let cacheKey: keyof UserAnalysisCache;

        switch (type) {
            case 'trajectory':
                result = await analyzeTrajectory(userConvs, userId);
                cacheKey = 'trajectory';
                break;
            case 'skillMatching':
                result = await performSkillMatching(userConvs);
                cacheKey = 'skillMatching';
                break;
            case 'hiddenPotential':
                result = await findHiddenPotential(userConvs, userId);
                cacheKey = 'hiddenPotential';
                break;
        }

        const updatedCache = {
            ...userAnalysesCache,
            [userId]: {
                ...userAnalysesCache[userId],
                [cacheKey]: result
            }
        };
        setUserAnalysesCache(updatedCache);
        localStorage.setItem('userAnalysesCache', JSON.stringify(updatedCache));
        
        setIndividualAnalysisStates(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [type]: 'idle' }
        }));
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "不明なエラー";
        setError(`「${type}」分析中にエラーが発生しました: ${errorMessage}`);
        setIndividualAnalysisStates(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [type]: 'error' }
        }));
    }
  };

  const handleShowUserAnalysis = (userId: string) => {
      setAnalyzedUserId(userId);
      setAnalysisData(null);
      setError(null);
  }
  
  const handleBackToComprehensive = () => {
      setAnalyzedUserId(null);
      setError(null);
  };
  
  const updateConversations = (newConversations: StoredConversation[]) => {
      setConversations(newConversations);
      const dataToStore: StoredData = { version: STORAGE_VERSION, data: newConversations };
      localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
      setAnalysisData(null);
      setAnalyzedUserId(null);
      setError(null);
  }

  const handleDeleteConversation = (id: number) => {
    if (window.confirm("この相談履歴を本当に削除しますか？この操作は取り消せません。")) {
        updateConversations(conversations.filter(c => c.id !== id));
    }
  };

  const handleDeleteAllConversations = () => {
    if (window.confirm("【警告】すべての相談履歴を本当に削除しますか？この操作は取り消せません。")) {
        updateConversations([]);
        localStorage.removeItem('userAnalysesCache'); // Also clear cache
        setUserAnalysesCache({});
    }
  };

  const handleExport = () => {
      // ... (existing export logic)
  };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      // ... (existing file change logic)
  };
  const processImportedFile = async (content: string) => {
      // ... (existing import processing logic)
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const toggleUserGroup = (userId: string) => {
    setExpandedUsers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) newSet.delete(userId);
        else newSet.add(userId);
        return newSet;
    });
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
      // ... (existing password change logic)
  };

   const handleAddFromText = (newConversation: StoredConversation) => {
      updateConversations([...conversations, newConversation]);
      setIsAddTextModalOpen(false);
      alert(`相談者ID: ${newConversation.userId} に新しい履歴が追加されました。`);
    };

    const handleShareReport = (userId: string) => {
        setUserToShare(userId);
        setIsShareModalOpen(true);
    };

  const AnalysisToolkit: React.FC<{userId: string}> = ({userId}) => {
    const analysisState = individualAnalysisStates[userId] || {};
    const cache = userAnalysesCache[userId] || {};

    const getButtonText = (type: AnalysisType) => {
        if (analysisState[type] === 'loading') return '分析中...';
        return cache[type] ? '再分析' : '分析実行';
    }

    return (
        <div className="p-2 border-t border-slate-200 bg-white space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <button
                    onClick={() => handleRunIndividualAnalysis(userId, 'trajectory')}
                    disabled={isAnalyzingAnything}
                    className="flex items-center justify-between text-left px-3 py-1.5 bg-sky-100 text-sky-700 font-semibold rounded-md hover:bg-sky-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    <span>{cache.trajectory && '✅ '}相談の軌跡</span>
                    <span>{getButtonText('trajectory')}</span>
                </button>
                 <button
                    onClick={() => handleRunIndividualAnalysis(userId, 'skillMatching')}
                    disabled={isAnalyzingAnything}
                    className="flex items-center justify-between text-left px-3 py-1.5 bg-sky-100 text-sky-700 font-semibold rounded-md hover:bg-sky-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    <span>{cache.skillMatching && '✅ '}適性診断</span>
                    <span>{getButtonText('skillMatching')}</span>
                </button>
            </div>
             <button
                onClick={() => handleRunIndividualAnalysis(userId, 'hiddenPotential')}
                disabled={isAnalyzingAnything}
                className="w-full flex items-center justify-between text-left text-sm px-3 py-1.5 bg-amber-100 text-amber-700 font-semibold rounded-md hover:bg-amber-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
                <span className="flex items-center gap-1.5"><BrainIcon className="w-4 h-4" />{cache.hiddenPotential && '✅ '}隠れた可能性</span>
                <span>{getButtonText('hiddenPotential')}</span>
            </button>
             <div className="pt-2 flex gap-2">
                <button
                    onClick={() => handleShowUserAnalysis(userId)}
                    disabled={!userAnalysesCache[userId]}
                    className="w-full text-sm text-center px-3 py-1.5 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    分析結果を見る
                </button>
                <button
                    onClick={() => handleShareReport(userId)}
                    disabled={isAnalyzingAnything}
                    className="w-full text-sm text-center px-3 py-1.5 bg-emerald-100 text-emerald-700 font-semibold rounded-md hover:bg-emerald-200 transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                    <ShareIcon className="w-4 h-4" />
                    共有レポート
                </button>
            </div>
        </div>
    )
  }
    
  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.txt,.md" style={{ display: 'none' }} disabled={isImporting} />
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-6 lg:h-full lg:overflow-hidden">
        {/* Left Panel */}
        <aside className="w-full lg:w-1/3 flex flex-col lg:border-r lg:border-slate-200 lg:pr-6">
          <div className="flex-1 overflow-y-auto -mr-6 pr-6 space-y-6 lg:max-h-none">
            {/* User History Section */}
            <section>
                <h2 className="text-lg font-bold text-slate-800 mb-4">相談者ごとの履歴 ({Object.keys(groupedConversations).length}名)</h2>
                <div className="space-y-2">
                    {Object.keys(groupedConversations).length > 0 ? (
                        Object.entries(groupedConversations).map(([userId, userConvs]) => (
                        <div key={userId} className="rounded-lg bg-slate-50 overflow-hidden border border-slate-200">
                            <button onClick={() => toggleUserGroup(userId)} className="w-full flex justify-between items-center text-left p-3 hover:bg-slate-100 transition-colors">
                                {/* ... user group header ... */}
                                <div className="flex-1 overflow-hidden pr-2">
                                    <p className="font-semibold text-slate-800 text-sm truncate">{userId}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{userConvs.length}件</span>
                                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${expandedUsers.has(userId) ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {expandedUsers.has(userId) && (
                                <>
                                    <div className="p-2 border-t border-slate-200 bg-white/50 space-y-1 max-h-48 overflow-y-auto">
                                    {userConvs.map(conv => (
                                        <div key={conv.id} className="group relative w-full text-left p-2 rounded-lg hover:bg-slate-100 focus-within:ring-2 focus-within:ring-sky-500">
                                            <div onClick={() => setSelectedConversation(conv)} className="cursor-pointer pr-8">
                                                <p className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                                    {formatDate(conv.date)}
                                                    {conv.status === 'interrupted' && <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">[中断]</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">担当: {conv.aiName}</p>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} className="absolute top-1/2 -translate-y-1/2 right-1 p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    </div>
                                    <AnalysisToolkit userId={userId} />
                                </>
                            )}
                        </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-500 p-4 rounded-lg bg-slate-50">
                            <p>保存された相談履歴はありません。</p>
                        </div>
                    )}
                </div>
            </section>
            
            {/* Other sections like AI Assistant management... */}
          </div>
           {/* Bottom control panel */}
          <div className="mt-auto pt-4 border-t border-slate-200 space-y-3">
             {/* ... Data Management and Security Settings sections ... */}
          </div>
        </aside>

        {/* Right Panel: Analysis */}
        <main className="w-full lg:w-2/3 flex flex-col mt-6 lg:mt-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
             <div>
                <h2 className="text-lg font-bold text-slate-800">
                    {analyzedUserId ? '個別分析レポート' : '総合分析レポート'}
                </h2>
                {analyzedUserId && <p className="text-sm text-slate-500 truncate" title={analyzedUserId}>相談者ID: {analyzedUserId}</p>}
            </div>
             {analyzedUserId ? (
                <button onClick={handleBackToComprehensive} disabled={isAnalyzingAnything} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700">
                    総合分析に戻る
                </button>
            ) : (
                <button onClick={handleRunAnalysis} disabled={isAnalyzingAnything || conversations.length < 2} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:bg-slate-400">
                    <AnalyticsIcon />
                    {isAnalyzing ? '分析中...' : '総合分析を実行'}
                </button>
            )}
          </div>
          <div className="flex-1 bg-slate-50 rounded-lg p-6 overflow-y-auto">
              {(isAnalyzing || isImporting) ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-semibold">{isImporting ? 'インポート処理中...' : loadingMessage}</p>
                  </div>
              ) : error ? (
                  <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg">分析エラー</h3>
                      <p className="mt-1">{error}</p>
                      <button onClick={analyzedUserId ? () => setAnalyzedUserId(null) : () => setError(null)} className="mt-4 px-3 py-1 bg-red-100 rounded-md">閉じる</button>
                  </div>
              ) : analyzedUserId ? (
                  <AnalysisDisplay cache={userAnalysesCache[analyzedUserId]} />
              ) : analysisData ? (
                  <AnalysisDisplay cache={{ comprehensive: analysisData }} />
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                      <AnalyticsIcon className="w-12 h-12 text-slate-400 mb-4" />
                      <h3 className="font-semibold text-lg">全体の傾向を分析します</h3>
                      <p className="mt-1">「総合分析を実行」ボタンを押すか、<br />左のリストから特定の相談者を選択して分析を開始してください。</p>
                  </div>
              )}
          </div>
        </main>
      </div>

      {selectedConversation && (
        <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />
      )}

      <AddTextModal isOpen={isAddTextModalOpen} onClose={() => setIsAddTextModalOpen(false)} onSubmit={handleAddFromText} existingUserIds={Object.keys(groupedConversations)} />

      {userToShare && (
        <ShareReportModal
          isOpen={isShareModalOpen}
          onClose={() => { setIsShareModalOpen(false); setUserToShare(null); }}
          userId={userToShare}
          // FIX: The 'conversations' prop was missing. Passing the specific user's conversations.
          conversations={groupedConversations[userToShare] || []}
          cache={userAnalysesCache[userToShare]}
        />
      )}

    </>
  );
};

export default AdminView;