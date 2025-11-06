import React, { useState, useEffect, useRef } from 'react';
import { setPassword } from '../services/authService';
import KeyIcon from './icons/KeyIcon';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setCurrentPassword('');
            setNewPassword('');
            setMessage(null);
            // Focus input for better UX
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null); // Clear previous message
        const result = setPassword(newPassword, currentPassword);
        
        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setTimeout(() => {
                onClose(); // Close modal on success after a short delay
            }, 1500);
        } else {
            setMessage({ type: 'error', text: result.message });
            setCurrentPassword(''); // Clear passwords on error
            setNewPassword('');
            inputRef.current?.focus(); // Re-focus the first input
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><KeyIcon /> パスワード変更</h2>
                </header>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <input 
                            ref={inputRef}
                            type="password" 
                            placeholder="現在のパスワード" 
                            value={currentPassword} 
                            onChange={e => setCurrentPassword(e.target.value)} 
                            className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500" 
                            required 
                            disabled={message?.type === 'success'}
                        />
                        <input 
                            type="password" 
                            placeholder="新しいパスワード (4文字以上)" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500" 
                            required 
                            minLength={4}
                            disabled={message?.type === 'success'}
                        />
                        {message && (
                             <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}
                    </div>

                    <footer className="p-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex gap-3">
                         <button 
                            type="button" 
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300"
                         >
                            キャンセル
                        </button>
                        <button 
                            type="submit" 
                            className="w-full px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 disabled:bg-slate-400"
                            disabled={!currentPassword || !newPassword || message?.type === 'success'}
                        >
                            {message?.type === 'success' ? '変更しました' : '変更'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default PasswordChangeModal;