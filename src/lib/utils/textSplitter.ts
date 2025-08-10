/**
 * テキストをリアルタイム音声生成に適した単位で分割するユーティリティ
 */

export interface TextChunk {
  id: string;
  text: string;
  index: number;
  originalLength: number;
}

/**
 * テキストを改行とSSMLタグで分割し、200文字制限に対応
 */
export function splitTextForRealtimeTTS(text: string): TextChunk[] {
  if (!text.trim()) {
    return [];
  }

  // 改行で基本分割
  const lines = text.split('\n').filter(line => line.trim());
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 200文字以下の場合はそのまま
    if (trimmedLine.length <= 200) {
      chunks.push({
        id: `chunk_${chunkIndex}`,
        text: trimmedLine,
        index: chunkIndex,
        originalLength: trimmedLine.length
      });
      chunkIndex++;
    } else {
      // 200文字を超える場合は分割
      const subChunks = splitLongText(trimmedLine);
      for (const subChunk of subChunks) {
        chunks.push({
          id: `chunk_${chunkIndex}`,
          text: subChunk,
          index: chunkIndex,
          originalLength: subChunk.length
        });
        chunkIndex++;
      }
    }
  }

  return chunks;
}

/**
 * 200文字を超える長文を適切な位置で分割
 */
function splitLongText(text: string): string[] {
  const maxLength = 200;
  const chunks: string[] = [];
  let currentText = text;

  while (currentText.length > maxLength) {
    // 200文字境界の前後50文字以内で文末記号を探す
    const searchStart = Math.max(0, maxLength - 50);
    const searchEnd = Math.min(currentText.length, maxLength + 50);
    const searchArea = currentText.substring(searchStart, searchEnd);
    
    // 文末記号の位置を探す（後ろから）
    const sentenceEnders = ['。', '．', '！', '？', '　']; // 全角スペースも含む
    let splitPoint = -1;
    
    for (let i = searchArea.length - 1; i >= 0; i--) {
      if (sentenceEnders.includes(searchArea[i])) {
        splitPoint = searchStart + i + 1; // 文末記号の直後で分割
        break;
      }
    }

    // 文末記号が見つからない場合は200文字で強制分割
    if (splitPoint === -1) {
      splitPoint = maxLength;
    }

    chunks.push(currentText.substring(0, splitPoint));
    currentText = currentText.substring(splitPoint);
  }

  // 残りのテキスト
  if (currentText.trim()) {
    chunks.push(currentText);
  }

  return chunks;
}

/**
 * SSMLタグを考慮したテキスト分割（将来の拡張用）
 */
export function splitTextWithSSML(text: string): TextChunk[] {
  // 現時点では基本分割のみ実装
  // 将来的に<p>, <s>, <break>などのタグ対応を追加予定
  return splitTextForRealtimeTTS(text);
}

/**
 * 分割結果の統計情報
 */
export interface SplitStatistics {
  totalChunks: number;
  totalLength: number;
  averageLength: number;
  maxLength: number;
  minLength: number;
}

export function analyzeSplitResult(chunks: TextChunk[]): SplitStatistics {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      totalLength: 0,
      averageLength: 0,
      maxLength: 0,
      minLength: 0
    };
  }

  const lengths = chunks.map(chunk => chunk.originalLength);
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);

  return {
    totalChunks: chunks.length,
    totalLength,
    averageLength: Math.round(totalLength / chunks.length),
    maxLength: Math.max(...lengths),
    minLength: Math.min(...lengths)
  };
}