import { describe, it, expect } from 'vitest';
import { createConfiguredFeedAdapter } from '../configuredFeedAdapter';
import { DEFAULT_FEED_MODES } from '../../../components/toolbar/types';
import type { Note } from '@lenta/shared';

describe('createConfiguredFeedAdapter with DEFAULT_FEED_MODES', () => {
  const sampleNotes: Note[] = [
    {
      id: 'n-ai-1',
      title: 'Claude 3.7 Sonnet Announcement',
      description: 'Hybrid reasoning model release',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' },
      hashtags: [{ name: 'ai' }, { name: 'release' }],
      folderPath: 'Spark/AI/Claude.md',
    } as any,
    {
      id: 'n-seasons-1',
      title: 'Daily Log 31.10.2026',
      description: 'Working on feed architecture refactoring',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-daily', slug: 'daily-logs', title: 'Daily Logs', privacy: 'public' },
      hashtags: [{ name: 'daily' }, { name: 'lemon' }],
      folderPath: '01_daily_logs/2026-10-31.md',
    } as any,
    {
      id: 'n-entertainment-1',
      title: 'Avengers: Secret Wars Teaser',
      description: 'New details from Marvel Studios',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-marvel', slug: 'marvel', title: 'Marvel Universe', privacy: 'public' },
      hashtags: [{ name: 'marvel' }, { name: 'cinema' }],
      folderPath: 'Entertainment/Marvel.md',
    } as any,
    {
      id: 'n-holiday-1',
      title: 'День народного единства',
      description: 'Государственный праздник РФ',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-11-04'),
      feed: { id: 'f-holidays', slug: 'russian-holidays', title: 'Праздники РФ', privacy: 'public' },
      hashtags: [{ name: 'holiday' }],
      folderPath: 'Holidays/Russia.md',
    } as any,
    {
      id: 'n-private-1',
      title: 'Internal Architecture Spec',
      description: 'Confidential system design doc',
      privacy: 'private',
      status: 'DRAFT',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-priv', slug: 'work-vault', title: 'Work Vault', privacy: 'private' },
      hashtags: [{ name: 'private' }],
      folderPath: 'private/architecture.md',
    } as any,
    {
      id: 'n-cl-google',
      title: 'Gemini 2.5 Flash Update',
      description: 'Google AI changelog release notes',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-cl-google', slug: 'spark-changelogsfeed-google', title: 'Google (Changelogs)', privacy: 'public' },
      hashtags: [{ name: 'changelog' }, { name: 'google' }],
      folderPath: 'Spark/changelogsfeed/google/gemini-2-5.md',
    } as any,
    {
      id: 'n-cl-openai',
      title: 'OpenAI Responses API GA',
      description: 'OpenAI changelog release notes',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      feed: { id: 'f-cl-openai', slug: 'spark-changelogsfeed-openai', title: 'OpenAI (Changelogs)', privacy: 'public' },
      hashtags: [{ name: 'changelog' }, { name: 'openai' }],
      folderPath: 'Spark/changelogsfeed/openai/responses-api.md',
    } as any,
    {
      id: 'n-cl-anthropic',
      title: 'Claude Code CLI Release',
      description: 'Anthropic engineering updates',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-10-31'),
      metadata: { vendor: 'anthropic' },
      hashtags: [{ name: 'changelog' }],
      folderPath: 'Spark/changelogs/anthropic/claude-code.md',
    } as any,
  ];

  it('correctly adapts IT & Dev notes based on filterConfig', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    expect(itDevMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(itDevMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-ai-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-entertainment-1')).toBe(false);
    expect(adapted.some((item) => item.id === 'n-private-1')).toBe(false);
  });

  it('correctly adapts Seasons notes based on filterConfig', () => {
    const seasonsMode = DEFAULT_FEED_MODES.find((m) => m.id === 'seasons')!;
    expect(seasonsMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(seasonsMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-seasons-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-ai-1')).toBe(false);
  });

  it('correctly adapts Entertainment notes based on filterConfig', () => {
    const entMode = DEFAULT_FEED_MODES.find((m) => m.id === 'entertainment')!;
    expect(entMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(entMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-entertainment-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-holiday-1')).toBe(false);
  });

  it('correctly adapts Holidays notes based on filterConfig', () => {
    const holidaysMode = DEFAULT_FEED_MODES.find((m) => m.id === 'holidays')!;
    expect(holidaysMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(holidaysMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.some((item) => item.id === 'n-holiday-1')).toBe(true);
    expect(adapted.some((item) => item.id === 'n-seasons-1')).toBe(false);
  });

  it('strictly isolates Private notes when privacy=private filter is configured', () => {
    const privateMode = DEFAULT_FEED_MODES.find((m) => m.id === 'private_feeds')!;
    expect(privateMode).toBeDefined();
    const adapter = createConfiguredFeedAdapter(privateMode);

    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.length).toBe(1);
    expect(adapted[0].id).toBe('n-private-1');
  });

  it('generates thematic tabs for matching feeds', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    const adapter = createConfiguredFeedAdapter(itDevMode);

    const tabs = adapter.getTabs({
      allFeeds: [{ id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' }],
      notes: sampleNotes,
    });

    expect(tabs.some((t) => t.slug === 'spark-ai')).toBe(true);
  });

  it('generates rolled-up Changelogs & Релизы tab with nested subtopics for child folders', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    const adapter = createConfiguredFeedAdapter(itDevMode);

    const tabs = adapter.getTabs({
      allFeeds: [
        { id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' },
        { id: 'f-cl-parent', slug: 'spark-changelogsfeed', title: 'Changelogs & Релизы (Spark)', privacy: 'public' },
        { id: 'f-cl-google', slug: 'spark-changelogsfeed-google', title: 'Google (Changelogs)', privacy: 'public' },
      ],
      notes: sampleNotes,
    });

    const changelogsTab = tabs.find((t) => t.slug === 'spark-changelogsfeed');
    expect(changelogsTab).toBeDefined();
    expect(changelogsTab!.count).toBe(3); // google, openai, anthropic
    expect(changelogsTab!.subtopics).toBeDefined();
    expect(changelogsTab!.subtopics!.length).toBeGreaterThanOrEqual(3);

    const subGoogle = changelogsTab!.subtopics!.find((s) => s.subfolder === 'google');
    expect(subGoogle).toBeDefined();
    expect(subGoogle!.count).toBe(1);

    const subOpenai = changelogsTab!.subtopics!.find((s) => s.subfolder === 'openai');
    expect(subOpenai).toBeDefined();
    expect(subOpenai!.count).toBe(1);

    const subAnthropic = changelogsTab!.subtopics!.find((s) => s.subfolder === 'anthropic');
    expect(subAnthropic).toBeDefined();
    expect(subAnthropic!.count).toBe(1);

    // Child feeds must NOT appear as separate duplicate root tabs
    expect(tabs.some((t) => t.slug === 'spark-changelogsfeed-google')).toBe(false);
  });

  it('adapts notes for all changelogs general stream via spark-changelogsfeed or changelogs alias', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    const adapter = createConfiguredFeedAdapter(itDevMode);

    // Both canonical slug and alias should return all 3 changelogs notes
    const canonicalAdapted = adapter.adaptNotes(sampleNotes, 'spark-changelogsfeed');
    expect(canonicalAdapted.length).toBe(3);
    expect(canonicalAdapted.map((i) => i.id).sort()).toEqual(['n-cl-anthropic', 'n-cl-google', 'n-cl-openai']);

    const aliasAdapted = adapter.adaptNotes(sampleNotes, 'changelogs');
    expect(aliasAdapted.length).toBe(3);
    expect(aliasAdapted.map((i) => i.id).sort()).toEqual(['n-cl-anthropic', 'n-cl-google', 'n-cl-openai']);
  });

  it('filters notes by specific vendor subtopic (e.g. Google or OpenAI)', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    const adapter = createConfiguredFeedAdapter(itDevMode);

    const googleAdapted = adapter.adaptNotes(sampleNotes, 'spark-changelogsfeed-google');
    expect(googleAdapted.length).toBe(1);
    expect(googleAdapted[0].id).toBe('n-cl-google');
    expect(googleAdapted[0].channelTitle).toBe('Google Changelog');
    expect(googleAdapted[0].avatarIcon).toBe('🌐');

    const openaiAdapted = adapter.adaptNotes(sampleNotes, 'spark-changelogsfeed-openai');
    expect(openaiAdapted.length).toBe(1);
    expect(openaiAdapted[0].id).toBe('n-cl-openai');
    expect(openaiAdapted[0].channelTitle).toBe('OpenAI Changelog');
    expect(openaiAdapted[0].avatarIcon).toBe('🧠');
  });

  it('resolves changelog subtopic via frontmatter vendor metadata or hashtag', () => {
    const itDevMode = DEFAULT_FEED_MODES.find((m) => m.id === 'it_dev')!;
    const adapter = createConfiguredFeedAdapter(itDevMode);

    const anthropicAdapted = adapter.adaptNotes(sampleNotes, 'spark-changelogsfeed-anthropic');
    expect(anthropicAdapted.length).toBe(1);
    expect(anthropicAdapted[0].id).toBe('n-cl-anthropic');
    expect(anthropicAdapted[0].channelTitle).toBe('Anthropic Changelog');
    expect(anthropicAdapted[0].avatarIcon).toBe('⚡');
  });

  it('does not leak orphan notes without a feed into specific feed tabs (e.g. world-of-warcraft)', () => {
    const entMode = DEFAULT_FEED_MODES.find((m) => m.id === 'entertainment')!;
    const adapter = createConfiguredFeedAdapter(entMode);

    const orphanNote: Note = {
      id: 'n-orphan-smoke',
      title: 'Seeded Smoke Note Welcome',
      description: 'Automated test note without feed',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-11-01'),
      feed: null,
      folderPath: null,
      hashtags: [],
    } as any;

    const adapted = adapter.adaptNotes([...sampleNotes, orphanNote], 'spark-world-of-warcraft');
    expect(adapted.some((n) => n.id === 'n-orphan-smoke')).toBe(false);
  });

  it('creates a clean empty workspace tab by default when no source criteria are configured', () => {
    const customWorkingSpace = {
      id: 'working_space',
      label: 'Working Space',
      emoji: '✨',
      filterConfig: {}, // Clean slate: no feedSlugs, tags, or folderPaths
    };
    const adapter = createConfiguredFeedAdapter(customWorkingSpace as any);

    // It should not match existing sample notes from other feeds
    const adapted = adapter.adaptNotes(sampleNotes);
    expect(adapted.length).toBe(0);

    // It should not generate sub-tabs for unrelated feeds
    const tabs = adapter.getTabs({
      allFeeds: [
        { id: 'f-ai', slug: 'spark-ai', title: 'AI & Нейросети', privacy: 'public' },
        { id: 'f-daily', slug: 'daily-logs', title: 'Daily Logs', privacy: 'public' },
      ],
      notes: sampleNotes,
    });
    expect(tabs.length).toBe(0);
  });

  it('allows matching notes explicitly created with or tagged for the custom workspace tab', () => {
    const customWorkingSpace = {
      id: 'working_space',
      label: 'Working Space',
      emoji: '✨',
      filterConfig: {},
    };
    const adapter = createConfiguredFeedAdapter(customWorkingSpace as any);

    const workspaceNote: Note = {
      id: 'n-ws-1',
      title: 'Sprint Planning Notes',
      description: 'Personal plan for the upcoming sprint',
      privacy: 'public',
      status: 'PUBLISHED',
      startDate: new Date('2026-11-02'),
      feed: { id: 'f-ws', slug: 'working_space', title: 'Working Space' } as any,
      hashtags: [{ name: 'working_space' }],
      folderPath: 'working_space/sprint.md',
    } as any;

    const adapted = adapter.adaptNotes([...sampleNotes, workspaceNote]);
    expect(adapted.length).toBe(1);
    expect(adapted[0].id).toBe('n-ws-1');
  });

  it('excludes public feed notes when custom tab is configured with privacy=private', () => {
    const privateCustomTab = {
      id: 'private_workspace',
      label: 'Private Workspace',
      emoji: '🔒',
      filterConfig: {
        privacy: 'private' as const,
      },
    };
    const adapter = createConfiguredFeedAdapter(privateCustomTab as any);

    // Public feed notes (even if incubator notes) must be rejected
    const publicFeedNote: Note = {
      id: 'n-spark-incubator',
      title: 'Public AI News In Incubator',
      description: 'News item',
      privacy: 'private', // Incubator status
      feed: { id: 'f-ai', slug: 'spark-ai', title: 'AI News', privacy: 'public' } as any,
      folderPath: 'spark/ai/news.md',
    } as any;

    const adapted = adapter.adaptNotes([publicFeedNote]);
    expect(adapted.length).toBe(0);
  });

  it('includes custom database feeds (e.g. "My Music") in entertainment tab even with 0 notes', () => {
    const entertainmentMode = DEFAULT_FEED_MODES.find((m) => m.id === 'entertainment')!;
    const adapter = createConfiguredFeedAdapter(entertainmentMode);

    const allFeeds = [
      {
        id: 'ef76023f-e39b-4fa2-8354-7efe8f9c2ca7',
        title: 'My Music',
        slug: 'my-music',
        icon: '📁',
        color: '#2481cc',
        privacy: 'public',
        folderPaths: [],
        hashtags: [],
      },
    ];

    // Zero notes in database for this feed
    const tabs = adapter.getTabs({ allFeeds, notes: [] });
    const myMusicTab = tabs.find((t) => t.slug === 'my-music');
    expect(myMusicTab).toBeDefined();
    expect(myMusicTab?.title).toBe('My Music');
    expect(myMusicTab?.count).toBe(0);
    expect(myMusicTab?.id).toBe('ef76023f-e39b-4fa2-8354-7efe8f9c2ca7');
  });
});
