import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  ExternalLink,
  Calendar,
  RefreshCw,
  Layers,
  ArrowRight,
  MessageSquare,
  Plus,
  Radio,
  BarChart3,
  Cloud,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { LemonLogo } from './LemonLogo';
import { useModalBackdrop } from '../hooks/useModalBackdrop';
import { feedApi } from '../api/client';

export interface LemonSeasonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFeed?: (slug?: string) => void;
  onSelectStreamSource?: (streamSource: string) => void;
}

interface CloudItem {
  id: string;
  slug: string;
  title: string;
  kind: 'stream' | 'feed';
  icon: string;
  color: string;
  totalNotes: number;
  publishedNotes?: number;
  stagingNotes?: number;
  lastNoteAt?: string | null;
  parentStreamSlug?: string;
  feeds?: CloudItem[];
  // visual layout coordinates (% within canvas)
  x: number;
  y: number;
  floatDelay: string;
  floatDuration: string;
}

interface CharacterDialogueDemo {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatar: string;
  time: string;
  text: string;
  moodEmoji: string;
  tag: string;
}

const INITIAL_STREAMS: CloudItem[] = [
  {
    id: 's-party',
    slug: 'lemon-party',
    title: 'Lemon Party',
    kind: 'stream',
    icon: '🎭',
    color: '#eab308',
    totalNotes: 42,
    publishedNotes: 38,
    stagingNotes: 4,
    lastNoteAt: 'Сегодня, 22:15',
    x: 28,
    y: 35,
    floatDelay: '0s',
    floatDuration: '6s',
    feeds: [
      {
        id: 'f-party-diary',
        slug: 'party-chrono-diary',
        title: 'Дневник Дня',
        kind: 'feed',
        icon: '📖',
        color: '#f59e0b',
        totalNotes: 24,
        publishedNotes: 22,
        stagingNotes: 2,
        lastNoteAt: '22:10',
        parentStreamSlug: 'lemon-party',
        x: 14,
        y: 20,
        floatDelay: '0.5s',
        floatDuration: '5.2s',
      },
      {
        id: 'f-party-dialogues',
        slug: 'party-character-dialogues',
        title: 'Реплики Персонажей',
        kind: 'feed',
        icon: '💬',
        color: '#fbbf24',
        totalNotes: 18,
        publishedNotes: 16,
        stagingNotes: 2,
        lastNoteAt: '22:15',
        parentStreamSlug: 'lemon-party',
        x: 18,
        y: 62,
        floatDelay: '1.2s',
        floatDuration: '6.8s',
      },
    ],
  },
  {
    id: 's-dev',
    slug: 'it-dev',
    title: 'Dev & Tech Hub',
    kind: 'stream',
    icon: '⚡',
    color: '#3b82f6',
    totalNotes: 128,
    publishedNotes: 110,
    stagingNotes: 18,
    lastNoteAt: 'Вчера, 19:40',
    x: 72,
    y: 32,
    floatDelay: '0.8s',
    floatDuration: '7s',
    feeds: [
      {
        id: 'f-dev-changelogs',
        slug: 'changelogs',
        title: 'Changelogs & Commits',
        kind: 'feed',
        icon: '🛠️',
        color: '#60a5fa',
        totalNotes: 64,
        publishedNotes: 58,
        stagingNotes: 6,
        lastNoteAt: 'Вчера, 18:20',
        parentStreamSlug: 'it-dev',
        x: 86,
        y: 18,
        floatDelay: '0.3s',
        floatDuration: '5.6s',
      },
      {
        id: 'f-dev-neurons',
        slug: 'coding-memory',
        title: 'Нейроны & Архитектура',
        kind: 'feed',
        icon: '🧠',
        color: '#818cf8',
        totalNotes: 39,
        publishedNotes: 35,
        stagingNotes: 4,
        lastNoteAt: 'Сегодня, 16:10',
        parentStreamSlug: 'it-dev',
        x: 84,
        y: 60,
        floatDelay: '1.5s',
        floatDuration: '6.2s',
      },
      {
        id: 'f-dev-ai',
        slug: 'notebooklmai',
        title: 'AI Исследования',
        kind: 'feed',
        icon: '✨',
        color: '#a78bfa',
        totalNotes: 25,
        publishedNotes: 17,
        stagingNotes: 8,
        lastNoteAt: '3 дня назад',
        parentStreamSlug: 'it-dev',
        x: 62,
        y: 68,
        floatDelay: '0.9s',
        floatDuration: '5.9s',
      },
    ],
  },
  {
    id: 's-seasons',
    slug: 'seasons',
    title: 'Lemon Seasons',
    kind: 'stream',
    icon: '🍋',
    color: '#84cc16',
    totalNotes: 76,
    publishedNotes: 70,
    stagingNotes: 6,
    lastNoteAt: 'Сегодня, 14:05',
    x: 48,
    y: 72,
    floatDelay: '0.4s',
    floatDuration: '6.4s',
    feeds: [
      {
        id: 'f-seasons-milestones',
        slug: 'milestones',
        title: 'Вехи Проекта',
        kind: 'feed',
        icon: '🏆',
        color: '#a3e635',
        totalNotes: 32,
        publishedNotes: 30,
        stagingNotes: 2,
        lastNoteAt: 'Вчера',
        parentStreamSlug: 'seasons',
        x: 36,
        y: 84,
        floatDelay: '1.1s',
        floatDuration: '5.5s',
      },
      {
        id: 'f-seasons-notes',
        slug: 'seasons-daily',
        title: 'Хроники Дня',
        kind: 'feed',
        icon: '📅',
        color: '#4ade80',
        totalNotes: 44,
        publishedNotes: 40,
        stagingNotes: 4,
        lastNoteAt: 'Сегодня, 14:05',
        parentStreamSlug: 'seasons',
        x: 60,
        y: 85,
        floatDelay: '0.7s',
        floatDuration: '6.1s',
      },
    ],
  },
];

