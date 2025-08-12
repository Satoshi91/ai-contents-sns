'use client';

import React from 'react';
import { Play, FileText, Award, Volume2, Save, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ScriptSections {
  opening: string;
  main: string;
  ending: string;
  effects: string;
}

interface ScriptPaneProps {
  activeScriptTab: keyof ScriptSections;
  scripts: ScriptSections;
  onTabChange: (tab: keyof ScriptSections) => void;
  onScriptChange: (section: keyof ScriptSections, value: string) => void;
  onGenerateVoice?: () => void;
  onSaveWork?: () => void;
  isGeneratingVoice?: boolean;
  isSavingWork?: boolean;
}

const SCRIPT_TABS = [
  {
    key: 'opening' as const,
    label: 'オープニング',
    icon: Play,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-600'
  },
  {
    key: 'main' as const,
    label: '本編',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-600'
  },
  {
    key: 'ending' as const,
    label: 'エンディング',
    icon: Award,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-600'
  },
  {
    key: 'effects' as const,
    label: '効果音メモ',
    icon: Volume2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-600'
  }
];

export function ScriptPane({
  activeScriptTab,
  scripts,
  onTabChange,
  onScriptChange,
  onGenerateVoice,
  onSaveWork,
  isGeneratingVoice = false,
  isSavingWork = false
}: ScriptPaneProps) {
  const activeTab = SCRIPT_TABS.find(tab => tab.key === activeScriptTab);
  const currentScript = scripts[activeScriptTab];

  const getPlaceholderText = (section: keyof ScriptSections): string => {
    switch (section) {
      case 'opening':
        return 'オープニングのセリフやナレーションを入力してください...\n\n例：\nナレーター：「これは一人の青年の物語である...」\n\n主人公：「今日もいい天気だな。」';
      case 'main':
        return '本編のスクリプトを入力してください...\n\n例：\n場面：カフェの中\n\n主人公：「注文をお願いします。」\nウェイター：「いらっしゃいませ。何になさいますか？」';
      case 'ending':
        return 'エンディングのセリフやナレーションを入力してください...\n\n例：\n主人公：「ありがとう、また明日も頑張ろう。」\n\nナレーター：「こうして一日が終わった...」';
      case 'effects':
        return '効果音や演出に関するメモを入力してください...\n\n例：\n・カフェの環境音（カップの音、雑談）\n・ドアの開閉音\n・足音（靴音）\n・BGM：穏やかな昼下がりのメロディ';
      default:
        return 'スクリプトを入力してください...';
    }
  };

  // 文字数と行数の計算
  const characterCount = currentScript.length;
  const lineCount = currentScript.split('\n').length;
  const wordCount = currentScript.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="h-full flex flex-col">
      {/* セクションタブ */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          {SCRIPT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeScriptTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex-1 px-3 py-3 text-sm font-medium cursor-pointer transition-all duration-200 flex items-center justify-center space-x-2 border-b-2 ${
                  isActive
                    ? `${tab.bgColor} ${tab.color} ${tab.borderColor}`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* スクリプトエディタ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* エディタヘッダー */}
        <div className={`${activeTab?.bgColor || 'bg-gray-50'} border-b border-gray-200 p-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {activeTab && <activeTab.icon className={activeTab.color} size={20} />}
              <h4 className="font-medium text-gray-900">{activeTab?.label}</h4>
            </div>
            <div className="text-xs text-gray-500">
              {characterCount}文字 • {lineCount}行 • {wordCount}語
            </div>
          </div>
        </div>

        {/* テキストエリア */}
        <div className="flex-1 relative">
          <textarea
            value={currentScript}
            onChange={(e) => onScriptChange(activeScriptTab, e.target.value)}
            placeholder={getPlaceholderText(activeScriptTab)}
            className="w-full h-full p-4 border-0 resize-none outline-none font-mono text-sm leading-relaxed bg-white text-gray-900 focus:bg-gray-50 transition-colors duration-200"
            style={{ 
              minHeight: '100%',
              lineHeight: 1.6
            }}
          />
        </div>

        {/* フッター統計 */}
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex space-x-4">
              <span>文字数: {characterCount}</span>
              <span>行数: {lineCount}</span>
              <span>語数: {wordCount}</span>
            </div>
            <div className="flex space-x-2">
              {currentScript.length > 0 ? (
                <span className="text-green-600">編集中</span>
              ) : (
                <span className="text-gray-400">空</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ボタンエリア */}
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* ボイス生成ボタン */}
            <Button
              onClick={onGenerateVoice}
              disabled={!Object.values(scripts).some(script => script.trim()) || isGeneratingVoice}
              size="sm"
              variant="secondary"
              className="cursor-pointer hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-1"
            >
              {isGeneratingVoice ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  <span>ボイス</span>
                </>
              )}
            </Button>

            {/* 作品保存ボタン */}
            <Button
              onClick={onSaveWork}
              disabled={isSavingWork}
              size="sm"
              variant="primary"
              className="cursor-pointer hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-1"
            >
              {isSavingWork ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>保存</span>
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            作品として保存できます
          </div>
        </div>
      </div>
    </div>
  );
}