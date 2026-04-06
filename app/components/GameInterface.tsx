'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/app/store/gameStore';
import { useSettingsStore } from '@/app/store/settingsStore';
import { streamChat } from '@/app/lib/ai';
import { INITIAL_STORY, parseChoicesFromResponse, checkRequiresInput, buildContextMessage, detectRealmUpgrade } from '@/app/lib/story';
import type { Message } from '@/app/types/game';

const NICKNAMES = ['小二', '小三', '小四', '小五', '小六', '小七', '小八', '小九', '小十', '石头', '铁蛋', '柱子', '狗剩', '二狗', '三毛', '狗娃', '虎子', '牛儿', '娃子', '蛋蛋', '毛毛', '小毛', '阿福', '阿贵', '阿强', '阿旺', '阿根', '阿土', '阿水', '阿山', '阿林', '阿海', '阿江', '阿河', '阿湖', '阿海', '阿龙', '阿凤', '阿花', '阿草', '阿木', '阿石', '阿金', '阿银', '阿铜', '阿铁', '阿福', '阿禄', '阿寿', '阿喜', '阿庆', '阿发', '阿财', '阿顺', '阿平', '阿安', '阿和', '阿善', '阿美', '阿丽', '阿香', '阿花', '阿菊', '阿兰', '阿梅', '阿桃', '阿杏', '阿枣', '阿梨', '阿瓜', '阿豆', '阿米', '阿麦', '阿谷', '阿稻', '阿粮', '阿仓', '阿库', '阿房', '阿屋', '阿门', '阿窗', '阿床', '阿椅', '阿桌', '阿凳', '阿柜', '阿箱'];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateRandomDaohao(): string {
  return pickRandom(NICKNAMES);
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

export default function GameInterface() {
  const { 
    player, 
    world, 
    messages, 
    addMessage, 
    setGenerating, 
    isGenerating,
    storyProgress,
    updatePlayer,
    advanceRealm,
    resetGame,
  } = useGameStore();
  
  const { api, isValidated } = useSettingsStore();
  const [currentText, setCurrentText] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [requiresInput, setRequiresInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [showWorldPanel, setShowWorldPanel] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isInitialized = player.name && api.endpoint && api.apiKey && isValidated;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startGame = useCallback(async () => {
    if (!player.name) return;
    
    setGenerating(true);
    setCurrentText('');
    
    const initialMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: `开始修仙之旅。玩家${player.name}，境界${player.realm}，地点${world.currentLocation}。请以这段文字开头继续叙事：\n\n${INITIAL_STORY}`,
      timestamp: Date.now(),
    };
    
    addMessage(initialMessage);
    
    const fullMessages: Message[] = [initialMessage];
    
    let fullResponse = '';
    
    await streamChat(fullMessages, {
      onChunk: (chunk) => {
        setCurrentText(prev => prev + chunk);
        fullResponse += chunk;
      },
      onComplete: (text) => {
        const newRealm = detectRealmUpgrade(text);
        if (newRealm) {
          advanceRealm(newRealm as any);
        }
        const aiMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        };
        addMessage(aiMessage);
        setChoices(parseChoicesFromResponse(text));
        setRequiresInput(checkRequiresInput(text));
        setGenerating(false);
      },
      onError: (error) => {
        setCurrentText(`错误: ${error.message}`);
        setGenerating(false);
      },
    });
  }, [player.name, world.currentLocation, player.realm, addMessage, setGenerating]);

  useEffect(() => {
    if (player.name && !messages.length && !isGenerating) {
      startGame();
    }
  }, [startGame, player.name, messages.length, isGenerating]);

  const handleChoice = async (choiceText: string) => {
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: choiceText,
      timestamp: Date.now(),
    };
    addMessage(userMessage);
    
    setCurrentText('');
    setChoices([]);
    setGenerating(true);
    
    const contextMsg = buildContextMessage(
      player.name,
      player.realm,
      world.currentLocation,
      storyProgress
    );
    
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      role: 'user',
      content: `当前状态：${contextMsg}\n\n请根据玩家的选择继续叙事。`,
      timestamp: Date.now(),
    };
    
    const fullMessages: Message[] = [...messages, userMessage];
    let fullResponse = '';
    
    await streamChat([systemMessage, ...fullMessages], {
      onChunk: (chunk) => {
        setCurrentText(prev => prev + chunk);
        fullResponse += chunk;
      },
      onComplete: (text) => {
        const newRealm = detectRealmUpgrade(text);
        if (newRealm) {
          advanceRealm(newRealm as any);
        }
        const aiMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        };
        addMessage(aiMessage);
        setChoices(parseChoicesFromResponse(text));
        setRequiresInput(checkRequiresInput(text));
        setGenerating(false);
      },
      onError: (error) => {
        setErrorMsg(error.message);
        setCurrentText('');
        setGenerating(false);
      },
    });
  };

  const handleChoiceRetry = async () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user') return;
    
    setErrorMsg(null);
    setGenerating(true);
    
    const contextMsg = buildContextMessage(
      player.name,
      player.realm,
      world.currentLocation,
      storyProgress
    );
    
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      role: 'user',
      content: `当前状态：${contextMsg}\n\n请重新生成选项。`,
      timestamp: Date.now(),
    };
    
    await streamChat([systemMessage, ...messages], {
      onChunk: (chunk) => setCurrentText(prev => prev + chunk),
      onComplete: (text) => {
        const newRealm = detectRealmUpgrade(text);
        if (newRealm) {
          advanceRealm(newRealm as any);
        }
        const aiMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        };
        addMessage(aiMessage);
        setChoices(parseChoicesFromResponse(text));
        setRequiresInput(checkRequiresInput(text));
        setGenerating(false);
        setErrorMsg(null);
      },
      onError: (error) => {
        setErrorMsg(error.message);
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
    
    setCurrentText('');
    setInputText('');
    setRequiresInput(false);
    setGenerating(true);
    
    const contextMsg = buildContextMessage(
      player.name,
      player.realm,
      world.currentLocation,
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
      onChunk: (chunk) => {
        setCurrentText(prev => prev + chunk);
      },
      onComplete: (text) => {
        const newRealm = detectRealmUpgrade(text);
        if (newRealm) {
          advanceRealm(newRealm as any);
        }
        const aiMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        };
        addMessage(aiMessage);
        setChoices(parseChoicesFromResponse(text));
        setRequiresInput(checkRequiresInput(text));
        setGenerating(false);
      },
      onError: (error) => {
        setCurrentText(`错误: ${error.message}`);
        setGenerating(false);
      },
    });
  };

  if (!isInitialized) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100">
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            修仙世界
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={() => setShowWorldPanel(true)}
              className="text-slate-400 hover:text-slate-200"
              title="世界观"
            >
              📖
            </button>
            <span className="text-slate-400">{player.name}</span>
            <span className="px-2 py-1 bg-purple-900/50 rounded text-purple-300">
              {player.realm}
            </span>
            <span className="text-slate-500" title="年龄">年龄: {player.age}</span>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-slate-400 hover:text-slate-200"
              title="AI设置"
            >
              ⚙️
            </button>
            <button 
              onClick={() => setShowSavePanel(true)}
              className="text-slate-400 hover:text-slate-200"
              title="存档"
            >
              💾
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)} 
          onReset={() => {
            if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
              resetGame();
              window.location.reload();
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

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4 mb-6">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`p-4 rounded-lg whitespace-pre-wrap ${
                msg.role === 'assistant' 
                  ? 'bg-slate-800/50 border border-slate-700/50 text-slate-200' 
                  : 'bg-slate-700/30 ml-8 text-slate-300 italic'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="leading-relaxed">{msg.content}</div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))}
          
          {currentText && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-200">
              <div className="leading-relaxed whitespace-pre-wrap">{currentText}</div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {errorMsg && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-300 mb-2">{errorMsg}</p>
            <button
              onClick={handleChoiceRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-all text-white"
            >
              重试
            </button>
          </div>
        )}

        {!errorMsg && choices.length > 0 && !isGenerating && (
          <div className="space-y-2 mb-4">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleChoice(choice)}
                className="w-full text-left p-3 rounded-lg bg-slate-800/80 border border-slate-600 hover:border-cyan-500/50 hover:bg-slate-700/80 transition-all"
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
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFreeInput()}
              placeholder="自由行动或自定义输入..."
              className="flex-1 px-4 py-3 bg-slate-700 border-2 border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white placeholder:text-slate-400"
            />
            <button
              onClick={handleFreeInput}
              disabled={!inputText.trim() && choices.length > 0}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all text-white font-medium disabled:opacity-50"
            >
              确认
            </button>
          </div>
        )}
      </main>

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
  const currentRealm = REALMS.find(r => r.name === player.realm);
  const realmIndex = REALMS.findIndex(r => r.name === player.realm);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-200">世界观与进度</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2">角色信息</h3>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">道号</span>
              <span className="text-slate-200">{player.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">境界</span>
              <span className="text-purple-300">{player.realm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">年龄</span>
              <span className="text-slate-200">{player.age}岁</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">当前地点</span>
              <span className="text-slate-200">{world.currentLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">已访问</span>
              <span className="text-slate-200">{world.visitedLocations.length}处</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">剧情进度</span>
              <span className="text-slate-200">{storyProgress}</span>
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
                      ? 'bg-slate-700/30 text-slate-500 line-through'
                      : 'bg-slate-700/30 text-slate-400'
                }`}
              >
                <div className="font-medium">{realm.name}</div>
                <div className="text-xs text-slate-500">{realm.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2">修仙界势力</h3>
          <div className="space-y-2">
            {FACTIONS.map(faction => (
              <div key={faction.name} className="p-3 bg-slate-700/30 rounded-lg">
                <div className="font-medium text-slate-200">{faction.name}</div>
                <div className="text-xs text-slate-500">{faction.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 font-bold mb-2">主线任务</h3>
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <p className="text-slate-300 text-sm">
              父亲曾是修士，后失踪。爷爷临终遗愿：找出父亲下落。
            </p>
            <p className="text-slate-500 text-xs mt-2">
              未知父亲下落前，修仙之路永不止步...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavePanel({ onClose }: { onClose: () => void }) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-200">存档管理</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="存档名称..."
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 text-white"
          >
            保存
          </button>
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-white text-sm cursor-pointer">
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
            <p className="mt-2 text-xs text-slate-500">支持导入从本游戏导出的 JSON 存档文件</p>
          )}
        </div>

        <div className="flex gap-4 mb-4 text-sm">
          <label className="flex items-center gap-2 text-slate-400">
            <input 
              type="radio" 
              checked={exportType === 'txt'} 
              onChange={() => setExportType('txt')}
              className="accent-cyan-500"
            />
            小说(.txt)
          </label>
          <label className="flex items-center gap-2 text-slate-400">
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
            <p className="text-slate-500 text-center py-4">暂无存档</p>
          ) : (
            saveSlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <div className="text-slate-200 font-medium">{slot.name}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(slot.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportType === 'txt' ? exportAsTxt(slot.id) : exportAsJson(slot.id)}
                    className="text-slate-400 hover:text-slate-200 text-sm"
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
  const chapters: Array<{ title: string; content: string }> = [];
  const paragraphs: string[] = [];

  storyMessages.forEach((message) => {
    paragraphs.push(...message.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean));
  });

  let chapterNumber = 1;
  let currentParagraphs: string[] = [];

  paragraphs.forEach((paragraph, index) => {
    currentParagraphs.push(paragraph);
    const paragraphCount = currentParagraphs.length;
    const isLongEnough = paragraphCount >= 4;
    const isSceneBoundary = /[。！？]$/.test(paragraph) && paragraph.length >= 40;
    const isLastParagraph = index === paragraphs.length - 1;

    if ((isLongEnough && isSceneBoundary) || paragraphCount >= 6 || isLastParagraph) {
      chapters.push({
        title: `第${toChineseNumber(chapterNumber)}章`,
        content: currentParagraphs.join('\n\n'),
      });
      chapterNumber += 1;
      currentParagraphs = [];
    }
  });

  return chapters.length > 0
    ? chapters
    : [{ title: '第一章', content: storyMessages.join('\n\n') }];
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
  const { api, updateApi, isValidated, availableModels, fetchModels, setValidated } = useSettingsStore();
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
        updateApi({ model: models[0] || api.model });
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-200">AI 设置</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">API Endpoint</label>
            <input
              type="text"
              value={api.endpoint}
              onChange={(e) => updateApi({ endpoint: e.target.value })}
              onBlur={handleEndpointBlur}
              placeholder="https://api.openai.com/v1"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white placeholder:text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-500">填写 API 基础地址，如 https://api.openai.com/v1</p>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">API Key</label>
            <input
              type="password"
              value={api.apiKey}
              onChange={(e) => updateApi({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white placeholder:text-slate-400"
            />
            <p className="mt-1 text-xs text-amber-400">
              ⚠️ API Key 仅保存在当前浏览器内存中，刷新页面后需重新输入
            </p>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">模型</label>
            {availableModels.length > 0 ? (
              <select
                value={api.model}
                onChange={(e) => updateApi({ model: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
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
                placeholder="gpt-4"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white placeholder:text-slate-400"
              />
            )}
          </div>

          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}

          <button
            onClick={handleValidate}
            disabled={validating || !api.endpoint || !api.apiKey}
            className={`w-full py-2 rounded-lg font-medium transition-all ${
              isValidated 
                ? 'bg-green-600 text-white' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50'
            }`}
          >
            {validating ? '验证中...' : isValidated ? '✓ 已验证' : '验证连接'}
          </button>
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

function SetupScreen() {
  const { updatePlayer } = useGameStore();
  const { api, updateApi, isValidated, availableModels, fetchModels, setValidated } = useSettingsStore();
  const [step, setStep] = useState<'name' | 'api'>('name');
  const [name, setName] = useState(generateRandomDaohao);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleNameSubmit = () => {
    if (name.trim()) {
      updatePlayer({ name });
      setStep('api');
    }
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
        updateApi({ model: models[0] || api.model });
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'name' ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-6">
              修仙世界
            </h1>
            <p className="text-slate-400 text-center mb-8">
              踏入修仙之路，书写属于你的传奇
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="请输入你的道号"
              className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-center text-lg mb-4 text-white placeholder:text-slate-400"
              autoFocus
            />
            <button
              onClick={() => setName(generateRandomDaohao())}
              className="w-full py-2 mb-4 bg-slate-700 border border-slate-500 rounded-lg hover:border-cyan-500 hover:text-cyan-300 transition-all text-slate-200"
            >
              随机生成道号
            </button>
            <button
              onClick={handleNameSubmit}
              disabled={!name.trim()}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              开始修仙
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h2 className="text-xl font-bold text-slate-200 mb-6">配置AI API</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">API Endpoint</label>
                <input
                  type="text"
                  value={api.endpoint}
                  onChange={(e) => updateApi({ endpoint: e.target.value })}
                  onBlur={handleEndpointBlur}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white placeholder:text-slate-400"
                />
                <p className="mt-1 text-xs text-slate-500">填写 API 基础地址，如 https://api.openai.com/v1</p>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">API Key</label>
                <input
                  type="password"
                  value={api.apiKey}
                  onChange={(e) => updateApi({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white placeholder:text-slate-400"
                />
                <p className="mt-1 text-xs text-amber-400">
                  ⚠️ API Key 仅保存在当前浏览器内存中，刷新页面后需重新输入
                </p>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">模型</label>
                {availableModels.length > 0 ? (
                  <select
                    value={api.model}
                    onChange={(e) => updateApi({ model: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white"
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
                    placeholder="gpt-4"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-500 rounded-lg focus:border-cyan-500 focus:outline-none text-white placeholder:text-slate-400"
                  />
                )}
              </div>
            </div>

            {validationError && (
              <p className="mt-3 text-sm text-red-400">{validationError}</p>
            )}

            <button
              onClick={handleValidate}
              disabled={validating || !api.endpoint || !api.apiKey}
              className={`mt-4 w-full py-3 rounded-lg font-medium transition-all ${
                isValidated 
                  ? 'bg-green-600 text-white' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50'
              }`}
            >
              {validating ? '验证中...' : isValidated ? '✓ 已验证' : '验证连接'}
            </button>

            <button
              onClick={() => window.location.reload()}
              disabled={!isValidated}
              className="mt-3 w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-white"
            >
              进入游戏
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
