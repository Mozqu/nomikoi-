import { db } from "@/app/firebase/config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"

export const useMessages = (messageRoomId: string) => {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const fetchMessages = async () => {
            if (!messageRoomId) return;

            try {
                const messagesRef = collection(db, "message_rooms", messageRoomId, "messages")
                const messagesSnap = await getDocs(messagesRef) 

                const messagesList = messagesSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate?.()
                        ? doc.data().created_at.toDate().toLocaleString('ja-JP')
                        : ''    
                }))

                setMessages(messagesList)
            } catch (err) {
                console.error('メッセージの取得に失敗しました:', err);
                setError(err as Error);
            } finally { 
                setLoading(false);
            }
        }

        fetchMessages();
    }, [messageRoomId])

    return { messages, loading, error }
}

// lastMessage関数を完全に削除
