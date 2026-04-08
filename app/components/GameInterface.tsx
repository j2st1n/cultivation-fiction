'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Globe, Save, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useGameStore } from '@/app/store/gameStore';
import { useSettingsStore } from '@/app/store/settingsStore';
import { streamChat } from '@/app/lib/ai';
import { INITIAL_STORY, parseChoicesFromResponse, checkRequiresInput, buildContextMessage, detectRealmUpgrade, extractCurrentObjective, extractKeyClues, extractMainStoryArc, extractRecentProgress, mergeKeyClues, shouldAdvanceRealm, shouldUpdateCurrentObjective, shouldUpdateRecentProgress, shouldUpdateStoryArc, stripInteractiveBlocks, stripStoryStateBlock } from '@/app/lib/story';
import type { CultivationRealm, Message } from '@/app/types/game';
import type { ReadingTheme } from '@/app/store/settingsStore';

const MALE_PLAIN_NAMES = ['阿木', '阿石', '阿川', '阿山', '阿林', '阿河', '阿生', '阿顺', '阿安', '阿旺', '石头', '柱子', '虎子', '川子', '平安', '长生'];
const FEMALE_PLAIN_NAMES = ['阿禾', '阿桃', '阿杏', '阿兰', '阿梅', '阿菊', '阿秋', '阿宁', '阿柔', '阿月', '小满', '春桃', '秋禾', '素娘', '阿芷', '阿音'];
const NEUTRAL_PLAIN_NAMES = ['小满', '长风', '听雨', '云生', '知远', '清禾', '怀川', '归年', '青禾', '安宁'];
const MALE_GIVEN_PREFIXES = ['知', '怀', '清', '长', '行', '景', '明', '承', '远', '云'];
const MALE_GIVEN_SUFFIXES = ['远', '安', '川', '生', '舟', '山', '宁', '河', '松', '野'];
const FEMALE_GIVEN_PREFIXES = ['清', '知', '青', '素', '听', '映', '扶', '明', '晚', '静'];
const FEMALE_GIVEN_SUFFIXES = ['禾', '宁', '音', '月', '溪', '萝', '荷', '秋', '岚', '雪'];
const NEUTRAL_GIVEN_PREFIXES = ['云', '归', '星', '望', '青', '知', '长', '听', '临', '照'];
const NEUTRAL_GIVEN_SUFFIXES = ['川', '舟', '尘', '宁', '秋', '澜', '野', '歌', '生', '遥'];
const GITHUB_URL = 'https://github.com/j2st1n/cultivation-fiction';
const BLOG_URL = 'https://bins.blog';
const BLOG_ICON_URL = '/bins-blog-icon.png';
const APP_VERSION = '0.5.1';

const THEME_STYLES: Record<ReadingTheme, {
  app: string;
  header: string;
  title: string;
  subtle: string;
  name: string;
  realm: string;
  iconButton: string;
  assistantCard: string;
  userCard: string;
  streamingCard: string;
  choiceButton: string;
  input: string;
  primaryButton: string;
  modal: string;
  panel: string;
  panelText: string;
  panelSubtle: string;
  markdown: string;
}> = {
  night: {
    app: 'bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100',
    header: 'border-b border-slate-700/50 bg-slate-900/50',
    title: 'from-cyan-400 to-purple-400',
    subtle: 'text-slate-500',
    name: 'text-slate-400',
    realm: 'bg-purple-900/50 text-purple-300',
    iconButton: 'border border-slate-700/70 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-slate-100',
    assistantCard: 'bg-slate-800/50 border border-slate-700/50 text-slate-200',
    userCard: 'bg-slate-700/30 text-slate-300',
    streamingCard: 'bg-slate-800/50 border border-slate-700/50 text-slate-200',
    choiceButton: 'bg-slate-800/80 border border-slate-600 hover:border-cyan-500/50 hover:bg-slate-700/80',
    input: 'bg-slate-700 border-slate-500 text-white placeholder:text-slate-400 focus:border-cyan-500',
    primaryButton: 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white',
    modal: 'bg-black/50',
    panel: 'bg-slate-800 border border-slate-600',
    panelText: 'text-slate-200',
    panelSubtle: 'text-slate-500',
    markdown: 'prose-invert prose-strong:text-slate-100 prose-headings:text-slate-100',
  },
  bamboo: {
    app: 'bg-gradient-to-b from-[#18231d] to-[#24332a] text-[#e7f0e5]',
    header: 'border-b border-[#415846]/50 bg-[#18231d]/75',
    title: 'from-[#b7d99c] to-[#7fb38a]',
    subtle: 'text-[#91a793]',
    name: 'text-[#b8c8b5]',
    realm: 'bg-[#375143]/70 text-[#d0e6cc]',
    iconButton: 'border border-[#405644]/70 bg-[#223127]/70 text-[#aac1ad] hover:border-[#8fb38d] hover:text-[#eff7eb]',
    assistantCard: 'bg-[#223127]/75 border border-[#405644]/55 text-[#eef5ea]',
    userCard: 'bg-[#304236]/45 text-[#d4dfd0]',
    streamingCard: 'bg-[#223127]/75 border border-[#405644]/55 text-[#eef5ea]',
    choiceButton: 'bg-[#223127]/85 border border-[#415846] hover:border-[#9ac494] hover:bg-[#2b3d31]',
    input: 'bg-[#223127] border-[#49604d] text-[#edf6ea] placeholder:text-[#93a897] focus:border-[#a9cd9f]',
    primaryButton: 'bg-gradient-to-r from-[#4b7a56] to-[#6ea16c] hover:from-[#56875f] hover:to-[#7fb77a] text-white',
    modal: 'bg-black/45',
    panel: 'bg-[#223127] border border-[#49604d]',
    panelText: 'text-[#eef5ea]',
    panelSubtle: 'text-[#93a897]',
    markdown: 'prose-invert prose-strong:text-[#f3faef] prose-headings:text-[#f3faef]',
  },
  paper: {
    app: 'bg-gradient-to-b from-[#f1e8d6] to-[#e5d8bf] text-[#3f3427]',
    header: 'border-b border-[#c9b99e]/70 bg-[#f5ecd9]/85',
    title: 'from-[#70583a] to-[#a27a45]',
    subtle: 'text-[#8b7a63]',
    name: 'text-[#5f503d]',
    realm: 'bg-[#d8c5a0]/80 text-[#654e2d]',
    iconButton: 'border border-[#ccb998] bg-[#f8f1e3]/80 text-[#6a5a46] hover:border-[#9a7d52] hover:text-[#3d3022]',
    assistantCard: 'bg-[#f7f0e2]/90 border border-[#d4c1a0]/70 text-[#3d3125]',
    userCard: 'bg-[#eadcc3]/65 text-[#5d503f]',
    streamingCard: 'bg-[#f7f0e2]/90 border border-[#d4c1a0]/70 text-[#3d3125]',
    choiceButton: 'bg-[#f8f1e4]/90 border border-[#d0bb97] hover:border-[#a78757] hover:bg-[#efe4ca]',
    input: 'bg-[#faf5e9] border-[#ccb791] text-[#3d3125] placeholder:text-[#8a775f] focus:border-[#a88754]',
    primaryButton: 'bg-gradient-to-r from-[#9a7745] to-[#bf9a67] hover:from-[#a98450] hover:to-[#cfa672] text-white',
    modal: 'bg-[#2b241c]/35',
    panel: 'bg-[#f7f0e2] border border-[#d2be9b]',
    panelText: 'text-[#3d3125]',
    panelSubtle: 'text-[#8a775f]',
    markdown: 'prose prose-slate prose-strong:text-[#3d3125] prose-headings:text-[#3d3125]',
  },
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateComposedName(prefixes: string[], suffixes: string[]): string {
  const prefix = pickRandom(prefixes);
  const suffix = pickRandom(suffixes);
  return prefix === suffix ? `${prefix}${pickRandom(suffixes)}` : `${prefix}${suffix}`;
}

function generateRandomName(gender: '男' | '女'): string {
  const styleRoll = Math.random();

  if (gender === '男') {
    if (styleRoll < 0.55) return pickRandom(MALE_PLAIN_NAMES);
    if (styleRoll < 0.85) return generateComposedName(MALE_GIVEN_PREFIXES, MALE_GIVEN_SUFFIXES);
    return pickRandom(NEUTRAL_PLAIN_NAMES);
  }

  if (styleRoll < 0.55) return pickRandom(FEMALE_PLAIN_NAMES);
  if (styleRoll < 0.85) return generateComposedName(FEMALE_GIVEN_PREFIXES, FEMALE_GIVEN_SUFFIXES);
  return pickRandom(NEUTRAL_PLAIN_NAMES);
}

function generateInitialName(): string {
  const defaultGender: '男' | '女' = Math.random() > 0.5 ? '男' : '女';
  return generateRandomName(defaultGender);
}

function Typewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (text === '') {
      setDisplayed('');
      indexRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <p className="whitespace-pre-wrap leading-relaxed">{displayed}</p>;
}

function GitHubIconLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub Repository"
      title="GitHub Repository"
      className={`inline-flex items-center justify-center transition-colors ${className}`.trim()}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.203 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.921.678 1.857 0 1.34-.012 2.42-.012 2.75 0 .269.18.58.688.481A10.019 10.019 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z" />
      </svg>
    </a>
  );
}

function BlogIconLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={BLOG_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="bins.blog"
      title="bins.blog"
      className={`inline-flex items-center justify-center transition-colors ${className}`.trim()}
    >
      <img
        src={BLOG_ICON_URL}
        alt="bins.blog"
        className="h-5 w-5 rounded-sm"
      />
    </a>
  );
}

function HeaderIconButton({
  title,
  onClick,
  themeClass,
  children,
}: {
  title: string;
  onClick: () => void;
  themeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${themeClass}`}
      title={title}
      aria-label={title}
      type="button"
    >
      {children}
    </button>
  );
}

function ScrollJumpButton({
  title,
  onClick,
  themeClass,
  children,
}: {
  title: string;
  onClick: () => void;
  themeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-sm transition-all sm:h-10 sm:w-10 ${themeClass}`}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}

function StoryMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-strong:text-slate-100 prose-strong:font-semibold prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:text-slate-100">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

function ThemedStoryMarkdown({ content, themeClass }: { content: string; themeClass: string }) {
  return (
    <div className={`prose max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 ${themeClass}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

function applyResponseStateUpdates({
  text,
  currentRealm,
  mainStoryArc,
  currentObjective,
  recentProgress,
  keyClues,
  advanceRealm,
  updateWorld,
}: {
  text: string;
  currentRealm: CultivationRealm;
  mainStoryArc: string;
  currentObjective: string;
  recentProgress: string;
  keyClues: string[];
  advanceRealm: (newRealm: import('@/app/types/game').CultivationRealm) => void;
  updateWorld: (updates: Partial<import('@/app/types/game').WorldState>) => void;
}) {
  const nextRealm = detectRealmUpgrade(text);
  if (shouldAdvanceRealm(currentRealm, nextRealm)) {
    advanceRealm(nextRealm);
  }

  const nextArc = extractMainStoryArc(text);
  const nextObjective = extractCurrentObjective(text);
  const nextProgress = extractRecentProgress(text);
  const nextClues = extractKeyClues(text);
  const updates: Partial<import('@/app/types/game').WorldState> = {};

  if (shouldUpdateStoryArc(nextArc, mainStoryArc)) {
    updates.mainStoryArc = nextArc;
  }

  if (shouldUpdateCurrentObjective(nextObjective, currentObjective)) {
    updates.currentObjective = nextObjective;
  }

  if (shouldUpdateRecentProgress(nextProgress, recentProgress)) {
    updates.recentProgress = nextProgress;
  }

  const mergedClues = mergeKeyClues(keyClues, nextClues);
  if (mergedClues.length !== keyClues.length) {
    updates.keyClues = mergedClues;
  }

  if (Object.keys(updates).length > 0) {
    updateWorld(updates);
  }
}

export default function GameInterface() {
  const { player } = useGameStore();
  const { api, isValidated } = useSettingsStore();

  const hasPlayer = Boolean(player.name);
  const hasApi = Boolean(api.endpoint && api.apiKey && isValidated);

  if (!hasPlayer || !hasApi) {
    return <InitialSetup initialStep={hasPlayer ? 'api' : 'name'} />;
  }

  return <GameScreen />;
}

function GameScreen() {
  const { 
    player, 
    world, 
    messages, 
    addMessage, 
    setGenerating, 
    isGenerating,
    storyProgress,
    updatePlayer,
    updateWorld,
    advanceRealm,
    resetGame,
  } = useGameStore();
  
  const { api, isValidated, readingTheme } = useSettingsStore();
  const theme = THEME_STYLES[readingTheme];
  const [currentText, setCurrentText] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [requiresInput, setRequiresInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [showWorldPanel, setShowWorldPanel] = useState(false);
  const [showStoryPanel, setShowStoryPanel] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const streamedResponseRef = useRef('');
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  const isInitialized = player.name && api.endpoint && isValidated;

  const resetStreamingState = () => {
    streamedResponseRef.current = '';
    setCurrentText('');
  };

  const handleVisibleChunk = (chunk: string) => {
    streamedResponseRef.current += chunk;
    setCurrentText(stripInteractiveBlocks(streamedResponseRef.current));
  };

  const finalizeResponse = (text: string) => {
    applyResponseStateUpdates({
      text,
      currentRealm: player.realm,
      mainStoryArc: world.mainStoryArc,
      currentObjective: world.currentObjective,
      recentProgress: world.recentProgress,
      keyClues: world.keyClues,
      advanceRealm,
      updateWorld,
    });

    const aiMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: stripInteractiveBlocks(text),
      timestamp: Date.now(),
    };

    addMessage(aiMessage);
    resetStreamingState();
    setChoices(parseChoicesFromResponse(text));
    setRequiresInput(checkRequiresInput(text));
    setGenerating(false);
  };

  const startGame = useCallback(async () => {
    if (!player.name || !isInitialized) return;
    
    setGenerating(true);
    resetStreamingState();
    
    const initialMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'system',
      content: `开始修仙之旅。玩家${player.name}，性别${player.gender}，境界${player.realm}，地点${world.currentLocation}。请根据以下要求直接生成本次独立开局：\n\n${INITIAL_STORY}`,
      timestamp: Date.now(),
    };

    const fullMessages: Message[] = [initialMessage];
    
    await streamChat(fullMessages, {
      onChunk: handleVisibleChunk,
      onComplete: finalizeResponse,
      onError: (error) => {
        setCurrentText(`错误: ${error.message}`);
        setGenerating(false);
      },
    });
  }, [player.name, player.gender, player.realm, world.currentLocation, isInitialized, addMessage, advanceRealm, updateWorld, world.mainStoryArc, world.currentObjective, world.recentProgress, world.keyClues, setGenerating]);

  useEffect(() => {
    if (isInitialized && player.name && !messages.length && !isGenerating) {
      startGame();
    }
  }, [startGame, isInitialized, player.name, messages.length, isGenerating]);

  useEffect(() => {
    const updateScrollState = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = documentHeight - (scrollTop + viewportHeight);

      setShowScrollButtons(scrollTop > 240);
      setIsNearBottom(distanceFromBottom < 180);
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, currentText, choices, isNearBottom]);

  const scrollToTop = () => {
    topAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToBottom = () => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleChoice = async (choiceText: string) => {
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: choiceText,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    
    resetStreamingState();
    setChoices([]);
    setGenerating(true);
    
    const contextMsg = buildContextMessage(
      player.name,
      player.realm,
      world.currentLocation,
      world.mainStoryArc,
      world.currentObjective,
      world.recentProgress,
      world.keyClues,
      storyProgress
    );
    
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      role: 'user',
      content: `当前状态：${contextMsg}\n\n请根据玩家的选择继续叙事。`,
      timestamp: Date.now(),
    };
    
    const fullMessages: Message[] = [...messages, userMessage];
    await streamChat([systemMessage, ...fullMessages], {
      onChunk: handleVisibleChunk,
      onComplete: finalizeResponse,
      onError: (error) => {
        setErrorMsg(error.message);
        resetStreamingState();
        setGenerating(false);
      },
    });
  };

  const handleChoiceRetry = async () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user') return;
    
    setErrorMsg(null);
    setGenerating(true);
    resetStreamingState();
    
    const contextMsg = buildContextMessage(
      player.name,
      player.realm,
      world.currentLocation,
      world.mainStoryArc,
      world.currentObjective,
      world.recentProgress,
      world.keyClues,
      storyProgress
    );
    
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      role: 'user',
      content: `当前状态：${contextMsg}\n\n请重新生成选项。`,
      timestamp: Date.now(),
    };
    
    await streamChat([systemMessage, ...messages], {
      onChunk: handleVisibleChunk,
      onComplete: (text) => {
        finalizeResponse(text);
        setErrorMsg(null);
      },
      onError: (error) => {
        setErrorMsg(error.message);
        resetStreamingState();
        setGenerating(false);
      },
    });
  };

  const handleFreeInput = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    
    resetStreamingState();
    setInputText('');
    setRequiresInput(false);
    setGenerating(true);
    
    const contextMsg = buildContextMessage(
      player.name,
      player.realm,
      world.currentLocation,
      world.mainStoryArc,
      world.currentObjective,
      world.recentProgress,
      world.keyClues,
      storyProgress
    );
    
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      role: 'user',
      content: `当前状态：${contextMsg}\n\n玩家自由行动：${inputText}\n\n请根据玩家的行动继续叙事，并提供新的选项。`,
      timestamp: Date.now(),
    };
    
    const fullMessages: Message[] = [...messages, userMessage];
    
    await streamChat([systemMessage, ...fullMessages], {
      onChunk: handleVisibleChunk,
      onComplete: finalizeResponse,
      onError: (error) => {
        setCurrentText(`错误: ${error.message}`);
        setGenerating(false);
      },
    });
  };

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div ref={topAnchorRef} aria-hidden="true" />
      <header className={`backdrop-blur-sm sticky top-0 z-10 ${theme.header}`}>
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <h1 className={`shrink-0 whitespace-nowrap text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${theme.title}`}>
              修仙世界
            </h1>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${theme.subtle}`}>v{APP_VERSION}</span>
              <BlogIconLink className="px-1" />
              <GitHubIconLink className="px-1" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:hidden">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className={`max-w-[7rem] truncate ${theme.name}`}>{player.name}</span>
              <span className={`px-2 py-1 rounded whitespace-nowrap text-xs ${theme.realm}`}>
                {player.realm}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HeaderIconButton title="剧情" onClick={() => setShowStoryPanel(true)} themeClass={theme.iconButton}>
                <BookOpen size={18} strokeWidth={1.5} />
              </HeaderIconButton>
              <HeaderIconButton title="世界观" onClick={() => setShowWorldPanel(true)} themeClass={theme.iconButton}>
                <Globe size={18} strokeWidth={1.5} />
              </HeaderIconButton>
              <HeaderIconButton title="设置" onClick={() => setShowSettings(true)} themeClass={theme.iconButton}>
                <Settings size={18} strokeWidth={1.5} />
              </HeaderIconButton>
              <HeaderIconButton title="存档" onClick={() => setShowSavePanel(true)} themeClass={theme.iconButton}>
                <Save size={18} strokeWidth={1.5} />
              </HeaderIconButton>
            </div>
          </div>

          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
            <h1 className={`shrink-0 whitespace-nowrap text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${theme.title}`}>
              修仙世界
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className={`text-xs ${theme.subtle}`}>v{APP_VERSION}</span>
              <BlogIconLink className="px-1" />
              <GitHubIconLink className="px-1" />
              <span className={`max-w-[7rem] truncate ${theme.name}`}>{player.name}</span>
              <span className={`px-2 py-1 rounded whitespace-nowrap ${theme.realm}`}>
                {player.realm}
              </span>
              <HeaderIconButton title="剧情" onClick={() => setShowStoryPanel(true)} themeClass={theme.iconButton}>
                <BookOpen size={18} strokeWidth={1.5} />
              </HeaderIconButton>
              <HeaderIconButton title="世界观" onClick={() => setShowWorldPanel(true)} themeClass={theme.iconButton}>
                <Globe size={18} strokeWidth={1.5} />
              </HeaderIconButton>
              <HeaderIconButton title="设置" onClick={() => setShowSettings(true)} themeClass={theme.iconButton}>
                <Settings size={18} strokeWidth={1.5} />
              </HeaderIconButton>
              <HeaderIconButton title="存档" onClick={() => setShowSavePanel(true)} themeClass={theme.iconButton}>
                <Save size={18} strokeWidth={1.5} />
              </HeaderIconButton>
            </div>
          </div>
        </div>
      </header>

      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)} 
          onReset={() => {
            if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
              resetGame();
              useSettingsStore.getState().setValidated(false);
              useSettingsStore.getState().updateApi({ endpoint: '', model: '' });
            }
          }}
        />
      )}

      {showWorldPanel && (
        <WorldPanel 
          onClose={() => setShowWorldPanel(false)}
          player={player}
          world={world}
          storyProgress={storyProgress}
        />
      )}

      {showStoryPanel && (
        <StoryPanel
          onClose={() => setShowStoryPanel(false)}
          world={world}
        />
      )}

      <main className="max-w-4xl mx-auto px-3 pb-28 pt-4 sm:px-4 sm:py-6 sm:pb-8">
        <div className="space-y-3 sm:space-y-4 mb-6">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`rounded-xl whitespace-pre-wrap px-4 py-4 text-[15px] leading-7 sm:rounded-lg sm:text-base sm:leading-8 ${msg.role === 'assistant' ? theme.assistantCard : `${theme.userCard} ml-4 sm:ml-8 italic`}`}
            >
              {msg.role === 'assistant' ? (
                <ThemedStoryMarkdown content={msg.content} themeClass={theme.markdown} />
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))}
          
          {currentText && (
            <div className={`rounded-xl px-4 py-4 sm:rounded-lg ${theme.streamingCard}`}>
              <div className="whitespace-pre-wrap text-[15px] leading-7 sm:text-base sm:leading-8">{currentText}</div>
            </div>
          )}
          
        </div>

        {errorMsg && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-300 mb-2">{errorMsg}</p>
            <div className="flex gap-2">
              {errorMsg.includes('API设置') && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all text-white"
                >
                  重新配置
                </button>
              )}
              <button
                onClick={handleChoiceRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-all text-white"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {choices.length > 0 && !isGenerating && (
          <div className="space-y-2 mb-4">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleChoice(choice)}
                className={`w-full text-left p-3 rounded-lg transition-all ${theme.choiceButton}`}
              >
                <span className="text-cyan-400 mr-2">
                  {String.fromCharCode(65 + index)}:
                </span>
                {choice}
              </button>
            ))}
          </div>
        )}

        {(!isGenerating) && (
          <div className={`sticky bottom-3 z-20 -mx-1 rounded-2xl border p-2 shadow-xl backdrop-blur sm:static sm:mx-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none ${theme.panel}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFreeInput()}
                placeholder={requiresInput ? "请描述你的行动..." : "自由行动或自定义输入..."}
                className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none text-[15px] ${theme.input}`}
              />
              <button
                onClick={handleFreeInput}
                disabled={!inputText.trim() && choices.length > 0}
                className={`px-5 py-2 rounded-xl transition-all font-medium disabled:opacity-50 ${theme.primaryButton}`}
              >
                确认
              </button>
            </div>
          </div>
        )}

        <div ref={bottomAnchorRef} aria-hidden="true" className="h-px" />
      </main>

      {showScrollButtons && (
        <div className="fixed bottom-24 right-3 z-30 flex flex-col gap-2 sm:bottom-6 sm:right-6">
          <ScrollJumpButton title="回到顶部" onClick={scrollToTop} themeClass={theme.iconButton}>
            <ChevronUp size={20} strokeWidth={1.8} />
          </ScrollJumpButton>
          {!isNearBottom && (
            <ScrollJumpButton title="回到最下方" onClick={scrollToBottom} themeClass={theme.iconButton}>
              <ChevronDown size={20} strokeWidth={1.8} />
            </ScrollJumpButton>
          )}
        </div>
      )}

      {showSavePanel && (
        <SavePanel onClose={() => setShowSavePanel(false)} />
      )}
    </div>
  );
}

