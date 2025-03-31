import { X } from "lucide-react"
import { Shield, Camera, Plus, ArrowLeft, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ref, getStorage, uploadBytes, getDownloadURL, listAll, getMetadata, uploadBytesResumable, deleteObject } from "firebase/storage"
import { auth } from "@/app/firebase/config"
import { arrayUnion, doc, updateDoc } from "firebase/firestore"
import { db } from "@/app/firebase/config"
import { useRouter } from "next/navigation"

// 認証状態チェック用のカスタムフック
const useAuthCheck = () => {
    const router = useRouter();
    
    useEffect(() => {
        if (!auth || !auth.currentUser) {
            router.push('/login'); // ログインページへリダイレクト
        }
    }, [router]);

    return auth?.currentUser;
};

export default function ImageForm() {
    const [photos, setPhotos] = useState<any[]>([])
    const [image, setImage] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
    const storage = getStorage();
    const currentUser = useAuthCheck();
    const router = useRouter();

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser || !db) return;

        const uploadId = Date.now().toString();
        setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));
        setUploadingIndex(index);

        try {
            setIsLoading(true);
            setError(null);

            const storageRef = ref(storage, `profile-image/${currentUser.uid}/${Date.now()}_${file.name}`);
            
            const metadata = {
                customMetadata: {
                    userId: currentUser.uid,
                    uploadedAt: new Date().toISOString(),
                    fileName: file.name
                }
            };
            
            const uploadTask = uploadBytesResumable(storageRef, file, metadata);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
                    console.log('アップロード進捗: ' + progress + '%');
                    
                    switch (snapshot.state) {
                        case 'paused':
                            console.log('アップロード一時停止中');
                            break;
                        case 'running':
                            console.log('アップロード進行中');
                            break;
                    }
                },
                (error) => {
                    console.error("アップロードエラー:", error);
                    setError("画像のアップロードに失敗しました");
                },
                async () => {
                    console.log('アップロード完了！');
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    setImage(file);
                    
                    const userRef = doc(db, "users", currentUser.uid);
                    await updateDoc(userRef, {
                        photos: arrayUnion({  
                            url: downloadURL,
                            createdAt: new Date(),
                            isMain: false
                        })
                    });

                    setPhotos(prevPhotos => [...prevPhotos, {
                        url: downloadURL,
                        id: uploadTask.snapshot.ref.name,
                        isMain: false,
                        metadata: metadata.customMetadata
                    }]);

                    // アップロード完了時にステートをリセット
                    setUploadProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[uploadId];
                        return newProgress;
                    });
                    setUploadingIndex(null);
                }
            );

        } catch (err) {
            console.error("画像アップロードエラー:", err);
            setError("画像のアップロードに失敗しました");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const fetchPhotos = async () => {
            if (!currentUser) return;
            
            try {
                const storageRef = ref(storage, `profile-image/${currentUser.uid}`);
                
                const result = await listAll(storageRef);
                
                const photoPromises = result.items.map(async (item) => {
                    const url = await getDownloadURL(item);
                    const metadata = await getMetadata(item);
                    
                    return {
                        url,
                        id: item.name,
                        isMain: false,
                        metadata: metadata.customMetadata
                    };
                });
                
                const photosList = await Promise.all(photoPromises);
                setPhotos(photosList);
                
            } catch (error) {
                console.error("画像の取得に失敗しました:", error);
                setError("画像の取得に失敗しました");
            }
        };

        fetchPhotos();
    }, [currentUser]);

    useEffect(() => {
        console.log('Current auth state:', auth?.currentUser);
        console.log('Current user:', currentUser);
    }, [currentUser]);

    // 改善されたダイアログコンポーネント
    const showDeleteConfirmationDialog = (onConfirm: () => void) => {
        const dialog = document.createElement('dialog');
        
        // 洗練されたスタイルを適用
        dialog.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-0 rounded-xl shadow-2xl backdrop-filter backdrop-blur-sm bg-opacity-90 bg-black text-white border border-gray-700 z-50 w-[90%] max-w-md overflow-hidden';
        
        dialog.innerHTML = `
            <div class="p-6 space-y-4">
                <div class="flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-center">画像を削除しますか?</h3>
                <p class="text-gray-400 text-center text-sm">この操作は取り消せません。</p>
                <div class="grid grid-cols-2 gap-3 pt-2">
                    <button class="w-full px-4 py-3 text-sm font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors" id="cancel">
                        キャンセル
                    </button>
                    <button class="w-full px-4 py-3 text-sm font-medium rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 transition-colors" id="confirm">
                        削除する
                    </button>
                </div>
            </div>
        `;
        
        // ダイアログを表示する前にアニメーションのためのクラスを追加
        document.body.appendChild(dialog);
        
        // アニメーション用のスタイルシートを追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -40%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            
            dialog {
                animation: fadeIn 0.3s ease-out forwards;
            }
            
            dialog::backdrop {
                background-color: rgba(0, 0, 0, 0.7);
                transition: opacity 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        
        // ダイアログを表示
        dialog.showModal();
        
        // ボタンのイベントリスナー
        const cancelButton = dialog.querySelector('#cancel');
        const confirmButton = dialog.querySelector('#confirm');
        
        cancelButton?.addEventListener('click', () => {
            dialog.classList.add('fade-out');
            dialog.close();
            document.body.removeChild(dialog);
            document.head.removeChild(style);
        });
        
        confirmButton?.addEventListener('click', () => {
            dialog.close();
            document.body.removeChild(dialog);
            document.head.removeChild(style);
            onConfirm();
        });
        
        // バックドロップクリックで閉じる（オプション）
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.close();
                document.body.removeChild(dialog);
                document.head.removeChild(style);
            }
        });
    };

    // 使用例
    const handleDeleteButtonClick = (photo: any) => {
        showDeleteConfirmationDialog(async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Storageから画像を削除
                const imageRef = ref(storage, `profile-image/${currentUser?.uid}/${photo.id}`);
                await deleteObject(imageRef);

                // Firestoreから画像情報を削除
                if (!db || !currentUser?.uid) {
                    throw new Error("データベースまたはユーザー情報が見つかりません");
                }
                const userRef = doc(db, "users", currentUser.uid);
                await updateDoc(userRef, {
                    photos: photos.filter((p: any) => p.id !== photo.id).map((p: any) => ({
                        url: p.url,
                        createdAt: p.createdAt,
                        isMain: p.isMain
                    }))
                });

                // ローカルのstate更新
                setPhotos(photos.filter((p: any) => p.id !== photo.id));

                console.log('画像を削除しました');
            } catch (err) {
                console.error("画像の削除に失敗しました:", err);
                setError("画像の削除に失敗しました");
            } finally {
                setIsLoading(false);
            }
        });
    };

    return (
        

  
        <div className="p-4 space-y-8 w-full">
          

          

          {/* Photos Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">写真</h2>
            <p className="text-gray-600"></p>
  
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, index) => {
                const photo = photos[index];
                const isUploading = uploadingIndex === index;
                
                return photo?.url ? (
                  <div key={photo.id} className="relative aspect-square">
                    <Image
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button 
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full z-index-10"
                      onClick={() => handleDeleteButtonClick(photo)}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    {photo.isMain && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white rounded-full text-xs">
                        メイン
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 w-5 h-5 flex items-center justify-center bg-black/50 text-white rounded-full text-xs">
                      {index + 1}
                    </span>
                  </div>
                ) : (
                  <div key={index} className="relative aspect-square">
                    <label 
                      className="w-full h-full flex items-center justify-center rounded-lg cursor-pointer"
                      style={{
                        border: '2px dashed #555',
                      }}
                    >
                      <input
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, index)}
                        disabled={uploadingIndex !== null}
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                          <span className="text-xs text-gray-400 mt-2">
                            {Math.round(Object.values(uploadProgress)[0])}%
                          </span>
                        </div>
                      ) : (
                        <Plus className="h-6 w-6 text-gray-400" />
                      )}
                    </label>
                  </div>
                )
              })}

            </div>
          </div>
          {/*
          {/* Best Photo Toggle 
          <div className="flex items-center justify-between py-4 border-t">
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6" />
              <span className="font-medium">Best Photo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">オン</span>
              <Switch />
            </div>
          </div>
  
           Profile Verification 
          <button className="w-full flex items-center justify-between py-4 border-t">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <span className="font-medium">プロフィール認証</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">未認証</span>
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </div>
          </button>
  
          {/* Interests Section 
          <div className="space-y-4 border-t pt-4">
            <h2 className="text-xl font-bold">趣味・興味</h2>
            <p className="text-gray-600">大好きな趣味や興味のあることを共有しましょう。</p>
          </div>
          */}


        </div>
      
  
    )
}   