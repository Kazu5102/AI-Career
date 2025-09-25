
import React, { useState, useEffect } from 'react';
import { StoredConversation, StoredData } from '../types';
import UserIcon from '../components/icons/UserIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';

interface UserInfo {
  id: string;
  count: number;
  lastDate: string;
}

interface UserSelectionViewProps {
  onUserSelect: (userId: string) => void;
}

const UserSelectionView: React.FC<UserSelectionViewProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);

  useEffect(() => {
    const allDataRaw = localStorage.getItem('careerConsultations');
    if (allDataRaw) {
      try {
        const parsed = JSON.parse(allDataRaw);
        let conversations: StoredConversation[] = [];

        if (parsed.data && Array.isArray(parsed.data)) {
          conversations = parsed.data;
        } else if (Array.isArray(parsed)) {
          conversations = parsed;
        }

        const userMap: { [key: string]: { count: number; lastDate: string } } = {};

        conversations.forEach(conv => {
          if (!conv.userId) return; // Skip conversations without a userId
          if (!userMap[conv.userId]) {
            userMap[conv.userId] = { count: 0, lastDate: '1970-01-01T00:00:00.000Z' };
          }
          userMap[conv.userId].count++;
          if (new Date(conv.date) > new Date(userMap[conv.userId].lastDate)) {
            userMap[conv.userId].lastDate = conv.date;
          }
        });

        const sortedUsers = Object.entries(userMap)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

        setUsers(sortedUsers);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    }
  }, []);

  const handleCreateNewUser = () => {
    const newUserId = `user_${Date.now()}`;
    onUserSelect(newUserId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 my-8">
      <header className="text-center pb-6">
        <h1 className="text-2xl font-bold text-slate-800">相談者の選択</h1>
        <p className="mt-2 text-slate-600">どの相談者としてアプリケーションを利用しますか？</p>
      </header>

      <div className="space-y-3">
        {users.length > 0 && (
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onUserSelect(user.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-sky-100 border border-slate-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white">
                      <UserIcon />
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="font-bold text-slate-800 truncate" title={user.id}>{user.id}</p>
                      <p className="text-sm text-slate-500">
                        {user.count}件の相談 | 最終相談: {formatDate(user.lastDate)}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
        )}

        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={handleCreateNewUser}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200"
          >
            <PlusCircleIcon />
            新しい相談者として始める
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelectionView;
