'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function GeneratePage() {
  const [script, setScript] = useState('');

  const handleGenerate = () => {
    // 現在は何もしない
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI作品生成</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label htmlFor="script" className="block text-lg font-medium text-gray-700 mb-2">
              スクリプト
            </label>
            <textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="作品の内容やスクリプトを入力してください..."
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              className="cursor-pointer"
            >
              生成
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}