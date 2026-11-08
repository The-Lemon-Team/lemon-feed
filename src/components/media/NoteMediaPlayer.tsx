import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { UnifiedFeedItem } from '../../adapters/feeds/types';
import { resolveMediaUrl } from '../../api/client';
import {
  NoteMediaTrack,
  extractNoteMediaTracks,
  formatMediaTime,
} from '../../utils/noteMedia';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Film,
  FileAudio,
} from 'lucide-react';

export interface NoteMediaPlayerProps {
  item: UnifiedFeedItem;
  tracks?: NoteMediaTrack[];
  variant?: 'card' | 'modal' | 'compact';
  requestedTrackUrl?: string | null;
  onTrackChange?: (track: NoteMediaTrack) => void;
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2] as const;
const GLOBAL_MEDIA_PLAY_EVENT = 'lenta:media-play';

export const NoteMediaPlayer: React.FC<NoteMediaPlayerProps> = ({
  item,
  tracks: precomputedTracks,
  variant = 'card',
  requestedTrackUrl,
  onTrackChange,
}) => {
  const playerId = useId();
  const tracks = useMemo(
    () => precomputedTracks ?? extractNoteMediaTracks(item),
    [precomputedTracks, item]
  );
  const isNotebookLmPlaceholder = tracks.length === 0 && item.feedSlug === 'notebooklm-ai';

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadedDuration, setLoadedDuration] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [trackDurations, setTrackDurations] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTrack: NoteMediaTrack | null = tracks[activeIndex] || tracks[0] || null;
  const resolvedActiveUrl = activeTrack?.url ? resolveMediaUrl(activeTrack.url) : '';

  const getActiveMediaElement = (): HTMLMediaElement | null => {
    if (activeTrack?.kind === 'video') return videoRef.current;
    return audioRef.current;
  };

  // Reset state when switching to a different note item
  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setLoadedDuration(null);
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, [item.id]);

  // Coordinate with other NoteMediaPlayer instances so only one plays at a time
  useEffect(() => {
    if (tracks.length === 0 && !isNotebookLmPlaceholder) return;
    const handleGlobalPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ playerId: string }>;
      if (customEvent.detail?.playerId && customEvent.detail.playerId !== playerId) {
        const mediaEl = getActiveMediaElement();
        if (mediaEl && !mediaEl.paused) {
          mediaEl.pause();
        }
        setIsPlaying(false);
      }
    };
    window.addEventListener(GLOBAL_MEDIA_PLAY_EVENT, handleGlobalPlay);
    return () => {
      window.removeEventListener(GLOBAL_MEDIA_PLAY_EVENT, handleGlobalPlay);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [playerId, activeTrack?.kind, tracks.length, isNotebookLmPlaceholder]);

  // Respond to external track selection (e.g. clicking an inline markdown audio link)
  useEffect(() => {
    if (!requestedTrackUrl || tracks.length === 0) return;
    const normReq = requestedTrackUrl.trim().replace(/^https?:\/\/[^/]+/i, '');
    const foundIdx = tracks.findIndex(
      (t) => t.url.trim().replace(/^https?:\/\/[^/]+/i, '') === normReq
    );
    if (foundIdx >= 0) {
      handleSelectTrack(foundIdx, true);
    }
  }, [requestedTrackUrl]);

  if (tracks.length === 0 && !isNotebookLmPlaceholder) {
    return null;
  }

  const effectiveDuration =
    loadedDuration ||
    (activeTrack?.url ? trackDurations[activeTrack.url] : null) ||
    activeTrack?.duration ||
    item.audioDuration ||
    null;

  const progressPercent =
    effectiveDuration && effectiveDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
      : 0;

  const notifyGlobalPlay = () => {
    window.dispatchEvent(
      new CustomEvent(GLOBAL_MEDIA_PLAY_EVENT, { detail: { playerId } })
    );
  };

  const startPlayback = (mediaEl: HTMLMediaElement | null) => {
    notifyGlobalPlay();
    if (!mediaEl || !resolvedActiveUrl) {
      setIsPlaying((prev) => !prev);
      if (!isPlaying) {
        fallbackTimerRef.current = setTimeout(() => setIsPlaying(false), 5000);
      }
      return;
    }

    mediaEl.playbackRate = playbackRate;
    mediaEl.muted = isMuted;

    try {
      const playPromise = mediaEl.play();
      if (playPromise !== undefined && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(true);
            fallbackTimerRef.current = setTimeout(() => setIsPlaying(false), 5000);
          });
      } else {
        setIsPlaying(true);
      }
    } catch {
      setIsPlaying(true);
      fallbackTimerRef.current = setTimeout(() => setIsPlaying(false), 5000);
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const mediaEl = getActiveMediaElement();
    if (isPlaying) {
      mediaEl?.pause();
      setIsPlaying(false);
    } else {
      startPlayback(mediaEl);
    }
  };

  const handleSelectTrack = (index: number, autoPlay = true, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetTrack = tracks[index];
    if (!targetTrack) return;

    if (index === activeIndex) {
      if (autoPlay) {
        const mediaEl = getActiveMediaElement();
        if (isPlaying) {
          mediaEl?.pause();
          setIsPlaying(false);
        } else {
          startPlayback(mediaEl);
        }
      }
      return;
    }

    const currentEl = getActiveMediaElement();
    currentEl?.pause();
    setActiveIndex(index);
    setCurrentTime(0);
    setLoadedDuration(trackDurations[targetTrack.url] || targetTrack.duration || null);
    onTrackChange?.(targetTrack);

    if (autoPlay) {
      setIsPlaying(true);
      notifyGlobalPlay();
      setTimeout(() => {
        const nextEl = targetTrack.kind === 'video' ? videoRef.current : audioRef.current;
        if (nextEl) {
          nextEl.load();
          startPlayback(nextEl);
        }
      }, 30);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    const mediaEl = getActiveMediaElement();
    if (mediaEl && Number.isFinite(nextTime)) {
      try {
        mediaEl.currentTime = nextTime;
      } catch {
        // Ignore seek errors on unbuffered streams in test environments
      }
    }
  };

  const handleSkip = (deltaSeconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const mediaEl = getActiveMediaElement();
    const maxDur = effectiveDuration || mediaEl?.duration || 3600;
    const nextTime = Math.max(0, Math.min(maxDur, currentTime + deltaSeconds));
    setCurrentTime(nextTime);
    if (mediaEl) {
      try {
        mediaEl.currentTime = nextTime;
      } catch {
        // Ignore in non-DOM-media environments
      }
    }
  };

  const handleCyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIdx = PLAYBACK_RATES.indexOf(playbackRate as any);
    const nextRate = PLAYBACK_RATES[(currentIdx + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(nextRate);
    const mediaEl = getActiveMediaElement();
    if (mediaEl) {
      mediaEl.playbackRate = nextRate;
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const mediaEl = getActiveMediaElement();
    if (mediaEl) {
      mediaEl.muted = nextMuted;
    }
  };

  const handleTrackEnded = () => {
    if (activeIndex < tracks.length - 1) {
      handleSelectTrack(activeIndex + 1, true);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const hasCustomTrackTitle =
    activeTrack &&
    activeTrack.title &&
    activeTrack.title !== 'NotebookLM AI Podcast';

  const durationBadgeText = effectiveDuration
    ? `${Math.max(1, Math.round(effectiveDuration / 60))} мин`
    : 'Брифинг';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      data-testid="note-media-player"
      className={`rounded-2xl bg-gradient-to-br from-purple-500/[0.09] via-indigo-500/[0.06] to-slate-500/[0.04] dark:from-purple-950/35 dark:via-indigo-950/25 dark:to-[#131b24]/90 border border-purple-500/30 dark:border-purple-400/20 flex flex-col gap-2.5 transition-all shadow-xs ${
        variant === 'modal' ? 'p-3.5 sm:p-4 my-2' : 'mb-3 p-3'
      }`}
    >
      {/* 1. Top Row: Track Header + Play Button */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-sm shrink-0 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-white ring-4 ring-amber-500/20'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
            title={isPlaying ? 'Пауза' : 'Слушать подкаст'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-500/15 dark:bg-purple-500/20 px-2 py-0.5 rounded-full">
                {activeTrack?.kind === 'video' ? (
                  <Film className="w-3 h-3 shrink-0" />
                ) : (
                  <Headphones className="w-3 h-3 shrink-0" />
                )}
                <span>NotebookLM AI Podcast</span>
              </span>

              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono font-medium">
                {durationBadgeText}
              </span>

              {activeTrack?.extension && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono font-semibold uppercase">
                  {activeTrack.extension}
                </span>
              )}

              {tracks.length > 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono font-semibold">
                  {activeIndex + 1} / {tracks.length}
                </span>
              )}
            </div>

            <div
              className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate mt-1"
              title={activeTrack?.title || 'NotebookLM AI Podcast'}
            >
              {hasCustomTrackTitle
                ? activeTrack.title
                : 'Ежедневный синтезированный аудио-обзор выпуска'}
            </div>
          </div>
        </div>

        {/* Right quick actions: Speed, Mute, Download */}
        {activeTrack && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => handleSkip(-15, e)}
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
              title="Назад на 15 секунд"
            >
              <RotateCcw className="w-3 h-3" />
              <span>15с</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleSkip(15, e)}
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
              title="Вперёд на 15 секунд"
            >
              <span>15с</span>
              <RotateCw className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleCyclePlaybackRate}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-white/80 dark:bg-white/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 hover:border-purple-500/50 transition-colors cursor-pointer"
              title="Скорость воспроизведения"
            >
              {playbackRate}x
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {resolvedActiveUrl && (
              <a
                href={resolvedActiveUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                title="Скачать / открыть медиафайл"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* 2. Video Viewport (when active track is video) */}
      {activeTrack?.kind === 'video' && resolvedActiveUrl && (
        <div className="rounded-xl overflow-hidden bg-black border border-slate-200/60 dark:border-white/10 mt-1">
          <video
            ref={videoRef}
            src={resolvedActiveUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[380px] object-contain bg-black"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration;
              if (Number.isFinite(dur) && dur > 0) {
                setLoadedDuration(dur);
                setTrackDurations((prev) => ({ ...prev, [activeTrack.url]: dur }));
              }
            }}
            onPlay={() => {
              notifyGlobalPlay();
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={handleTrackEnded}
          />
        </div>
      )}

      {/* 3. Interactive Progress / Seek Bar (for audio tracks) */}
      {activeTrack && activeTrack.kind === 'audio' && (
        <div className="flex items-center gap-2.5 pt-0.5">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-9 text-right shrink-0">
            {formatMediaTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center h-4">
            <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 dark:from-purple-400 dark:to-indigo-400 rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={effectiveDuration && effectiveDuration > 0 ? effectiveDuration : 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Позиция воспроизведения"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-9 shrink-0">
            {effectiveDuration ? formatMediaTime(effectiveDuration) : '--:--'}
          </span>
        </div>
      )}

      {/* Hidden HTML5 Audio Element */}
      {activeTrack && activeTrack.kind === 'audio' && resolvedActiveUrl && (
        <audio
          ref={audioRef}
          src={resolvedActiveUrl}
          preload="metadata"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration;
            if (Number.isFinite(dur) && dur > 0) {
              setLoadedDuration(dur);
              setTrackDurations((prev) => ({ ...prev, [activeTrack.url]: dur }));
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleTrackEnded}
          className="hidden"
        />
      )}

      {/* 4. Attached Media Files Playlist (when note has multiple tracks or in modal/compact view) */}
      {(tracks.length > 1 || (variant !== 'card' && tracks.length === 1 && hasCustomTrackTitle)) && (
        <div className="pt-1.5 border-t border-purple-500/15 dark:border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
              <FileAudio className="w-3 h-3 text-purple-500" />
              <span>Прикреплённые медиафайлы ({tracks.length})</span>
            </span>
          </div>

          <div className="space-y-1">
            {tracks.map((track, idx) => {
              const isSelected = idx === activeIndex;
              const isTrackPlaying = isSelected && isPlaying;
              const knownDur = trackDurations[track.url] || track.duration;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={(e) => handleSelectTrack(idx, true, e)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-600/15 dark:bg-purple-500/20 border-purple-500/40 text-slate-900 dark:text-white font-semibold'
                      : 'bg-white/50 dark:bg-white/[0.03] border-transparent hover:border-purple-500/20 hover:bg-purple-500/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                        isTrackPlaying
                          ? 'bg-amber-500 text-white animate-pulse'
                          : isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isTrackPlaying ? (
                        <Pause className="w-2.5 h-2.5 fill-current" />
                      ) : (
                        <Play className="w-2.5 h-2.5 fill-current translate-x-[0.5px]" />
                      )}
                    </span>
                    <span className="truncate">{track.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {knownDur ? <span>{formatMediaTime(knownDur)}</span> : null}
                    <span className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-white/10 text-[9px] uppercase">
                      {track.extension}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
