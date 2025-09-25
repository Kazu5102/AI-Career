
import React, { useState, useCallback, useEffect } from 'react';
import { ChatMessage, MessageAuthor, StoredConversation, StoredData, STORAGE_VERSION, AIType } from '../types';
import { getStreamingChatResponse, generateSummary, reviseSummary } from '../services/index';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import SummaryModal from '../components/SummaryModal';
import InterruptModal from '../components/InterruptModal';
import AIAvatar from '../components/AIAvatar';
import AvatarSelectionView from './AvatarSelectionView';
import UserDashboard from '../components/UserDashboard';
import ActionFooter from '../components/ActionFooter';
import { ASSISTANTS } from '../config/aiAssistants';

interface UserViewProps {
  userId: string;
  onSwitchUser: () => void;
}

type UserViewMode = 'loading' | 'dashboard' | 'avatarSelection' | 'chatting';

const UserView: React.FC<UserViewProps> = ({ userId, onSwitchUser }) => {
  const [view, setView] = useState<UserViewMode>('loading');
  const [userConversations, setUserConversations] = useState<StoredConversation[]>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConsultationReady, setIsConsultationReady] = useState<boolean>(false);
  const [aiName, setAiName] = useState<string>('');
  const [aiType, setAiType] = useState<AIType>('dog');
  const [aiAvatarKey, setAiAvatarKey] = useState<string>('');
  const [editingState, setEditingState] = useState<{ index: number; text: string } | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isInterruptModalOpen, setIsInterruptModalOpen] = useState<boolean>(false);
  const [resumingConversationId, setResumingConversationId] = useState<number | null>(null);


  useEffect(() => {
    const allDataRaw = localStorage.getItem('careerConsultations');
    let convs: StoredConversation[] = [];
    if (allDataRaw) {
        try {
            const parsed = JSON.parse(allDataRaw);
            let allConversations: StoredConversation[] = [];

            if (parsed && parsed.data && Array.isArray(parsed.data)) {
                allConversations = parsed.data;
            } 
            else if (Array.isArray(parsed)) {
                allConversations = parsed;
            }
            
            if (allConversations.length > 0) {
                 const userConvs = allConversations.filter(c => c.userId === userId);
                 convs = userConvs.map(c => ({...c, status: c.status || 'completed'}));
            }
        } catch(e) {
            console.error("Failed to parse conversations from localStorage in UserView", e);
        }
    }
    setUserConversations(convs);
    setView(convs.length > 0 ? 'dashboard' : 'avatarSelection');
  }, [userId]);

  const saveConversations = (allConversations: StoredConversation[]) => {
      const dataToStore: StoredData = {
          version: STORAGE_VERSION,
          data: allConversations,
      };
      localStorage.setItem('careerConsultations', JSON.stringify(dataToStore));
  };


  const handleNewChat = useCallback(() => {
    setResumingConversationId(null);
    setMessages([]);
    setView('avatarSelection');
  }, []);

  const handleAvatarSelected = useCallback((selection: { type: AIType, avatarKey: string }) => {
    const { type, avatarKey } = selection;
    const assistant = ASSISTANTS.find(a => a.id === avatarKey);
    if (!assistant) {
      console.error("Selected assistant not found in config");
      return;
    }

    setAiType(type);
    setAiAvatarKey(avatarKey);

    const names = assistant.nameOptions;
    const selectedName = names[Math.floor(Math.random() * names.length)];
    setAiName(selectedName);
    
    // AI no longer asks for the user's name. This is handled by the application now.
    let greetingText = '';
    if (type === 'human') {
      greetingText = `こんにちは。AIキャリアコンサルタントの${selectedName}です。本日はどのようなご相談でしょうか？あなたのキャリアについて、じっくりお話を伺わせてください。`;
    } else { // dog
      greetingText = `ワンワン！はじめまして！ボク、キャリア相談わんこの${selectedName}だワン！キミのキャリアの悩み、何でもクンクン嗅ぎつけて、一緒に考えてワン！元気いっぱい、最後まで応援するから安心してね！`;
    }
    
    const greetingMessage: ChatMessage = { author: MessageAuthor.AI, text: greetingText };
    setMessages([greetingMessage]);

    // Application asks for the user's name after a short delay
    setTimeout(() => {
      const questions = type === 'human'
        ? ["差し支えなければ、どのようにお呼びすればよろしいですか？", "今後のため、お名前の呼び方を教えていただけますか？"]
        : ["キミのこと、なんて呼んだらいいかな？", "よかったら、キミの呼び名を教えてくれるワン？"];
      const questionText = questions[Math.floor(Math.random() * questions.length)];
      const questionMessage: ChatMessage = { author: MessageAuthor.AI, text: questionText };
      setMessages(prev => [...prev, questionMessage]);
    }, 1200);

    setIsConsultationReady(false);
    setEditingState(null);
    setIsLoading(false);
    setView('chatting');
  }, []);
  
  const handleBackToDashboard = () => {
    if (messages.length > 1 && !isLoading) {
       setIsInterruptModalOpen(true);
    } else {
        setView('dashboard');
        setMessages([]);
        setResumingConversationId(null);
    }
  };

  const handleStartEdit = (index: number) => {
    const messageToEdit = messages[index];
    if (messageToEdit.author === MessageAuthor.USER) {
        setEditingState({ index, text: messageToEdit.text });
    }
  };

  const handleCancelEdit = () => {
      setEditingState(null);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let currentMessages: ChatMessage[];
    
    if (editingState) {
        const { index } = editingState;
        currentMessages = messages.slice(0, index);
        currentMessages.push({ author: MessageAuthor.USER, text });
        setEditingState(null);
    } else {
        const userMessage: ChatMessage = { author: MessageAuthor.USER, text };
        currentMessages = [...messages, userMessage];
    }

    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const stream = await getStreamingChatResponse(currentMessages, aiType, aiName);
      if (!stream) {
          throw new Error("ストリームの取得に失敗しました。");
      }
      
      let aiResponse = '';
      setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '' }]);

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          aiResponse += decoder.decode(value, { stream: true });
          setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: aiResponse };
              return newMessages;
          });
      }
      
      if (currentMessages.filter(m => m.author === MessageAuthor.USER).length >= 2) {
        setIsConsultationReady(true);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        author: MessageAuthor.AI,
        text: "申し訳ありません、エラーが発生しました。もう一度お試しください。"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    generateSummary(messages, aiType, aiName)
      .then(summaryText => setSummary(summaryText))
      .catch(error => {
        console.error("Failed to generate summary:", error);
        setSummary("サマリーの生成中にエラーが発生しました。時間をおいて再度お試しください。");
      })
      .finally(() => setIsSummaryLoading(false));
  };

  const handleReviseSummary = (correctionRequest: string) => {
    if (!correctionRequest.trim() || !summary) return;
    setIsSummaryLoading(true);
    reviseSummary(summary, correctionRequest)
        .then(revisedSummaryText => setSummary(revisedSummaryText))
        .catch(error => {
            console.error("Failed to revise summary:", error);
            alert("サマリーの修正中にエラーが発生しました。");
        })
        .finally(() => setIsSummaryLoading(false));
  };
  
  const finalizeAndSave = (conversation: StoredConversation) => {
      try {
        const storedDataRaw = localStorage.getItem('careerConsultations');
        let currentAllConversations: StoredConversation[] = [];
        if (storedDataRaw) {
            const parsed = JSON.parse(storedDataRaw);
            if (parsed.data && Array.isArray(parsed.data)) {
                currentAllConversations = parsed.data;
            } else if (Array.isArray(parsed)) {
                currentAllConversations = parsed;
            }
        }
        
        let updatedAllConversations: StoredConversation[];
        if(resumingConversationId) {
            updatedAllConversations = currentAllConversations.map(c => 
                c.id === resumingConversationId ? conversation : c
            );
        } else {
            updatedAllConversations = [...currentAllConversations, conversation];
        }

        saveConversations(updatedAllConversations);
        
        const userConvs = updatedAllConversations.filter(c => c.userId === userId)
            .map(c => ({...c, status: c.status || 'completed'}));

        setUserConversations(userConvs);
        setView('dashboard');
        
        setMessages([]);
        setSummary('');
        setResumingConversationId(null);
        
        return true;
      } catch (error) {
        console.error("Failed to save conversation:", error);
        alert("相談内容の保存に失敗しました。");
        return false;
      }
  };

  const handleFinalizeAndSave = () => {
    if (summary && !summary.includes("エラーが発生しました")) {
      const newConversation: StoredConversation = {
        id: resumingConversationId || Date.now(),
        userId: userId,
        aiName,
        aiType,
        aiAvatar: aiAvatarKey,
        messages,
        summary: summary,
        date: new Date().toISOString(),
        status: 'completed',
      };
      
      const success = finalizeAndSave(newConversation);
      if(success) {
          setIsSummaryModalOpen(false);
          alert('相談内容が保存されました。');
      }
    } else {
        setIsSummaryModalOpen(false);
    }
  };

  const handleCloseSummaryModal = () => {
    setIsSummaryModalOpen(false);
  }

  // --- Interrupt Handlers ---
  const handleInterruptClick = () => {
      if (!isLoading) {
          setIsInterruptModalOpen(true);
      }
  };
  
  const handleContinueConversation = () => {
      setIsInterruptModalOpen(false);
  };
  
  const handleExitWithoutSaving = () => {
      setIsInterruptModalOpen(false);
      setView('dashboard');
      setMessages([]);
      setResumingConversationId(null);
  };
  
  const handleSaveAndInterrupt = () => {
    const interimSummary = `## 相談中断\n\n- **中断日時:** ${new Date().toLocaleString('ja-JP')}\n- **対話の要点:** (AIによる自動要約は行われていません)`;

    const newConversation: StoredConversation = {
        id: resumingConversationId || Date.now(),
        userId: userId,
        aiName,
        aiType,
        aiAvatar: aiAvatarKey,
        messages,
        summary: interimSummary,
        date: new Date().toISOString(),
        status: 'interrupted',
    };
    
    const success = finalizeAndSave(newConversation);
    if(success) {
        setIsInterruptModalOpen(false);
        alert('中断した相談内容が保存されました。');
    }
  };
  
  const handleResumeConversation = (conversationToResume: StoredConversation) => {
    setMessages(conversationToResume.messages);
    setAiName(conversationToResume.aiName);
    setAiType(conversationToResume.aiType);
    setAiAvatarKey(conversationToResume.aiAvatar);
    setResumingConversationId(conversationToResume.id);
    setIsConsultationReady(conversationToResume.messages.filter(m => m.author === MessageAuthor.USER).length >= 2);
    setView('chatting');
  };


  const renderContent = () => {
    switch(view) {
      case 'loading':
          return <div className="text-slate-500">読み込み中...</div>;
      case 'dashboard':
          return <UserDashboard 
                    conversations={userConversations} 
                    onNewChat={handleNewChat}
                    onResume={handleResumeConversation} 
                    userId={userId}
                    onSwitchUser={onSwitchUser}
                 />;
      case 'avatarSelection':
        return <AvatarSelectionView onSelect={handleAvatarSelected} />;
      case 'chatting':
        return (
           <div className="w-full max-w-7xl h-full flex flex-row gap-6">
            <div className="hidden lg:flex w-[400px] h-full flex-shrink-0">
              <AIAvatar avatarKey={aiAvatarKey} aiName={aiName} isLoading={isLoading} />
            </div>
            <div className="flex-1 h-full flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <ChatWindow 
                  messages={messages} 
                  isLoading={isLoading} 
                  onEditMessage={handleStartEdit}
              />
              <div className="flex-shrink-0 flex flex-col bg-white border-t border-slate-200">
                  <ChatInput 
                      onSubmit={handleSendMessage} 
                      isLoading={isLoading}
                      isEditing={!!editingState}
                      initialText={editingState ? editingState.text : ''}
                      onCancelEdit={handleCancelEdit}
                  />
                  {messages.length > 1 && (
                     <ActionFooter
                          isReady={isConsultationReady}
                          onSummarize={handleGenerateSummary}
                          onInterrupt={handleInterruptClick}
                      />
                  )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className={`flex flex-col bg-slate-100 ${view === 'chatting' ? 'h-full' : 'min-h-full'}`}>
      {view === 'chatting' && (
        <Header 
          showBackButton={userConversations.length > 0}
          onBackClick={handleBackToDashboard}
        />
      )}
      <main className={`flex-1 flex flex-col items-center ${view === 'chatting' ? 'p-4 md:p-6 justify-center overflow-hidden' : 'p-0 sm:p-4 md:p-6 justify-start'}`}>
        {renderContent()}
      </main>
      
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={handleCloseSummaryModal}
        summary={summary}
        isLoading={isSummaryLoading}
        onRevise={handleReviseSummary}
        onFinalize={handleFinalizeAndSave}
      />

      <InterruptModal
        isOpen={isInterruptModalOpen}
        onSaveAndInterrupt={handleSaveAndInterrupt}
        onExitWithoutSaving={handleExitWithoutSaving}
        onContinue={handleContinueConversation}
      />
    </div>
  );
};

export default UserView;