const INITIAL_DEMO_DIALOGUES: CharacterDialogueDemo[] = [
  {
    id: 'd1',
    actorId: 'alisa-sage',
    actorName: 'Алиса Мудрая',
    actorAvatar: '🔮',
    time: '22:15',
    text: 'Сегодня мы связали потоки мыслей персонажей с хронологическим таймлайном Lemon Seasons! Каждый диалог превращается в осязаемое облако истории дня.',
    moodEmoji: '✨',
    tag: '#timeline-sync',
  },
  {
    id: 'd2',
    actorId: 'lemon-hero',
    actorName: 'Лимонный Герой',
    actorAvatar: '🍋',
    time: '22:20',
    text: 'И теперь нажимая на облако стрима или фида, пользователь сразу видит статистику канала, активность и может в один клик прыгнуть в ленту!',
    moodEmoji: '🚀',
    tag: '#cloud-navigation',
  },
];

export const LemonSeasonsModal: React.FC<LemonSeasonsModalProps> = ({
  isOpen,
  onClose,
  onSelectFeed,
  onSelectStreamSource,
}) => {
  const [activeTab, setActiveTab] = useState<'clouds' | 'dialogues' | 'about'>('clouds');
  const [streamsData, setStreamsData] = useState<CloudItem[]>(INITIAL_STREAMS);
  const [selectedCloud, setSelectedCloud] = useState<CloudItem | null>(null);
  const [dialogues, setDialogues] = useState<CharacterDialogueDemo[]>(INITIAL_DEMO_DIALOGUES);
  const [newDialogueText, setNewDialogueText] = useState('');
  const [selectedActor, setSelectedActor] = useState({ id: 'alisa-sage', name: 'Алиса Мудрая', avatar: '🔮' });

  // Escape key handling as required by AGENTS.md rule 7
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Set default selected cloud when modal opens
  useEffect(() => {
    if (isOpen && !selectedCloud) {
      setSelectedCloud(streamsData[0]);
    }
  }, [isOpen, streamsData, selectedCloud]);

  // Try to enrich streams from live API if available
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    feedApi
      .getStreams(true)
      .then((apiStreams) => {
        if (!isMounted || !apiStreams || apiStreams.length === 0) return;
        // Merge counters if available
        setStreamsData((prev) =>
          prev.map((s) => {
            const matched = apiStreams.find((as) => as.slug === s.slug);
            if (matched) {
              return {
                ...s,
                title: matched.title || s.title,
                icon: matched.icon || s.icon,
              };
            }
            return s;
          })
        );
      })
      .catch(() => {
        // Fallback demo data already loaded
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const { backdropProps } = useModalBackdrop(onClose);

  const handleCloudClick = (cloud: CloudItem) => {
    setSelectedCloud(cloud);
  };

  const handleNavigateToCloud = (cloud: CloudItem) => {
    if (cloud.kind === 'stream') {
      if (onSelectStreamSource) {
        onSelectStreamSource(cloud.slug);
        onClose();
        return;
      }
    } else {
      if (onSelectFeed) {
        onSelectFeed(cloud.slug);
        onClose();
        return;
      }
    }
    // Fallback: open calendar host URL
    window.open(`http://localhost:5174/?feed=${encodeURIComponent(cloud.slug)}`, '_blank');
  };

  const handleAddDialogueTurn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDialogueText.trim()) return;

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEntry: CharacterDialogueDemo = {
      id: `d-${Date.now()}`,
      actorId: selectedActor.id,
      actorName: selectedActor.name,
      actorAvatar: selectedActor.avatar,
      time,
      text: newDialogueText.trim(),
      moodEmoji: '💬',
      tag: '#party-dialogue',
    };

    setDialogues((prev) => [newEntry, ...prev]);
    setNewDialogueText('');

    // Increment count on party stream
    setStreamsData((prev) =>
      prev.map((s) => (s.slug === 'lemon-party' ? { ...s, totalNotes: s.totalNotes + 1 } : s))
    );
  };

  const allCloudsList = useMemo(() => {
    const list: CloudItem[] = [];
    for (const s of streamsData) {
      list.push(s);
      if (s.feeds) {
        list.push(...s.feeds);
      }
    }
    return list;
  }, [streamsData]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      style={{ zIndex: 9999 }}
      {...backdropProps}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 text-slate-100 border border-amber-500/30 rounded-3xl shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Lemon & Neon Glow in Background */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <LemonLogo size={36} animated={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight truncate">
                  Lemon Seasons
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-yellow-300 font-mono text-[10px] uppercase font-bold tracking-wider border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                  <span>Парящие Облака</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Интерактивная карта потоков (Stream ← Feeds) и таймлайн персонажей
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('clouds')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'clouds'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Облака потоков</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dialogues')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'dialogues'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Персонажи & Таймлайн</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>О календаре</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex sm:hidden items-center justify-around p-2 bg-slate-950/60 border-b border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('clouds')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              activeTab === 'clouds' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Cloud className="w-3 h-3" />
            <span>Облака</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dialogues')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              activeTab === 'dialogues' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Персонажи</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
              activeTab === 'about' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>О проекте</span>
          </button>
        </div>

        {/* Tab 1: Floating Clouds (Stream <- Feeds Canvas) */}
        {activeTab === 'clouds' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
            {/* The Floating Canvas */}
            <div className="flex-1 h-[360px] md:h-[480px] relative overflow-hidden bg-gradient-to-b from-[#0a0f18] via-[#0e1622] to-[#070b12] p-4 select-none">
              {/* Subtle Grid Stars & Nebula Glows */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

              {/* Neural SVG connection lines between Streams and their Satellite Feeds */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {streamsData.map((stream) =>
                  (stream.feeds || []).map((feed) => {
                    const isParentSelected = selectedCloud?.id === stream.id;
                    const isFeedSelected = selectedCloud?.id === feed.id;
                    const isHighlighted = isParentSelected || isFeedSelected;
                    return (
                      <line
                        key={`${stream.id}-${feed.id}`}
                        x1={`${stream.x}%`}
                        y1={`${stream.y}%`}
                        x2={`${feed.x}%`}
                        y2={`${feed.y}%`}
                        stroke={isHighlighted ? '#fbbf24' : 'rgba(251, 191, 36, 0.25)'}
                        strokeWidth={isHighlighted ? 2 : 1}
                        strokeDasharray={isHighlighted ? '4,4' : '6,6'}
                        className="transition-all duration-300"
                      />
                    );
                  })
                )}
              </svg>

              {/* Render Floating Clouds */}
              {allCloudsList.map((cloud) => {
                const isStream = cloud.kind === 'stream';
                const isSelected = selectedCloud?.id === cloud.id;

                return (
                  <div
                    key={cloud.id}
                    onClick={() => handleCloudClick(cloud)}
                    style={{
                      left: `${cloud.x}%`,
                      top: `${cloud.y}%`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: cloud.floatDelay,
                      animationDuration: cloud.floatDuration,
                    }}
                    className={`absolute z-10 cursor-pointer transition-all duration-300 group ${
                      isSelected ? 'scale-110 z-20' : 'hover:scale-105'
                    }`}
                  >
                    {/* The Cloud Bubble */}
                    <div
                      className={`relative flex items-center gap-2 rounded-2xl shadow-lg backdrop-blur-md transition-all ${
                        isStream
                          ? 'px-4 py-2.5 bg-slate-800/90 border-2'
                          : 'px-3 py-1.5 bg-slate-900/80 border'
                      } ${
                        isSelected
                          ? 'border-yellow-400 ring-4 ring-yellow-400/20 shadow-yellow-500/20'
                          : isStream
                          ? 'border-amber-500/40 hover:border-amber-400'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {/* Pulse Glow for Selected Cloud */}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500" />
                        </span>
                      )}

                      <span className={isStream ? 'text-xl' : 'text-sm'}>{cloud.icon}</span>

                      <div className="text-left">
                        <div
                          className={`font-semibold tracking-tight leading-tight ${
                            isStream ? 'text-xs text-white' : 'text-[11px] text-slate-200'
                          }`}
                        >
                          {cloud.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                          <span>{cloud.totalNotes} заметок</span>
                          {isStream && (
                            <span className="text-yellow-400 font-bold">• Стрим</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Floating Canvas Hint at bottom left */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-[10px] text-slate-400 backdrop-blur-xs">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Нажмите на облако для просмотра статистики канала</span>
              </div>
            </div>

            {/* Cloud Statistics Side Card */}
            <div className="w-full md:w-80 bg-slate-950/90 border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col justify-between overflow-y-auto">
              {selectedCloud ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{selectedCloud.kind === 'stream' ? 'Статистика Стрима' : 'Статистика Фида'}</span>
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                        selectedCloud.kind === 'stream'
                          ? 'bg-amber-500/20 text-yellow-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {selectedCloud.kind}
                    </span>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                      {selectedCloud.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-base leading-tight truncate">
                        {selectedCloud.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        #{selectedCloud.slug}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-mono">Всего записей</span>
                      <span className="text-lg font-bold font-mono text-white">
                        {selectedCloud.totalNotes}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-mono">Опубликовано</span>
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        {selectedCloud.publishedNotes ?? selectedCloud.totalNotes}
                      </span>
                    </div>
                  </div>

                  {/* Activity info */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-yellow-400 text-[11px] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Активность канала</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Последняя запись: <span className="font-semibold text-white">{selectedCloud.lastNoteAt || 'Недавно'}</span>
                    </p>
                  </div>

                  {/* Connected Feeds List (if stream) */}
                  {selectedCloud.kind === 'stream' && selectedCloud.feeds && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Связанные фиды ({selectedCloud.feeds.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCloud.feeds.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleCloudClick(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] border border-white/5 transition-colors cursor-pointer"
                          >
                            <span>{f.icon}</span>
                            <span>{f.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Link Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleNavigateToCloud(selectedCloud)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <span>Перейти в {selectedCloud.kind === 'stream' ? 'стрим' : 'фид'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 text-xs py-8">
                  <Cloud className="w-8 h-8 opacity-40 mb-2" />
                  <span>Выберите облако на холсте</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Character Dialogues & Day Timeline */}
        {activeTab === 'dialogues' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden p-5 gap-5">
            {/* Left: Interactive Dialogue Stream */}
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>История Дня: Диалоги Персонажей</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Реплики и мысли автоматически регистрируются в фид персонажа и попадают в таймлайн
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Синхронизировано
                </span>
              </div>

              {/* Dialogues List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[320px]">
                {dialogues.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 animate-fadeIn"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{d.actorAvatar}</span>
                        <span className="font-bold text-xs text-white">{d.actorName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{d.time}</span>
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-mono">{d.tag}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-6">{d.text}</p>
                  </div>
                ))}
              </div>

              {/* Quick Input Form to test dialogue recording */}
              <form onSubmit={handleAddDialogueTurn} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={newDialogueText}
                  onChange={(e) => setNewDialogueText(e.target.value)}
                  placeholder={`Мысль от имени ${selectedActor.name}...`}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newDialogueText.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Сказать</span>
                </button>
              </form>
            </div>

            {/* Right: Character Info & Architecture Info */}
            <div className="w-full md:w-72 bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3.5 text-xs">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block">
                Активный персонаж (Lemon Party)
              </span>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-2xl">{selectedActor.avatar}</span>
                <div>
                  <div className="font-bold text-white text-xs">{selectedActor.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">actorId: #{selectedActor.id}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                <div className="font-semibold text-yellow-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Мост с lemon-seasons-neurons</span>
                </div>
                <p>
                  Через <code className="text-yellow-400 font-mono text-[10px]">CharacterDialogueAxon</code> реплики маппятся с сохранением бинарной приватности (<code className="text-[10px] text-slate-400">public | private</code>) и попадают в таймлайн дня Lemon Seasons.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="http://localhost:5174/timeline"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium transition-colors"
                >
                  <span>Открыть таймлайн дня</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: About Lemon Seasons */}
        {activeTab === 'about' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <LemonLogo size={52} animated={true} />
              <h3 className="text-xl font-bold text-white">Lemon Seasons & Calendarium</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Хронологический календарь событий, двусторонний синхронизатор Obsidian и реактивная нейронная лента.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>Сетка событий и дат</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Полноценное представление событий по дням, неделям и месяцам с интеграцией публикаций из Ленты.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-lime-400 font-semibold text-xs">
                  <RefreshCw className="w-4 h-4" />
                  <span>Двусторонний Obsidian Sync</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Синхронизация локальных Markdown-хранилищ с бинарной моделью приватности (public/private).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-white block">Локальный сервер разработки календаря</span>
                <span className="text-slate-400 text-[11px]">Работает на порту 5174</span>
              </div>
              <a
                href="http://localhost:5174/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
              >
                <span>Перейти к календарю</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-slate-950/40 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>@lenta/seasons-neurons активен</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
