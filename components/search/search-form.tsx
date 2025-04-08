import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TagSuggestion {
    tagName: string;
    count: number;
    users: SearchResult[];
}

interface PhotoData {
    createdAt: any;
    isMain: boolean;
    url: string;
}

interface SearchResult {
    id: string;
    name: string;
    bio?: string;
    photos?: PhotoData[];
    profile?: {
        bio?: string;
        tags?: {
            drinking?: string[];
            hobby?: string[];
        };
    };
    matches: {
        bio?: boolean;
        tags: string[];
    };
}

export default function SearchForm() {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // コンポーネントマウント時にフォーカス
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // タグ検索（前方後方一致）
    const handleTagSearch = async () => {
        if (!searchQuery.trim() || !db) {
            setSuggestedTags([]);
            return;
        }

        try {
            const tagQuery = searchQuery.toLowerCase().replace(/^#/, '');
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            
            // タグの候補とその使用回数を収集
            const tagCounts = new Map<string, number>();
            const usersByTag = new Map<string, SearchResult[]>();

            usersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const drinkingTags = data.profile?.tags?.drinking || [];
                const hobbyTags = data.profile?.tags?.hobby || [];
                const allTags = [...drinkingTags, ...hobbyTags];

                allTags.forEach(tag => {
                    if (tag.toLowerCase().includes(tagQuery)) {
                        // タグの使用回数を更新
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);

                        // タグごとのユーザー情報を収集
                        const userInfo: SearchResult = {
                            id: doc.id,
                            name: data.name || '',
                            bio: data.bio || '',
                            photos: data.photos || [],
                            profile: {
                                bio: data.profile?.bio || '',
                                tags: {
                                    drinking: data.profile?.tags?.drinking || [],
                                    hobby: data.profile?.tags?.hobby || []
                                }
                            },
                            matches: {
                                bio: false,
                                tags: [tag]
                            }
                        };

                        const users = usersByTag.get(tag) || [];
                        users.push(userInfo);
                        usersByTag.set(tag, users);
                    }
                });
            });

            // タグを使用回数でソート
            const sortedTags = Array.from(tagCounts.entries())
                .map(([tagName, count]) => ({ 
                    tagName, 
                    count,
                    users: usersByTag.get(tagName) || []
                }))
                .sort((a, b) => b.count - a.count);

            setSuggestedTags(sortedTags);
            if (!selectedTag) {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching tags:', error);
            setSuggestedTags([]);
        }
    };

    // 通常検索（プロフィールとタグを検索）
    const handleNormalSearch = async () => {
        if (selectedTag || !searchQuery.trim() || !db) {
            return;
        }

        try {
            // 全角スペースを半角スペースに変換してから分割
            const keywords = searchQuery
                .toLowerCase()
                .replace(/　/g, ' ') // 全角スペースを半角に変換
                .split(' ')
                .filter(k => k);

            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            
            const results = usersSnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const name = data.name || '';
                    const bio = data.bio || '';
                    const profile = data.profile || {
                        bio: '',
                        tags: {
                            drinking: [],
                            hobby: []
                        }
                    };
                    const drinkingTags = profile.tags?.drinking || [];
                    const hobbyTags = profile.tags?.hobby || [];
                    const allTags = [...drinkingTags, ...hobbyTags];

                    // マッチしたキーワードの情報を収集
                    const matches = {
                        bio: keywords.some(keyword => bio.toLowerCase().includes(keyword)),
                        tags: allTags.filter(tag => 
                            keywords.some(keyword => tag.toLowerCase().includes(keyword))
                        )
                    };

                    return {
                        id: doc.id,
                        name,
                        bio,
                        photos: data.photos || [],
                        profile,
                        matches
                    } as SearchResult;
                })
                .filter(user => {
                    // bioまたはタグにマッチしているユーザーのみを返す
                    return user.matches.bio || user.matches.tags.length > 0;
                });

            setSearchResults(results);
            setSuggestedTags([]);
        } catch (error) {
            console.error('Error searching:', error);
            setSearchResults([]);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.startsWith('#')) {
                handleTagSearch();
            } else if (!selectedTag) {
                handleNormalSearch();
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // テキスト内のキーワードをハイライトする関数
    const highlightKeywords = (text: string, shouldHighlight: boolean) => {
        if (!shouldHighlight || !searchQuery.trim()) return text;

        const keywords = searchQuery
            .toLowerCase()
            .replace(/　/g, ' ') // 全角スペースを半角に変換
            .split(' ')
            .filter(k => k);

        let highlightedText = text;

        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="font-bold">$1</span>');
        });

        return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* 検索ヘッダー */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800">
                <button onClick={() => {
                    if (selectedTag) {
                        setSelectedTag(null);
                        setSearchResults([]);
                        setSearchQuery('');
                    } else {
                        router.back();
                    }
                }}>
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 relative">
                    {selectedTag ? (
                        <div className="py-2 px-3">
                            <span className="font-medium">#{selectedTag}</span>
                            <span className="text-gray-400 ml-2">のユーザー</span>
                        </div>
                    ) : (
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder={searchQuery.startsWith('#') ? "#タグを入力" : "ユーザーを検索"}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900 border-none pl-10"
                        />
                    )}
                    {!selectedTag && (
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    )}
                </div>
            </div>

            {/* タグ候補リスト */}
            {searchQuery.startsWith('#') && !selectedTag && (
                <div className="divide-y divide-gray-800">
                    {suggestedTags.map((tag) => (
                        <div key={tag.tagName} className="hover:bg-gray-900">
                            <button
                                onClick={() => {
                                    setSelectedTag(tag.tagName);
                                    setSearchResults(tag.users);
                                    setSearchQuery('');
                                }}
                                className="w-full px-4 py-3 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                                    <span className="text-xl">#</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium">#{tag.tagName}</p>
                                    <p className="text-sm text-gray-400">投稿 {tag.count} 件以上</p>
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 検索結果リスト */}
            {(!searchQuery.startsWith('#') || selectedTag) && searchResults.length > 0 && (
                <div className="divide-y divide-gray-800">
                    {searchResults.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => {
                                router.push(`/profile/${user.id}`);
                            }}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-900"
                        >
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={user.photos?.[0]?.url} />
                                <AvatarFallback className="bg-gray-800">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                                <p className="font-medium">{user.name}</p>
                                {user.bio && (
                                    <p className="text-sm text-gray-400">
                                        {highlightKeywords(user.bio, user.matches.bio || false)}
                                    </p>
                                )}
                                {user.matches.tags.length > 0 && !selectedTag && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {user.matches.tags.map(tag => (
                                            <span 
                                                key={tag} 
                                                className="text-xs text-pink-300 font-bold"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* 検索結果が0件の場合 */}
            {!searchQuery.startsWith('#') && searchQuery.trim() && searchResults.length === 0 && (
                <div className="p-4 text-center text-gray-400">
                    検索結果が見つかりませんでした
                </div>
            )}
        </div>
    );
} 