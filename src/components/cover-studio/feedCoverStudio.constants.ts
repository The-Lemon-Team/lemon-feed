export type FeedCoverAspectRatio = '16:9' | '1:1' | '9:16' | '4:3';

export interface FeedStylePresetItem {
  id: string;
  label: string;
  icon: string;
  category: 'it' | 'general';
  badge?: string;
  description: string;
}

export interface FeedItWorkflowTemplate {
  id: string;
  label: string;
  icon: string;
  styleId: string;
  aspectRatio: FeedCoverAspectRatio;
  promptPrefix: string;
  promptSuffix: string;
  description: string;
}

export interface FeedItSceneModifier {
  id: string;
  label: string;
  icon: string;
  snippet: string;
}

export const FEED_STYLE_PRESETS: FeedStylePresetItem[] = [
  // IT & Tech Sphere Styles
  {
    id: 'ai-neural',
    label: 'AI / Нейросеть',
    icon: '🧠',
    category: 'it',
    badge: 'IT',
    description: 'Светящиеся нейронные связи, тензорные ядра, глубокий glassmorphism и потоки данных',
  },
  {
    id: 'cyber-security',
    label: 'Security / SOC',
    icon: '🛡️',
    category: 'it',
    badge: 'SEC',
    description: 'Киберзащита, матрица угроз Zero-Day, криптографический щит, красно-синий HUD',
  },
  {
    id: 'changelog-blueprint',
    label: 'Changelog / Релиз',
    icon: '⚙️',
    category: 'it',
    badge: 'DEV',
    description: 'Инженерный CAD-чертёж, модульная сборка релиза, светящаяся архитектурная сетка',
  },
  {
    id: 'podcast-neon',
    label: 'IT Подкаст / Эфир',
    icon: '🎙️',
    category: 'it',
    badge: 'AUDIO',
    description: 'Футуристическая студия подкаста, неоновые звуковые волны, студийный микрофон',
  },
  {
    id: 'isometric-tech',
    label: '3D Изометрия / Cloud',
    icon: '🧊',
    category: 'it',
    badge: '3D',
    description: 'Изометрическая 3D-архитектура серверов, облачных кластеров и микросервисов (Octane Render)',
  },
  {
    id: 'silicon-hardware',
    label: 'Чипы / Hardware',
    icon: '💻',
    category: 'it',
    badge: 'HW',
    description: 'Макросъёмка кремниевых пластин, золотые дорожки GPU-кластеров и квантовых чипов',
  },
  {
    id: 'terminal-retro',
    label: 'Терминал / Код',
    icon: '📟',
    category: 'it',
    badge: 'CLI',
    description: 'Эстетика зелёного/янтарного CRT-терминала, матрица кода и хакерская консоль',
  },
  {
    id: 'abstract-data',
    label: 'Big Data / Граф',
    icon: '📊',
    category: 'it',
    badge: 'DATA',
    description: 'Футуристическая телеметрия, оптоволоконные потоки и сетевые графы в Dark Mode',
  },

  // Classic / General Styles
  {
    id: 'cinematic',
    label: 'Кинематографичный',
    icon: '🎬',
    category: 'general',
    description: 'Широкоформатный кадр из фильма 8K с драматическим анаморфным светом',
  },
  {
    id: 'photorealistic',
    label: 'Фотореализм',
    icon: '📸',
    category: 'general',
    description: 'Детальная 35мм фотография с естественным светом и глубиной резкости',
  },
  {
    id: 'minimalist',
    label: 'Минимализм / Вектор',
    icon: '📐',
    category: 'general',
    description: 'Чистая швейцарская геометрия, плоская векторная графика и баланс форм',
  },
  {
    id: 'cyberpunk',
    label: 'Киберпанк / Неон',
    icon: '🌆',
    category: 'general',
    description: 'Объёмный неоновый свет, отражения на мокром асфальте и атмосфера будущего',
  },
  {
    id: 'vintage',
    label: 'Винтаж / Архив',
    icon: '🏛️',
    category: 'general',
    description: 'Архивная эстетика, тёплое зерно плёнки и классические матовые тона',
  },
  {
    id: 'oil-painting',
    label: 'Живопись / Арт',
    icon: '🎨',
    category: 'general',
    description: 'Выразительный цифровой концепт-арт и фактурная живопись',
  },
];

