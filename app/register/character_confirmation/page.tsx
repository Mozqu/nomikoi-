'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/app/firebase/config';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { X } from 'lucide-react';

export default function CharacterConfirmation() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedResults | null>(null);

  useEffect(() => {
    const responseId = searchParams.get('id');
    if (!responseId) {
      setError('結果IDが見つかりません');
      setLoading(false);
      return;
    }

    const checkResults = async () => {
      try {
        const resultsRef = doc(db, 'character_results', responseId);
        const resultsSnap = await getDoc(resultsRef);

        if (!resultsSnap.exists()) {
          setError('結果の処理中です。しばらくお待ちください。');
          setLoading(false);
          return;
        }

        const resultsData = resultsSnap.data();
        
        // 権限チェック
        if (resultsData.userId !== auth.currentUser?.uid) {
          setError('この結果の閲覧権限がありません');
          setLoading(false);
          return;
        }

        setResults(resultsData.results);
        setLoading(false);

      } catch (error) {
        console.error('結果の取得に失敗しました:', error);
        setError('結果の取得に失敗しました');
        setLoading(false);
      }
    };

    checkResults();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">結果を準備しています...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">診断結果</h1>
      
      <div className="shadow rounded-lg mb-6">
        <div className="text-center mb-8">
            <p className="mb-4">
                あなたの飲み方タイプは...
            </p>
            <div className="text-center mb-8 flex items-center justify-center">
                <h2 className="text-3xl font-bold text-purple-600 mb-0">
                    {results.characterType}
                </h2>
                <X className="w-10 h-10" />
                <h2 className="text-3xl font-bold text-purple-600 mb-0">
                    {results.characterName}
                </h2>
            </div>
        </div>

        <div className="space-y-6">
            <div className="flex items-center justify-center">
                <div style={{flexShrink: 0}} className="text-center w-20 h-20 p-4 bg-pink-500 text-white rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        {results.characterType}
                    </div>
                </div>
                <div className="p-4">
                    {results.typeDescription}
                </div>

            </div>
            <div className="flex items-center justify-center">
                <div style={{flexShrink: 0}} className="text-center w-20 h-20 p-4 bg-pink-500 text-white rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        {results.characterName}
                    </div>
                </div>
                <div className="p-4">
                    {results.nameDescription}
                </div>
            </div>
        </div>

        <div className="mt-8 flex flex-col items-center space-y-4">
          <button
            onClick={() => {
              if (searchParams.get('from') === 'settings') {
                window.location.href = '/settings';
              } else {
                window.location.href = '/register/recommend_drinking_character';
              }
            }}
            className="neon-bg text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors w-full max-w-xs"
          >
            完了する
          </button>
        </div>
        
      </div>
    </div>
  );
}
