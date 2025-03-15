import { X } from "lucide-react"
import { Shield, Camera, Plus, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ref, getStorage, uploadBytes, getDownloadURL, listAll, getMetadata, uploadBytesResumable, deleteObject } from "firebase/storage"
import { auth } from "@/app/firebase/config"
import { arrayUnion, doc, updateDoc } from "firebase/firestore"
import { db } from "@/app/firebase/config"
import { useRouter } from "next/navigation"


export default function ImageForm() {
    const [photos, setPhotos] = useState<any[]>([])
    const [image, setImage] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const storage = getStorage();



    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            setError(null);

            const storageRef = ref(storage, `profile-image/${auth.currentUser?.uid}/${Date.now()}_${file.name}`);
            
            const metadata = {
                customMetadata: {
                    userId: auth?.currentUser?.uid || "",
                    uploadedAt: new Date().toISOString(),
                    fileName: file.name
                }
            };
            
            // uploadBytesResumableを使用して進捗状況をモニタリング
            const uploadTask = uploadBytesResumable(storageRef, file, metadata);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // アップロードの進捗状況
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('アップロード進捗: ' + progress + '%');
                    
                    // 現在の状態も表示
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
                    // アップロード完了時の処理
                    console.log('アップロード完了！');
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    setImage(file);
                    
                    // Firestoreに画像情報を保存
                    const userRef = doc(db, "users", auth.currentUser!.uid);
                    await updateDoc(userRef, {
                        photos: arrayUnion({  
                            url: downloadURL,
                            createdAt: new Date(),
                            isMain: false
                        })
                    });
                    // 新しい画像を写真リストに追加
                    setPhotos(prevPhotos => [...prevPhotos, {
                        url: downloadURL,
                        id: uploadTask.snapshot.ref.name,
                        isMain: false,
                        metadata: metadata.customMetadata
                    }]);
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
            if (!auth.currentUser) return;
            
            try {
                // profile-imageフォルダ内のユーザーのディレクトリを参照
                const storageRef = ref(storage, `profile-image/${auth.currentUser.uid}`);
                
                // ディレクトリ内のすべてのファイルを取得
                const result = await listAll(storageRef);
                
                // 各ファイルのダウンロードURLとメタデータを取得
                const photoPromises = result.items.map(async (item) => {
                    const url = await getDownloadURL(item);
                    const metadata = await getMetadata(item);
                    
                    return {
                        url,
                        id: item.name,
                        isMain: false, // デフォルトはfalse
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
    }, []);

    const router = useRouter()

    return (
        

  
        <div className="p-4 space-y-8 w-full">
          

          

          {/* Photos Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">写真</h2>
            <p className="text-gray-600"></p>
  
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, index) => {
                const photo = photos[index];

                
                return photo?.url ? (
                  <div key={photo.id} className="relative aspect-square">
                    <Image
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      onClick={async () => {
                        console.log("画像を削除します");
                        try {
                          if (!auth?.currentUser) return;
                          
                          // 削除確認モーダルを表示
                          const dialog = document.createElement('dialog');
                          dialog.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-white rounded-lg shadow-xl';
                          
                          dialog.innerHTML = `
                            <div class="space-y-4">
                              <h3 class="text-lg font-medium">画像を削除しますか?</h3>
                              <p class="text-gray-500">この操作は取り消せません。</p>
                              <div class="flex justify-end gap-3">
                                <button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg" id="cancel">
                                  キャンセル
                                </button>
                                <button class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg" id="confirm">
                                  削除する
                                </button>
                              </div>
                            </div>
                          `;

                          document.body.appendChild(dialog);
                          dialog.showModal();

                          const result = await new Promise((resolve) => {
                            dialog.querySelector('#confirm')?.addEventListener('click', () => resolve(true));
                            dialog.querySelector('#cancel')?.addEventListener('click', () => resolve(false));
                          });

                          dialog.close();
                          document.body.removeChild(dialog);

                          if (!result) return;
                          
                          // Storageから画像を削除
                          const imageRef = ref(storage, `profile-image/${auth.currentUser.uid}/${photo.id}`);
                          await deleteObject(imageRef);
                          
                          // 画像リストから削除
                          setPhotos(prev => prev.filter(p => p.id !== photo.id));
                          console.log("画像を削除しました");
                        } catch (error) {
                          console.error("画像の削除に失敗しました:", error);
                          alert("画像の削除に失敗しました");
                        }
                      }}

                    />
                    <button 
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full z-index-10"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    <button className="absolute top-2 right-2 p-1 bg-black/50 rounded-full">
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
                        onChange={handleImageChange}
                      />
                      <Plus className="h-6 w-6 text-gray-400" />
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