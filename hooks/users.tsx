import { db } from "@/app/firebase/config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"


export const useUser = (uid: string) => {
    const [userData, setUserData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            if (!uid) return;

            try {
                const userRef = doc(db, "users", uid);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                } else {
                    throw new Error("ユーザーが見つかりませんでした");
                }
            } catch (err) {
                console.error('ユーザー情報の取得に失敗しました:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [uid])

    return { userData, loading, error }
}


