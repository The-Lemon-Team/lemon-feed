import React, { useEffect, useState } from 'react';
import { X, Lock, Bot, User, Globe, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import {
  FeedAccountInfo,
  SavedFeedAccountPreset,
  getFeedAuthToken,
  getSavedAccountPresets,
  removeAccountPreset,
  saveAccountPreset,
} from '../api/client';

export interface AccountAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount?: FeedAccountInfo;
  onApplyToken: (token: string) => Promise<void>;
}

export const AccountAccessModal: React.FC<AccountAccessModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onApplyToken,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [kindInput, setKindInput] = useState<'HUMAN' | 'AGENT'>('AGENT');
  const [presets, setPresets] = useState<SavedFeedAccountPreset[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTokenInput(getFeedAuthToken());
      setPresets(getSavedAccountPresets());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = async (token: string) => {
    setIsApplying(true);
    try {
      await onApplyToken(token);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveAndApply = async () => {
    const cleanToken = tokenInput.trim();
    if (!cleanToken) return;
    const next = saveAccountPreset({
      id: `acc-${Date.now()}`,
      label: labelInput.trim() || (kindInput === 'AGENT' ? '🤖 AI-Агент (Neurons)' : '👤 Личный аккаунт'),
      token: cleanToken,
      kind: kindInput,
    });
    setPresets(next);
    setLabelInput('');
    await handleApply(cleanToken);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-account-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18222d] border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#2481cc]" />
            <div>
              <h2 id="feed-account-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Аккаунт и Приватный Контур Feed-App
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Разделение приватных заметок пользователя и отдельного аккаунта AI-агентов (нейронов)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Context */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#131b24] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {currentAccount?.role === 'agent' ? (
              <Bot className="w-4 h-4 text-violet-500 shrink-0" />
            ) : currentAccount?.role === 'guest' || !currentAccount ? (
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <User className="w-4 h-4 text-[#2481cc] shrink-0" />
            )}
            <div className="truncate">
              <div className="font-semibold text-slate-900 dark:text-white truncate">
                {currentAccount?.name || 'Гость (Public)'}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                role: {currentAccount?.role || 'guest'} · id: {currentAccount?.id || 'usr-guest-000'}
              </div>
            </div>
          </div>
          {currentAccount && currentAccount.role !== 'guest' && (
            <button
              type="button"
              disabled={isApplying}
              onClick={() => handleApply('')}
              className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:opacity-90 shrink-0"
            >
              Выйти (Гость)
            </button>
          )}
        </div>

        {/* Saved Accounts */}
        {presets.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Сохранённые аккаунты:
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#17212b]"
                >
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={() => handleApply(p.token)}
                    className="flex-1 flex items-center gap-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-[#2481cc] truncate"
                  >
                    {p.kind === 'AGENT' ? (
                      <Bot className="w-4 h-4 text-violet-500 shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-[#2481cc] shrink-0" />
                    )}
                    <span className="truncate">{p.label}</span>
                    {getFeedAuthToken() === p.token && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresets(removeAccountPreset(p.id))}
                    className="p-1 text-slate-400 hover:text-rose-500"
                    title="Удалить сохранённый ключ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect New Account Key */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-2.5">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#2481cc]" />
            <span>Подключить аккаунт по UserKey / Токену</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={kindInput}
              onChange={(e) => setKindInput(e.target.value as 'HUMAN' | 'AGENT')}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#131b24] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100"
            >
              <option value="AGENT">🤖 Аккаунт AI-Агентов</option>
              <option value="HUMAN">👤 Личный аккаунт</option>
            </select>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Название профиля (опционально)"
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#131b24] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100"
            />
          </div>

          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Вставьте UserKey (напр. lenta_api_... или lenta_tok_agent_...)"
            className="w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-50 dark:bg-[#131b24] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={!tokenInput.trim() || isApplying}
              onClick={handleSaveAndApply}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2481cc] text-white hover:opacity-95 disabled:opacity-50"
            >
              {isApplying ? 'Подключение...' : 'Войти в контур'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
