import { X } from "lucide-react"
import { Switch } from "@radix-ui/react-switch"
import { Shield, Camera, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function ImageForm() {
    const [image, setImage] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)


    const photos = [
        {
          id: 1,
          url: "/sample1.jpg",  // URLを一時的に変更
          isMain: true,
        },
        {
          id: 2,
          url: "/sample2.jpg",
        },
        {
          id: 3,
          url: "/sample3.jpg",
        },
        {
          id: 4,
          url: "/sample4.jpg",
        },
    ]
    
        // デバッグ用にphotosの内容を確認
        console.log('Photos:', photos);


    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setImage(file)
        }
    }

    return (
        

  
        <div className="p-4 space-y-8">
          {/* ヘッダー 
          {/* Profile Completion 
          <div className="space-y-4">
            <h2 className="text-xl font-bold">プロフィール充実度</h2>
            <button className="w-full flex items-center justify-between p-4 rounded-full border">
              <span>39%登録済み</span>
              <ArrowLeft size={20} className="rotate-180" />
            </button>
          </div>
          */}

          {/* Photos Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">写真と動画</h2>
            <p className="text-gray-600">自分の良さが伝わる写真を選びましょう。</p>
  
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                photo.url ? (
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
                  <div key={photo.id} className="relative aspect-square">
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
              ))}
              {[5, 6].map((num) => (
                <div key={num} className="relative aspect-square">
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
              ))}
            </div>
            <p className="text-sm text-gray-600">長押しドラッグで並び替え</p>
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