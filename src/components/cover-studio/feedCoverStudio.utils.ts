import {
  FeedCoverAspectRatio,
  FEED_IT_WORKFLOW_TEMPLATES,
  FEED_STYLE_PRESETS,
} from './feedCoverStudio.constants';

export interface FeedItStyleRecommendation {
  styleId: string;
  templateId?: string;
  aspectRatio: FeedCoverAspectRatio;
  reason: string;
}

interface DetectionRule {
  match: (text: string) => boolean;
  recommendation: FeedItStyleRecommendation;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    match: (text) =>
      /(подкаст|podcast|аудио|выпуск|эфир|notebooklm|интервью|разговор|слушать)/i.test(text),
    recommendation: {
      styleId: 'podcast-neon',
      templateId: 'ai-podcast',
      aspectRatio: '1:1',
      reason: 'Тема подкаста / аудиовыпуска (рекомендуется Podcast Neon)',
    },
  },
  {
    match: (text) =>
      /(cve-|zero-day|0-day|уязвимост|взлом|хакер|атак|безопасност|security|ddos|шифрован|утечк|ransomware|soc|phishing|фишинг|эксплойт|exploit)/i.test(
        text,
      ),
    recommendation: {
      styleId: 'cyber-security',
      templateId: 'security-alert',
      aspectRatio: '16:9',
      reason: 'Тема ИБ / Security / уязвимостей (рекомендуется Security / SOC)',
    },
  },
  {
    match: (text) =>
      /(changelog|релиз|обновлен|верси|патч|patch|release|v\d+\.\d+|миграц|переход на ветк|отключен.*legacy|breaking change|деплой|api)/i.test(
        text,
      ),
    recommendation: {
      styleId: 'changelog-blueprint',
      templateId: 'changelog',
      aspectRatio: '16:9',
      reason: 'Тема релиза / обновления API / Changelog (рекомендуется Changelog / Релиз)',
    },
  },
  {
    match: (text) =>
      /(llm|нейросет|искусственн.*интеллект|\bai\b|\bии\b|gemini|gpt|claude|агент|deep research|модел|инференс|токен|обучен)/i.test(
        text,
      ),
    recommendation: {
      styleId: 'ai-neural',
      templateId: 'llm-agents',
      aspectRatio: '16:9',
      reason: 'Тема AI / LLM / нейросетей (рекомендуется AI / Нейросеть)',
    },
  },
  {
    match: (text) =>
      /(gpu|nvidia|процессор|чип|кремни|квантов|hardware|железо|серверн.*стойк|arm|tpu|литограф)/i.test(
        text,
      ),
    recommendation: {
      styleId: 'silicon-hardware',
      templateId: 'hardware-silicon',
      aspectRatio: '16:9',
      reason: 'Тема Hardware / чипов / GPU (рекомендуется Чипы / Hardware)',
    },
  },
  {
    match: (text) =>
      /(kubernetes|k8s|docker|cloud|облак|devops|микросервис|архитектур|postgres|баз.*данных|кластер|ci\/cd|бэкенд|инфраструктур)/i.test(
        text,
      ),
    recommendation: {
      styleId: 'isometric-tech',
      templateId: 'cloud-devops',
      aspectRatio: '16:9',
      reason: 'Тема Cloud / DevOps / архитектуры (рекомендуется 3D Изометрия)',
    },
  },
  {
    match: (text) => /(linux|cli|терминал|консоль|open source|git|bash|ядро|компилятор)/i.test(text),
    recommendation: {
      styleId: 'terminal-retro',
      aspectRatio: '16:9',
      reason: 'Тема кода / терминала / Open Source (рекомендуется Терминал / Код)',
    },
  },
];

export function detectFeedItStyleRecommendation(
  title?: string,
  description?: string,
  hashtags?: string[],
  feedSlug?: string,
): FeedItStyleRecommendation | null {
  const combined = [title || '', description || '', (hashtags || []).join(' '), feedSlug || '']
    .join(' ')
    .trim();
  if (!combined) return null;

  const matched = DETECTION_RULES.find((rule) => rule.match(combined));
  return matched ? matched.recommendation : null;
}

export function buildFeedTemplatePrompt(
  templateId: string,
  baseTopic: string,
): { prompt: string; styleId: string; aspectRatio: FeedCoverAspectRatio } | null {
  const template = FEED_IT_WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const cleanTopic = baseTopic
    .replace(/^Обложка IT и AI подкаста:\s*/i, '')
    .replace(/^Технологический релиз и обновление API\/системы:\s*/i, '')
    .replace(/^Информационная безопасность и киберзащита:\s*/i, '')
    .replace(/^Искусственный интеллект и автономные агенты:\s*/i, '')
    .replace(/^Облачная инфраструктура и распределённые системы:\s*/i, '')
    .replace(/^Высокотехнологичное железо и микроэлектроника:\s*/i, '')
    .split(' — ')[0]
    .trim();

  const coreSubject = cleanTopic || 'Современные информационные технологии';
  const prompt = `${template.promptPrefix} ${coreSubject} — ${template.promptSuffix}`;

  return {
    prompt,
    styleId: template.styleId,
    aspectRatio: template.aspectRatio,
  };
}

export function toggleFeedModifierInPrompt(currentPrompt: string, snippet: string): string {
  if (currentPrompt.includes(snippet)) {
    return currentPrompt
      .replace(new RegExp(`,?\\s*${escapeRegExp(snippet)}`, 'gi'), '')
      .replace(/^,\s*/, '')
      .trim();
  }
  const base = currentPrompt.trim();
  return base ? `${base}, ${snippet}` : snippet;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getFeedStylePresetById(styleId: string) {
  return FEED_STYLE_PRESETS.find((s) => s.id === styleId);
}
