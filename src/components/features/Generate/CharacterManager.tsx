'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CharacterForm } from './CharacterForm';

interface Character {
  id: string;
  name: string;
  age?: string;
  occupation?: string;
  personality?: string;
  description?: string;
}

interface CharacterManagerProps {
  characters: Character[];
  onCharactersChange: (characters: Character[]) => void;
}

export function CharacterManager({
  characters,
  onCharactersChange
}: CharacterManagerProps) {
  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name: '',
      age: '',
      occupation: '',
      personality: '',
      description: ''
    };
    onCharactersChange([...characters, newCharacter]);
  };

  const handleCharacterChange = (index: number, updatedCharacter: Character) => {
    const newCharacters = [...characters];
    newCharacters[index] = updatedCharacter;
    onCharactersChange(newCharacters);
  };

  const handleRemoveCharacter = (index: number) => {
    if (characters.length <= 1) return; // 最低1つは残す
    const newCharacters = characters.filter((_, i) => i !== index);
    onCharactersChange(newCharacters);
  };

  const canRemove = characters.length > 1;

  return (
    <div className="space-y-4">
      {/* キャラクター一覧 */}
      {characters.map((character, index) => (
        <CharacterForm
          key={character.id}
          character={character}
          onCharacterChange={(updatedCharacter) => handleCharacterChange(index, updatedCharacter)}
          onRemove={() => handleRemoveCharacter(index)}
          canRemove={canRemove}
          index={index}
        />
      ))}

      {/* キャラクター追加ボタン */}
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={handleAddCharacter}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          disabled={characters.length >= 10} // 最大10キャラクターまで
        >
          <Plus size={16} />
          <span>キャラクターを追加</span>
        </Button>
      </div>

      {/* 統計情報 */}
      <div className="text-xs text-gray-500 text-center">
        {characters.length}/10 キャラクター
        {characters.length >= 10 && (
          <span className="text-orange-600 ml-2">（上限に達しました）</span>
        )}
      </div>

      {/* ヘルプテキスト */}
      {characters.length === 1 && characters[0].name === '' && (
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="mb-1">💡 <strong>キャラクター設定のコツ：</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>名前は必須項目です</li>
            <li>年齢・職業・性格を設定すると台本作成に役立ちます</li>
            <li>複数のキャラクターを追加できます</li>
            <li>詳細説明には関係性や背景設定を記入しましょう</li>
          </ul>
        </div>
      )}
    </div>
  );
}