import { X } from "lucide-react"
import { Switch } from "@radix-ui/react-switch"
import { Shield, Camera, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { ref } from "firebase/storage"
import { storage } from "@/app/firebase/config"
import { uploadBytes } from "firebase/storage"
import { auth } from "@/app/firebase/config"
import { arrayUnion, doc, updateDoc } from "firebase/firestore"
import { db } from "@/app/firebase/config"
import { getDownloadURL } from "firebase/storage"
import { useRouter } from "next/navigation"


export default function ImageForm() {
    const [image, setImage] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)


    const photos = []
    
        // デバッグ用にphotosの内容を確認
        console.log('Photos:', photos);


    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            setError(null);

            // Firebase Storageへの参照を作成
            const storageRef = ref(storage, `photos/${auth.currentUser?.uid}/${Date.now()}_${file.name}`);
            
            // 画像をアップロード
            const snapshot = await uploadBytes(storageRef, file);
            
            // アップロードした画像のURLを取得
            const downloadURL = await getDownloadURL(snapshot.ref);

            setImage(file);
            
            // Firestoreにも画像情報を保存
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await updateDoc(userRef, {
                photos: arrayUnion({  
                    url: downloadURL,
                    createdAt: new Date(),
                    isMain: false
                })
            });

        } catch (err) {
            console.error("画像アップロードエラー:", err);
            setError("画像のアップロードに失敗しました");
        } finally {
            setIsLoading(false);
        }
    }

    const router = useRouter()

    return (
        

  
        <div className="p-4 space-y-8">
          
          {/* Profile Completion */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">プロフィール設定</h2>
            <button 
              className="w-full flex items-center justify-between p-4 rounded-full border"
              onClick={() => router.push('/register/way_of_drinking')}
            >
              <span>もう一度お酒の質問に答える</span>
              <ArrowLeft size={20} className="rotate-180" />
            </button>
          </div>
          

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
                    />
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
                    <label className="w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer">
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