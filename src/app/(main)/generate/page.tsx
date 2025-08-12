'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Save, Trash2, Bot, FileText, Edit3 } from 'lucide-react';
import { GenerateChatPane } from '@/components/features/Generate/GenerateChatPane';
import { PlanningPane } from '@/components/features/Generate/PlanningPane';
import { ScriptPane } from '@/components/features/Generate/ScriptPane';
import { useAuth } from '@/lib/hooks/useAuth';
import { createWork } from '@/lib/firebase/works';
import { CreateWorkInput } from '@/types/work';
import toast from 'react-hot-toast';

// データ型定義
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ScriptSections {
  opening: string;
  main: string;
  ending: string;
  effects: string;
}

interface Character {
  id: string;
  name: string;
  age?: string;
  occupation?: string;
  personality?: string;
  description?: string;
}

interface GeneratePageState {
  // チャット
  messages: Message[];
  currentInput: string;
  
  // 企画
  title: string;
  tags: string[];
  summary: string;
  characters: Character[];
  notes: string;
  
  // 台本
  activeScriptTab: keyof ScriptSections;
  scripts: ScriptSections;
}

export default function GeneratePage() {
  const { user, userData } = useAuth();
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'planning' | 'script'>('chat');
  
  // work保存・ボイス生成の状態管理
  const [isSavingWork, setIsSavingWork] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  
  // 状態管理
  const [state, setState] = useState<GeneratePageState>({
    messages: [],
    currentInput: '',
    title: '',
    tags: [],
    summary: '',
    characters: [{
      id: crypto.randomUUID(),
      name: '',
      age: '',
      occupation: '',
      personality: '',
      description: ''
    }],
    notes: '',
    activeScriptTab: 'opening',
    scripts: {
      opening: '',
      main: '',
      ending: '',
      effects: ''
    }
  });

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ページロード時の復元
  useEffect(() => {
    const savedState = localStorage.getItem('generatePageState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // timestampを復元
        parsedState.messages = parsedState.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) || [];
        setState(parsedState);
      } catch (error) {
        console.error('状態の復元に失敗しました:', error);
      }
    }
  }, []);

  // 途中保存
  const handleSave = () => {
    localStorage.setItem('generatePageState', JSON.stringify(state));
    alert('保存しました！');
  };

  // クリア
  const handleClear = () => {
    if (confirm('全ての内容をクリアしますか？')) {
      setState({
        messages: [],
        currentInput: '',
        title: '',
        tags: [],
        summary: '',
        characters: [{
          id: crypto.randomUUID(),
          name: '',
          age: '',
          occupation: '',
          personality: '',
          description: ''
        }],
        notes: '',
        activeScriptTab: 'opening',
        scripts: {
          opening: '',
          main: '',
          ending: '',
          effects: ''
        }
      });
      localStorage.removeItem('generatePageState');
    }
  };

  // チャット機能
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (!state.currentInput.trim()) return;

    const currentInput = state.currentInput;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      currentInput: ''
    }));

    // AIレスポンスのシミュレーション（実際のAPI連携は後で実装）
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `「${currentInput}」について理解しました。どのような作品を作成したいか、詳しく教えてください。`,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage]
      }));
      setIsLoading(false);
    }, 1000);
  };

  // 企画エリアの更新ハンドラー
  const updatePlanning = {
    title: (value: string) => setState(prev => ({ ...prev, title: value })),
    tags: (value: string[]) => setState(prev => ({ ...prev, tags: value })),
    summary: (value: string) => setState(prev => ({ ...prev, summary: value })),
    characters: (value: Character[]) => setState(prev => ({ ...prev, characters: value })),
    notes: (value: string) => setState(prev => ({ ...prev, notes: value }))
  };

  // 台本エリアの更新ハンドラー
  const handleScriptTabChange = (tab: keyof ScriptSections) => {
    setState(prev => ({ ...prev, activeScriptTab: tab }));
  };

  const handleScriptChange = (section: keyof ScriptSections, value: string) => {
    setState(prev => ({
      ...prev,
      scripts: { ...prev.scripts, [section]: value }
    }));
  };

  // work保存機能
  const handleSaveWork = async () => {
    if (!user || !userData) {
      toast.error('ログインが必要です');
      return;
    }

    if (!state.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    setIsSavingWork(true);

    try {
      // 全セクションのスクリプトを結合
      const combinedScript = Object.entries(state.scripts)
        .filter(([_, content]) => content.trim())
        .map(([section, content]) => `[${section.toUpperCase()}]\n${content}`)
        .join('\n\n');

      if (!combinedScript.trim() && !state.summary.trim()) {
        toast.error('台本または概要を入力してください');
        return;
      }

      const workData: CreateWorkInput = {
        title: state.title,
        caption: state.summary || '',
        script: combinedScript,
        tags: state.tags.length > 0 ? state.tags : undefined,
        contentType: 'script',
        publishStatus: 'private' // デフォルト非公開
      };

      const result = await createWork(
        workData,
        user.uid,
        userData.username,
        userData.displayName,
        userData.photoURL
      );

      if (result.success) {
        toast.success('作品を保存しました！');
      } else {
        toast.error(result.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Work save error:', error);
      toast.error('保存中にエラーが発生しました');
    } finally {
      setIsSavingWork(false);
    }
  };

  // ボイス生成機能（未実装）
  const handleGenerateVoice = () => {
    setIsGeneratingVoice(true);
    
    // シミュレーション（実際のAPI連携は後で実装）
    setTimeout(() => {
      setIsGeneratingVoice(false);
      toast('ボイス生成機能は今後実装予定です');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="text-blue-500" size={28} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI作品生成</h1>
              <p className="text-sm text-gray-500">AIとの対話で作品を作成しましょう</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSave}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
            >
              <Save size={16} />
              <span>途中保存</span>
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors duration-200"
            >
              <Trash2 size={16} />
              <span>クリア</span>
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      {isMobileView ? (
        // モバイル：タブ切り替え
        <div className="flex-1 flex flex-col h-[calc(100vh-88px)]">
          {/* タブナビゲーション */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'chat'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bot size={16} />
              <span>チャット</span>
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex-1 px-4 py-3 text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'planning'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={16} />
              <span>企画</span>
            </button>
            <button
              onClick={() => setActiveTab('script')}
              className={`flex-1 px-4 py-3 text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'script'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit3 size={16} />
              <span>台本</span>
            </button>
          </div>

          {/* タブコンテンツ */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <div className="h-full p-4">
                <div className="bg-white rounded-lg shadow-sm h-full">
                  <GenerateChatPane
                    messages={state.messages}
                    currentInput={state.currentInput}
                    isLoading={isLoading}
                    onInputChange={(value) => setState(prev => ({ ...prev, currentInput: value }))}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </div>
            )}
            {activeTab === 'planning' && (
              <div className="h-full p-4">
                <div className="bg-white rounded-lg shadow-sm h-full">
                  <PlanningPane
                    title={state.title}
                    tags={state.tags}
                    summary={state.summary}
                    characters={state.characters}
                    notes={state.notes}
                    onTitleChange={updatePlanning.title}
                    onTagsChange={updatePlanning.tags}
                    onSummaryChange={updatePlanning.summary}
                    onCharactersChange={updatePlanning.characters}
                    onNotesChange={updatePlanning.notes}
                  />
                </div>
              </div>
            )}
            {activeTab === 'script' && (
              <div className="h-full p-4">
                <div className="bg-white rounded-lg shadow-sm h-full">
                  <ScriptPane
                    activeScriptTab={state.activeScriptTab}
                    scripts={state.scripts}
                    onTabChange={handleScriptTabChange}
                    onScriptChange={handleScriptChange}
                    onGenerateVoice={handleGenerateVoice}
                    onSaveWork={handleSaveWork}
                    isGeneratingVoice={isGeneratingVoice}
                    isSavingWork={isSavingWork}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // デスクトップ：3ペイン表示
        <div className="flex h-[calc(100vh-88px)]">
          {/* 第1ペイン：チャット */}
          <div className="w-[35%] border-r border-gray-200 bg-white">
            <div className="h-full flex flex-col">
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center space-x-2">
                  <Bot className="text-blue-500" size={20} />
                  <h3 className="font-medium text-gray-900">AIチャット</h3>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <GenerateChatPane
                  messages={state.messages}
                  currentInput={state.currentInput}
                  isLoading={isLoading}
                  onInputChange={(value) => setState(prev => ({ ...prev, currentInput: value }))}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>

          {/* 第2ペイン：企画 */}
          <div className="w-[30%] border-r border-gray-200 bg-white">
            <div className="h-full flex flex-col">
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="text-green-500" size={20} />
                  <h3 className="font-medium text-gray-900">企画</h3>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <PlanningPane
                  title={state.title}
                  tags={state.tags}
                  summary={state.summary}
                  characters={state.characters}
                  notes={state.notes}
                  onTitleChange={updatePlanning.title}
                  onTagsChange={updatePlanning.tags}
                  onSummaryChange={updatePlanning.summary}
                  onCharactersChange={updatePlanning.characters}
                  onNotesChange={updatePlanning.notes}
                />
              </div>
            </div>
          </div>

          {/* 第3ペイン：台本 */}
          <div className="w-[35%] bg-white">
            <div className="h-full flex flex-col">
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center space-x-2">
                  <Edit3 className="text-purple-500" size={20} />
                  <h3 className="font-medium text-gray-900">台本</h3>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScriptPane
                  activeScriptTab={state.activeScriptTab}
                  scripts={state.scripts}
                  onTabChange={handleScriptTabChange}
                  onScriptChange={handleScriptChange}
                  onGenerateVoice={handleGenerateVoice}
                  onSaveWork={handleSaveWork}
                  isGeneratingVoice={isGeneratingVoice}
                  isSavingWork={isSavingWork}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}