const REALMS = [
  { name: '凡人', desc: '尚未踏入修仙之路的普通人' },
  { name: '练气期', desc: '引气入体，修炼根基' },
  { name: '筑基期', desc: '筑就道基，凝聚真元' },
  { name: '金丹期', desc: '结成金丹，位列真人' },
  { name: '元婴期', desc: '元婴出窍，神通初现' },
  { name: '化神期', desc: '化神返虚，寿元悠长' },
  { name: '炼虚期', desc: '炼虚合道，举手投足皆法则' },
  { name: '合体期', desc: '身合天地，法则交融' },
  { name: '大乘期', desc: '渡劫飞升，只差一步' },
  { name: '渡劫期', desc: '历劫成仙，超脱轮回' },
];

const FACTIONS = [
  { name: '青云宗', desc: '正道领袖，主张清心寡欲，以斩妖除魔为己任' },
  { name: '魔渊宫', desc: '魔道正宗，追求极致的力量，不择手段' },
  { name: '万宝阁', desc: '商道世家，中立务实，左右逢源' },
  { name: '散修联盟', desc: '自由修士，无特定立场，独来独往' },
];

function WorldPanel({ 
  onClose, 
  player, 
  world, 
  storyProgress 
}: { 
  onClose: () => void; 
  player: any; 
  world: any; 
  storyProgress: number; 
}) {
  const { readingTheme } = useSettingsStore();
  const theme = THEME_STYLES[readingTheme];
  const currentRealm = REALMS.find(r => r.name === player.realm);
  const realmIndex = REALMS.findIndex(r => r.name === player.realm);
  
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.modal}`}>
      <div className={`rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto ${theme.panel}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${theme.panelText}`}>世界观与进度</h2>
          <button onClick={onClose} className={`${theme.panelSubtle} hover:opacity-80`}>✕</button>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2">角色信息</h3>
          <div className={`rounded-lg p-4 space-y-2 text-sm ${theme.streamingCard}`}>
            <div className="flex justify-between">
              <span className={theme.panelSubtle}>道号</span>
              <span className={theme.panelText}>{player.name}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.panelSubtle}>性别</span>
              <span className={theme.panelText}>{player.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.panelSubtle}>境界</span>
              <span className="text-purple-300">{player.realm}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.panelSubtle}>年龄</span>
              <span className={theme.panelText}>{player.age}岁</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.panelSubtle}>当前地点</span>
              <span className={theme.panelText}>{world.currentLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.panelSubtle}>已访问</span>
              <span className={theme.panelText}>{world.visitedLocations.length}处</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.panelSubtle}>剧情进度</span>
              <span className={theme.panelText}>{storyProgress}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2">境界体系</h3>
          <div className="space-y-2">
            {REALMS.map((realm, idx) => (
              <div 
                key={realm.name}
                className={`p-3 rounded-lg ${
                  idx === realmIndex 
                    ? 'bg-purple-900/50 border border-purple-500' 
                    : idx < realmIndex 
                      ? `${theme.userCard} line-through`
                      : `${theme.userCard}`
                }`}
              >
                <div className="font-medium">{realm.name}</div>
                <div className={`text-xs ${theme.panelSubtle}`}>{realm.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2">修仙界势力</h3>
          <div className="space-y-2">
            {FACTIONS.map(faction => (
              <div key={faction.name} className={`p-3 rounded-lg ${theme.userCard}`}>
                <div className={`font-medium ${theme.panelText}`}>{faction.name}</div>
                <div className={`text-xs ${theme.panelSubtle}`}>{faction.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryPanel({
  onClose,
  world,
}: {
  onClose: () => void;
  world: import('@/app/types/game').WorldState;
}) {
  const { readingTheme } = useSettingsStore();
  const theme = THEME_STYLES[readingTheme];
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.modal}`}>
      <div className={`rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto ${theme.panel}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${theme.panelText}`}>剧情脉络</h2>
          <button onClick={onClose} className={`${theme.panelSubtle} hover:opacity-80`}>✕</button>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2">主线脉络</h3>
          <div className={`p-4 rounded-lg ${theme.streamingCard}`}>
            <p className={`text-sm leading-relaxed ${theme.panelText}`}>
              {world.mainStoryArc || '本局主线脉络正在展开，更多核心矛盾会随着剧情推进浮现。'}
            </p>
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-cyan-400 font-bold mb-2">当前目标</h3>
          <div className={`p-4 rounded-lg ${theme.streamingCard}`}>
            <p className={`text-sm leading-relaxed ${theme.panelText}`}>
              {world.currentObjective || '当前目标正在更新，新的行动方向会随着剧情推进明确。'}
            </p>
          </div>
        </div>

        <div className="mb-6 mt-4">
          <h3 className="text-cyan-400 font-bold mb-2">最近进展</h3>
          <div className={`p-4 rounded-lg ${theme.streamingCard}`}>
            <p className={`text-sm leading-relaxed ${theme.panelText}`}>
              {world.recentProgress || '最近进展正在形成，新的变化会随着剧情推进明确。'}
            </p>
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-cyan-400 font-bold mb-2">关键线索</h3>
          <div className={`p-4 rounded-lg ${theme.streamingCard}`}>
            {world.keyClues.length > 0 ? (
              <ul className={`list-disc pl-5 text-sm space-y-1 ${theme.panelText}`}>
                {world.keyClues.map((clue) => (
                  <li key={clue}>{clue}</li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm leading-relaxed ${theme.panelText}`}>
                暂无线索，随着剧情推进会逐步沉淀出更清晰的关键信息。
              </p>
            )}
          </div>
        </div>

        <p className={`mt-3 text-xs ${theme.panelSubtle}`}>
          主线脉络负责保持长期一致性，当前目标追踪眼下行动，最近进展与关键线索用于减少长对话中的叙事漂移。
        </p>
      </div>
    </div>
  );
}

function SavePanel({ onClose }: { onClose: () => void }) {
  const { readingTheme } = useSettingsStore();
  const theme = THEME_STYLES[readingTheme];
  const { saveSlots, addSaveSlot, removeSaveSlot, saveGame, loadGame } = useGameStore();
  const [saveName, setSaveName] = useState('');
  const [exportType, setExportType] = useState<'txt' | 'json'>('txt');
  const [importError, setImportError] = useState('');

  const handleSave = () => {
    if (!saveName.trim()) return;
    const saveData = saveGame(saveName);
    addSaveSlot(saveData);
    setSaveName('');
    setImportError('');
  };

  const exportAsTxt = (slotId: string) => {
    const slot = saveSlots.find(s => s.id === slotId);
    if (!slot) return;

    const { player, world, messages } = slot.gameState;
    const storyMessages = messages
      .filter((message) => message.role === 'assistant')
      .map((message) => sanitizeNovelContent(message.content))
      .filter((message) => message.length > 0);

    let content = `《修仙世界》\n`;
    content += `角色：${player.name} | 境界：${player.realm} | 地点：${world.currentLocation}\n`;
    content += `存档：${slot.name} | ${new Date(slot.createdAt).toLocaleString('zh-CN')}\n`;
    content += `${'='.repeat(40)}\n\n`;

    buildChapterSections(storyMessages).forEach((chapter) => {
      content += `${chapter.title}\n\n${chapter.content}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${player.name}_修仙故事_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJson = (slotId: string) => {
    const slot = saveSlots.find(s => s.id === slotId);
    if (!slot) return;

    const data = {
      meta: {
        name: slot.name,
        createdAt: slot.createdAt,
        player: slot.gameState.player.name,
        realm: slot.gameState.player.realm,
        location: slot.gameState.world.currentLocation,
      },
      exportType: 'json',
      version: '1.0',
      saveData: {
        id: slot.id,
        name: slot.name,
        createdAt: slot.createdAt,
        gameState: slot.gameState,
      },
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `save_${slot.name}_${new Date(slot.createdAt).toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const rawData = JSON.parse(text) as ImportedSaveFile;
      const importedSave = normalizeImportedSave(rawData);

      loadGame(importedSave);
      addSaveSlot(importedSave);
      setImportError('');
      setSaveName(importedSave.name);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '导入失败，请检查存档文件格式');
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.modal}`}>
      <div className={`rounded-xl p-6 w-full max-w-md ${theme.panel}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${theme.panelText}`}>存档管理</h2>
          <button onClick={onClose} className={`${theme.panelSubtle} hover:opacity-80`}>✕</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="存档名称..."
            className={`flex-1 px-3 py-2 border rounded-lg ${theme.input}`}
          />
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg ${theme.primaryButton}`}
          >
            保存
          </button>
        </div>

        <div className="mb-4">
          <label className={`inline-flex items-center px-4 py-2 rounded-lg text-sm cursor-pointer ${theme.iconButton}`}>
            导入存档(.json)
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {importError ? (
            <p className="mt-2 text-sm text-red-400">{importError}</p>
          ) : (
            <p className={`mt-2 text-xs ${theme.panelSubtle}`}>支持导入从本游戏导出的 JSON 存档文件</p>
          )}
        </div>

        <div className={`flex gap-4 mb-4 text-sm ${theme.name}`}>
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              checked={exportType === 'txt'} 
              onChange={() => setExportType('txt')}
              className="accent-cyan-500"
            />
            小说(.txt)
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              checked={exportType === 'json'} 
              onChange={() => setExportType('json')}
              className="accent-cyan-500"
            />
            存档(.json)
          </label>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {saveSlots.length === 0 ? (
            <p className={`${theme.panelSubtle} text-center py-4`}>暂无存档</p>
          ) : (
            saveSlots.map(slot => (
              <div key={slot.id} className={`flex items-center justify-between p-3 rounded-lg ${theme.userCard}`}>
                <div>
                  <div className={`${theme.panelText} font-medium`}>{slot.name}</div>
                  <div className={`text-xs ${theme.panelSubtle}`}>
                    {new Date(slot.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportType === 'txt' ? exportAsTxt(slot.id) : exportAsJson(slot.id)}
                    className={`text-sm ${theme.name} hover:opacity-80`}
                  >
                    导出
                  </button>
                  <button
                    onClick={() => removeSaveSlot(slot.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function sanitizeNovelContent(content: string): string {
  return content
    .replace(/\n?【剧情状态】[\s\S]*$/g, '')
    .replace(/\n?【选项】[\s\S]*?(?=\n?【自由输入】|$)/g, '')
    .replace(/\n?【自由输入】.*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

type ImportedSaveFile = {
  saveData?: unknown;
};

function normalizeImportedSave(rawData: unknown): import('@/app/types/game').SaveData {
  const candidate = extractSaveData(rawData);

  if (!candidate || typeof candidate !== 'object') {
    throw new Error('无效存档：缺少存档数据');
  }

  const saveData = candidate as Partial<import('@/app/types/game').SaveData>;
  const gameState = saveData.gameState;

  if (!saveData.name || !gameState) {
    throw new Error('无效存档：缺少必要字段');
  }

  if (!Array.isArray(gameState.messages) || !gameState.player || !gameState.world) {
    throw new Error('无效存档：游戏进度数据不完整');
  }

  return {
    id: typeof saveData.id === 'string' ? saveData.id : `import_${Date.now()}`,
    name: saveData.name,
    createdAt: typeof saveData.createdAt === 'number' ? saveData.createdAt : Date.now(),
    gameState,
  };
}

function extractSaveData(rawData: unknown): unknown {
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }

  const data = rawData as ImportedSaveFile & Record<string, unknown>;
  if (data.saveData) {
    return data.saveData;
  }

  return data;
}

function buildChapterSections(storyMessages: string[]): Array<{ title: string; content: string }> {
  const cleanedMessages = storyMessages.map((message) => message.trim()).filter(Boolean);
  if (cleanedMessages.length === 0) {
    return [];
  }

  const minTarget = 1200;
  const preferredTarget = 1800;
  const maxTarget = 2500;
  const chapters: Array<{ title: string; content: string }> = [];
  let currentMessages: string[] = [];
  let currentLength = 0;

  cleanedMessages.forEach((message, index) => {
    currentMessages.push(message);
    currentLength += countChineseLength(message);

    const isLastMessage = index === cleanedMessages.length - 1;
    const boundaryScore = getNarrativeBoundaryScore(message);
    const reachedPreferredRange = currentLength >= preferredTarget;
    const reachedMinimumRange = currentLength >= minTarget;
    const reachedHardLimit = currentLength >= maxTarget;

    if (
      reachedHardLimit ||
      (reachedPreferredRange && boundaryScore >= 2) ||
      (reachedMinimumRange && boundaryScore >= 3) ||
      isLastMessage
    ) {
      const content = currentMessages.join('\n\n');
      chapters.push({
        title: buildChapterTitle(chapters.length + 1, content),
        content,
      });
      currentMessages = [];
      currentLength = 0;
    }
  });

  return chapters;
}

function countChineseLength(text: string): number {
  return text.replace(/\s+/g, '').length;
}

function getNarrativeBoundaryScore(message: string): number {
  const strongBoundaries = ['次日', '翌日', '数日后', '数日之后', '转眼', '终于抵达', '尘埃落定', '突破成功', '此战暂了', '这一战结束', '踏入', '迈入'];
  const mediumBoundaries = ['此时', '忽然', '片刻后', '与此同时', '随后', '旋即', '来到', '进入', '前往', '离开', '回到', '夜色降临', '天色渐晚'];

  if (strongBoundaries.some((phrase) => message.includes(phrase))) {
    return 3;
  }

  if (mediumBoundaries.some((phrase) => message.includes(phrase))) {
    return 2;
  }

  if (message.length >= 600 && /[。！？]$/.test(message.trim())) {
    return 1;
  }

  return 0;
}

function buildChapterTitle(chapterNumber: number, content: string): string {
  const subtitle = extractChapterSubtitle(content);
  return subtitle ? `第${toChineseNumber(chapterNumber)}章 ${subtitle}` : `第${toChineseNumber(chapterNumber)}章`;
}

function extractChapterSubtitle(content: string): string {
  const placeMatch = content.match(/([\u4e00-\u9fa5]{2,8}(镇|城|山|谷|宗|宫|阁|林|湖|渊|峰|殿|岛|关|村))/);
  const eventKeywords = ['试炼', '突破', '异变', '夜战', '入门', '线索', '秘境', '风波', '机缘', '追查', '相遇', '杀机', '来客', '惊变', '劫云'];
  const event = eventKeywords.find((keyword) => content.includes(keyword));

  if (placeMatch && event) {
    return `${placeMatch[1]}·${event}`;
  }

  if (placeMatch) {
    return placeMatch[1];
  }

  if (event) {
    return event;
  }

  return '';
}

function toChineseNumber(value: number): string {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  if (value <= 10) {
    if (value === 10) return '十';
    return digits[value];
  }

  if (value < 20) {
    return `十${digits[value % 10]}`;
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${digits[tens]}十${ones === 0 ? '' : digits[ones]}`;
  }

  return String(value);
}

function SettingsPanel({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const { api, updateApi, isValidated, availableModels, fetchModels, setValidated, readingTheme, setReadingTheme } = useSettingsStore();
  const theme = THEME_STYLES[readingTheme];
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleValidate = async () => {
    if (!api.endpoint || !api.apiKey) {
      setValidationError('请填写 Endpoint 和 API Key');
      return;
    }
    setValidating(true);
    setValidationError('');

    try {
      const baseUrl = api.endpoint.split('/v1')[0];
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: { 'Authorization': `Bearer ${api.apiKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        const models = data.data?.map((m: { id: string }) => m.id) || [];
        if (!api.model) {
          updateApi({ model: models[0] || api.model });
        }
        setValidated(true);
        setValidationError('');
      } else {
        setValidationError(`验证失败: ${response.status}`);
      }
    } catch {
      setValidationError('连接失败，请检查 Endpoint');
    } finally {
      setValidating(false);
    }
  };

  const handleEndpointBlur = () => {
    if (api.endpoint && api.apiKey) {
      fetchModels();
    }
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${theme.modal}`}>
      <div className={`rounded-xl p-6 w-full max-w-lg ${theme.panel}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${theme.panelText}`}>设置</h2>
          <button onClick={onClose} className={`${theme.panelSubtle} hover:opacity-80`}>✕</button>
        </div>

        <div className="space-y-6">
          <section className={`rounded-xl p-4 ${theme.userCard}`}>
            <h3 className={`text-sm font-semibold mb-3 ${theme.panelText}`}>阅读主题</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'night', label: '夜幕' },
                { value: 'bamboo', label: '青竹' },
                { value: 'paper', label: '纸卷' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setReadingTheme(option.value as ReadingTheme)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    readingTheme === option.value
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                      : theme.iconButton
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className={`mt-3 text-xs ${theme.panelSubtle}`}>夜幕适合夜间阅读，青竹与纸卷更适合长时间护眼阅读。</p>
          </section>

          <section className={`rounded-xl p-4 ${theme.userCard}`}>
            <h3 className={`text-sm font-semibold mb-3 ${theme.panelText}`}>AI 设置</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${theme.name}`}>API Endpoint</label>
                <input
                  type="text"
                  value={api.endpoint}
                  onChange={(e) => updateApi({ endpoint: e.target.value })}
                  onBlur={handleEndpointBlur}
                  placeholder="https://api.openai.com/v1"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                />
                <p className={`mt-1 text-xs ${theme.panelSubtle}`}>填写 API 基础地址，如 https://api.openai.com/v1</p>
              </div>

              <div>
                <label className={`block text-sm mb-1 ${theme.name}`}>API Key</label>
                <input
                  type="password"
                  value={api.apiKey}
                  onChange={(e) => updateApi({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                />
                <p className="mt-1 text-xs text-amber-400">
                  ⚠️ API Key 仅保存在当前浏览器内存中，刷新页面后需重新输入
                </p>
              </div>

              <div>
                <label className={`block text-sm mb-1 ${theme.name}`}>模型</label>
                <div className="flex gap-2">
                  {availableModels.length > 0 ? (
                    <select
                      value={api.model}
                      onChange={(e) => updateApi({ model: e.target.value })}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={api.model}
                      onChange={(e) => updateApi({ model: e.target.value })}
                      placeholder="选择或输入模型"
                      className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                    />
                  )}
                  <button
                    onClick={fetchModels}
                    disabled={!api.endpoint || !api.apiKey}
                    className={`px-3 py-2 rounded-lg text-sm disabled:opacity-50 ${theme.iconButton}`}
                  >
                    获取模型
                  </button>
                </div>
              </div>

              {validationError && (
                <p className="text-sm text-red-400">{validationError}</p>
              )}

              <button
                onClick={handleValidate}
                disabled={validating || !api.endpoint || !api.apiKey}
                className={`w-full py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${isValidated ? 'bg-green-600 text-white' : theme.primaryButton}`}
              >
                {validating ? '验证中...' : isValidated ? '✓ 已验证' : '验证连接'}
              </button>
            </div>
          </section>
        </div>

        <button
          onClick={onReset}
          className="mt-6 w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white"
        >
          重置游戏
        </button>
      </div>
    </div>
  );
}

function InitialSetup({ initialStep }: { initialStep: 'name' | 'api' }) {
  const { updatePlayer } = useGameStore();
  const { api, updateApi, availableModels, fetchModels, setValidated, isValidated, readingTheme } = useSettingsStore();
  const theme = THEME_STYLES[readingTheme];
  const [step, setStep] = useState<'name' | 'api'>(initialStep);
  const [name, setName] = useState(generateInitialName);
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  const handleNameSubmit = () => {
    if (name.trim()) {
      updatePlayer({ name, gender });
    }
    setStep('api');
  };

  const handleRandomName = () => {
    const newGender = Math.random() > 0.5 ? '男' : '女';
    setGender(newGender);
    setName(generateRandomName(newGender));
  };

  const handleValidate = async () => {
    if (!api.endpoint || !api.apiKey) {
      setValidationError('请填写 Endpoint 和 API Key');
      return;
    }
    setValidating(true);
    setValidationError('');

    try {
      const baseUrl = api.endpoint.split('/v1')[0];
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: { 'Authorization': `Bearer ${api.apiKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        const models = data.data?.map((m: { id: string }) => m.id) || [];
        if (!api.model && models.length > 0) {
          updateApi({ model: models[0] });
        }
        setValidated(true);
      } else {
        setValidationError(`验证失败: ${response.status}`);
      }
    } catch {
      setValidationError('连接失败，请检查 Endpoint');
    } finally {
      setValidating(false);
    }
  };

  const handleEndpointBlur = () => {
    if (api.endpoint && api.apiKey) {
      fetchModels();
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme.app}`}>
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <div className={`mb-2 text-xs ${theme.subtle}`}>v{APP_VERSION}</div>
          <div className="flex items-center justify-center gap-3">
            <BlogIconLink className={`h-10 w-10 rounded-full ${theme.iconButton}`} />
            <GitHubIconLink className={`h-10 w-10 rounded-full ${theme.iconButton}`} />
          </div>
        </div>
        {step === 'name' ? (
          <div className={`rounded-xl p-8 ${theme.panel}`}>
            <h1 className={`text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r ${theme.title} mb-6`}>
              修仙世界
            </h1>
            <p className={`${theme.name} text-center mb-8`}>
              踏入修仙之路，书写属于你的传奇
            </p>
            <div className="flex justify-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => setGender('男')}
                className={`px-4 py-2 rounded-lg border ${
                  gender === '男' 
                    ? 'bg-cyan-600 border-cyan-500 text-white' 
                    : `${theme.userCard} ${theme.name}`
                }`}
              >
                男
              </button>
              <button
                type="button"
                onClick={() => setGender('女')}
                className={`px-4 py-2 rounded-lg border ${
                  gender === '女' 
                    ? 'bg-purple-600 border-purple-500 text-white' 
                    : `${theme.userCard} ${theme.name}`
                }`}
              >
                女
              </button>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="请输入你的道号"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-center text-lg mb-4 ${theme.input}`}
              autoFocus
            />
            <button
              onClick={handleRandomName}
              className={`w-full py-2 mb-4 rounded-lg transition-all ${theme.choiceButton}`}
            >
              随机性别和道号
            </button>
            <button
              onClick={handleNameSubmit}
              disabled={!name.trim()}
              className={`w-full py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium ${theme.primaryButton}`}
            >
              开始修仙
            </button>
          </div>
        ) : (
          <div className={`rounded-xl p-8 ${theme.panel}`}>
            <h2 className={`text-xl font-bold mb-6 ${theme.panelText}`}>配置AI API</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${theme.name}`}>API Endpoint</label>
                <input
                  type="text"
                  value={api.endpoint}
                  onChange={(e) => updateApi({ endpoint: e.target.value })}
                  onBlur={handleEndpointBlur}
                  placeholder="https://api.openai.com/v1"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                />
                <p className={`mt-1 text-xs ${theme.panelSubtle}`}>填写 API 基础地址，如 https://api.openai.com/v1</p>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme.name}`}>API Key</label>
                <input
                  type="password"
                  value={api.apiKey}
                  onChange={(e) => updateApi({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                />
                <p className="mt-1 text-xs text-amber-400">
                  ⚠️ API Key 仅保存在当前浏览器内存中，刷新页面后需重新输入
                </p>
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme.name}`}>模型</label>
                <div className="flex gap-2">
                  {availableModels.length > 0 ? (
                    <select
                      value={api.model}
                      onChange={(e) => updateApi({ model: e.target.value })}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={api.model}
                      onChange={(e) => updateApi({ model: e.target.value })}
                      placeholder="选择或输入模型"
                      className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none ${theme.input}`}
                    />
                  )}
                  <button
                    onClick={fetchModels}
                    disabled={!api.endpoint || !api.apiKey}
                    className={`px-3 py-2 rounded-lg text-sm disabled:opacity-50 ${theme.iconButton}`}
                  >
                    获取模型
                  </button>
                </div>
              </div>
            </div>

            {validationError && (
              <p className="mt-3 text-sm text-red-400">{validationError}</p>
            )}

            <button
              onClick={handleValidate}
              disabled={validating || !api.endpoint || !api.apiKey}
            className={`mt-4 w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 ${isValidated ? 'bg-green-600 text-white' : theme.primaryButton}`}
            >
              {validating ? '验证中...' : isValidated ? '✓ 已验证' : '验证连接'}
            </button>

            <button
              onClick={() => undefined}
              disabled={!isValidated || !api.endpoint || !api.apiKey}
              className={`mt-3 w-full py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium ${theme.primaryButton}`}
            >
              进入游戏
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
