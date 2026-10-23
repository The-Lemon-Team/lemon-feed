import React from 'react';
import { Terminal, FileText, Hash } from 'lucide-react';

export interface FeedItNoteBlueprint {
  id: string;
  label: string;
  tags: string[];
  summaryPrefix: string;
  markdownTemplate: (title: string) => string;
}

export const FEED_IT_NOTE_BLUEPRINTS: FeedItNoteBlueprint[] = [
  {
    id: 'podcast',
    label: '🎙️ IT / AI Подкаст',
    tags: ['#podcast', '#ai', '#it_digest', '#audio'],
    summaryPrefix: '🎧 Аудиовыпуск подкаста: разбор главных IT и AI событий, архитектурных релизов и трендов.',
    markdownTemplate: (title) => `## 🎙️ О выпуске: ${title || 'IT & AI Дайджест'}

> 🎧 **Формат:** Сводный аудиовыпуск / ИИ-подкаст
> **Главные темы:** Нейросети, инфраструктура, релизы и кибербезопасность

## ⏱️ Таймкоды выпуска
- \`00:00\` — Вступление и главная тема выпуска
- \`02:15\` — Разбор ключевого релиза / Архитектура
- \`06:40\` — Секция Security & Zero-Day
- \`10:30\` — Выводы и прогнозы для индустрии

## 🧠 Ключевые инсайты
- **Тренд 1:** ...
- **Тренд 2:** ...
- **Практический вывод:** ...`,
  },
  {
    id: 'changelog',
    label: '🚀 Changelog / Релиз',
    tags: ['#changelog', '#release', '#devops', '#update'],
    summaryPrefix: '🚀 Сводка релиза и ключевых изменений новой версии: фичи, производительность и миграция.',
    markdownTemplate: (title) => `## 🚀 Сводка релиза: ${title || 'Новое обновление'}

> 📦 **Статус:** Stable Release | **Влияние на инфраструктуру:** Среднее / Высокое

## ✨ Ключевые нововведения (Features)
- **Новая функциональность:** ...
- **API / SDK обновления:** ...

## ⚡ Производительность и архитектура
- Оптимизация потребления памяти и скорости отклика: ...

## ⚠️ Breaking Changes & Миграция
- Обратите внимание при обновлении: ...

## 🐛 Исправленные ошибки (Bugfixes)
- Устранена проблема с ...`,
  },
  {
    id: 'security',
    label: '🛡️ Security / CVE Разбор',
    tags: ['#security', '#cybersecurity', '#cve', '#infosec'],
    summaryPrefix: '🛡️ Разбор ИБ-инцидента / CVE-уязвимости: затронутые версии, вектор атаки и рекомендации по патчингу.',
    markdownTemplate: (title) => `## 🛡️ Сводка ИБ-инцидента: ${title || 'Анализ уязвимости'}

> 🚨 **Критичность:** Высокая (CVSS 8.5+) | **Статус патча:** Доступно обновление

## 🎯 Затронутые компоненты и вектор атаки
- **Уязвимые версии:** ...
- **Механизм эксплуатации:** ...

## 🔍 Технический разбор и детекция (IoC)
- Признаки компрометации и логи: ...

## ✅ Рекомендации по защите и патчинг
1. Обновить пакет/ядро до версии ...
2. Ограничить сетевой доступ к ...`,
  },
  {
    id: 'ai-model',
    label: '🧠 AI Модель / Агенты',
    tags: ['#ai', '#llm', '#agents', '#ml'],
    summaryPrefix: '🧠 Технический обзор новой AI-модели / агентной архитектуры: параметры, бенчмарки и внедрение.',
    markdownTemplate: (title) => `## 🧠 Обзор модели / технологии: ${title || 'Новый AI-релиз'}

> 🤖 **Категория:** LLM / Multimodal / Autonomous Agents

## 📊 Архитектура и ключевые параметры
- **Контекстное окно и скорость:** ...
- **Лицензия и доступность весов:** ...

## 🏆 Результаты бенчмарков (Coding & Reasoning)
- Сравнение с предыдущим поколением: ...

## 🛠️ Применение в разработке и агентных пайплайнах
- Как интегрировать в рабочий стек: ...`,
  },
];

interface FeedItEditAssistantProps {
  currentTitle: string;
  currentDescription: string;
  currentSummary: string;
  currentHashtagsStr: string;
  onApplyBlueprint: (payload: {
    description: string;
    summary: string;
    hashtagsStr: string;
    label: string;
  }) => void;
}

export const FeedItEditAssistant: React.FC<FeedItEditAssistantProps> = ({
  currentTitle,
  currentDescription,
  currentSummary,
  currentHashtagsStr,
  onApplyBlueprint,
}) => {
  const handleSelect = (bp: FeedItNoteBlueprint) => {
    const snippet = bp.markdownTemplate(currentTitle);
    const nextDescription = currentDescription.trim()
      ? `${currentDescription.trim()}\n\n${snippet}`
      : snippet;

    const existingTags = currentHashtagsStr
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const mergedTags = Array.from(new Set([...existingTags, ...bp.tags])).join(' ');
    const nextSummary = currentSummary.trim() || bp.summaryPrefix;

    onApplyBlueprint({
      description: nextDescription,
      summary: nextSummary,
      hashtagsStr: mergedTags,
      label: bp.label,
    });
  };

  return (
    <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#121923] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#2481cc]" />
          <span>IT-Шаблоны структуры поста (Markdown + Авто-теги):</span>
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FEED_IT_NOTE_BLUEPRINTS.map((bp) => (
          <button
            key={bp.id}
            type="button"
            onClick={() => handleSelect(bp)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#17212b] hover:bg-[#2481cc]/10 border border-slate-200 dark:border-white/10 hover:border-[#2481cc]/40 text-slate-700 dark:text-slate-200 hover:text-[#2481cc] dark:hover:text-[#64b5f6] text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3 h-3 opacity-70" />
            <span>{bp.label}</span>
            <Hash className="w-2.5 h-2.5 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
};