export const FEED_IT_WORKFLOW_TEMPLATES: FeedItWorkflowTemplate[] = [
  {
    id: 'ai-podcast',
    label: 'IT & AI Подкаст',
    icon: '🎙️',
    styleId: 'podcast-neon',
    aspectRatio: '1:1',
    promptPrefix: 'Обложка IT и AI подкаста:',
    promptSuffix: 'студийный микрофон с неоновыми звуковыми волнами, голографический нейроинтерфейс, тёмный фон',
    description: 'Для сводных аудиовыпусков и NotebookLM подкастов (квадрат 1:1)',
  },
  {
    id: 'changelog',
    label: 'Changelog / Релиз',
    icon: '🚀',
    styleId: 'changelog-blueprint',
    aspectRatio: '16:9',
    promptPrefix: 'Технологический релиз и обновление API/системы:',
    promptSuffix: 'модульная 3D-архитектура, светящиеся инженерные чертежи, сборка нового ядра',
    description: 'Для дайджестов обновлений, миграций веток, релиз-ноутов и патчей',
  },
  {
    id: 'security-alert',
    label: 'Security / CVE',
    icon: '🛡️',
    styleId: 'cyber-security',
    aspectRatio: '16:9',
    promptPrefix: 'Информационная безопасность и киберзащита:',
    promptSuffix: 'цифровая крепость, голографический щит, анализ уязвимостей Zero-Day, мониторы SOC-центра',
    description: 'Для новостей ИБ, разборов уязвимостей (CVE), инцидентов и защиты',
  },
  {
    id: 'llm-agents',
    label: 'AI Модели & Агенты',
    icon: '🧠',
    styleId: 'ai-neural',
    aspectRatio: '16:9',
    promptPrefix: 'Искусственный интеллект и автономные агенты:',
    promptSuffix: 'светящаяся нейронная сеть, потоки токенов и кристаллическое ядро ИИ',
    description: 'Для новостей про Gemini, GPT, Claude, LLM-агентов и Deep Research',
  },
  {
    id: 'cloud-devops',
    label: 'Cloud & DevOps',
    icon: '☁️',
    styleId: 'isometric-tech',
    aspectRatio: '16:9',
    promptPrefix: 'Облачная инфраструктура и распределённые системы:',
    promptSuffix: 'изометрический 3D-кластер серверов, светящиеся потоки данных и контейнеры',
    description: 'Для заметок по DevOps, Kubernetes, базам данных и системной архитектуре',
  },
  {
    id: 'hardware-silicon',
    label: 'Чипы & Hardware',
    icon: '🔬',
    styleId: 'silicon-hardware',
    aspectRatio: '16:9',
    promptPrefix: 'Высокотехнологичное железо и микроэлектроника:',
    promptSuffix: 'макросъёмка кремниевого кристалла, золотые микросхемы, лазерная литография',
    description: 'Для обзоров GPU, процессоров, дата-центров и квантовых компьютеров',
  },
];

export const FEED_IT_SCENE_MODIFIERS: FeedItSceneModifier[] = [
  {
    id: 'dark-glass',
    label: 'Dark Glass',
    icon: '🪟',
    snippet: 'полупрозрачные тёмные стеклянные панели (dark mode glassmorphism UI)',
  },
  {
    id: 'audio-waves',
    label: 'Аудиоволны',
    icon: '〰️',
    snippet: 'светящиеся неоновые звуковые волны и эквалайзер',
  },
  {
    id: 'hud-telemetry',
    label: 'HUD Телеметрия',
    icon: '🎯',
    snippet: 'голографический интерфейс телеметрии и системной аналитики',
  },
  {
    id: 'threat-shield',
    label: 'Кибер-щит',
    icon: '🔐',
    snippet: 'криптографический защитный купол с контрастным красно-синим свечением',
  },
  {
    id: 'code-matrix',
    label: 'Матрица кода',
    icon: '💻',
    snippet: 'парящие строки исходного кода и терминальные команды в расфокусе',
  },
  {
    id: 'server-cluster',
    label: 'Дата-центр',
    icon: '🖧',
    snippet: 'высокотехнологичный серверный зал с оптоволоконной подсветкой',
  },
  {
    id: 'octane-3d',
    label: 'Octane 3D',
    icon: '✨',
    snippet: 'студийный 3D-рендер Octane, трассировка лучей, мягкое глобальное освещение',
  },
];

export const FEED_ASPECT_RATIOS: Array<{
  id: FeedCoverAspectRatio;
  label: string;
  icon: string;
}> = [
  { id: '16:9', label: '16:9 Баннер', icon: '▬' },
  { id: '1:1', label: '1:1 Подкаст', icon: '◼' },
  { id: '4:3', label: '4:3 Классика', icon: '▭' },
  { id: '9:16', label: '9:16 Сториз', icon: '▮' },
];
