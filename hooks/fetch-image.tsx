import { useState, useEffect } from 'react'
import { ref, getDownloadURL, getStorage, listAll } from 'firebase/storage'
import { storage } from '@/app/firebase/config'

export const fetchUserImage = (uid: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchImage = async () => {
        if (!uid) return;
            
        try {
            const storage = getStorage();
            const imagesRef = ref(storage, `profile-image/${uid}`);
            const imagesList = await listAll(imagesRef);
            
            const urls = await Promise.all(
                imagesList.items.map(imageRef => getDownloadURL(imageRef))
            );
            console.log(urls[0]);
            setImageUrl(urls[0]);
        } catch (error) {
            console.error('画像の取得に失敗しました:', error);
            // デフォルト画像を設定
            setImageUrl('/home-background.jpg');
        }
        }
        fetchImage()
  }, [uid])

  return { imageUrl, loading, error }
}