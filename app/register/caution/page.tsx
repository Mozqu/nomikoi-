'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/firebase/config";
import { doc, setDoc } from "firebase/firestore";

export default function Caution() {
    const router = useRouter();
    const [isValid, setIsValid] = useState(false);
    const [error, setError] = useState("");

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsValid(e.target.checked);
    }

    const handleNext = async () => {
        try {
            if (!auth?.currentUser) {
                router.push("/signup");
                return;
            }
            
            if (!db) {
                throw new Error("Firestore is not initialized");
            }

            await setDoc(doc(db, "users", auth.currentUser.uid), {
                agreement: true
            }, { merge: true });
            
            router.push("/register");
        } catch (error) {
            console.error("Error updating user agreement:", error);
            setError("エラーが発生しました。もう一度お試しください。");
        }
    }

    return (
        <div className="flex flex-col items-center space-between h-screen">
            <div className="flex flex-col items-center justify-center flex-1">
                <p className="text-sm p-4">
                    安心して呑恋をご利用いただけるよう、下記項目に同意していただくようお願いしております。
                </p>
                <div className="flex items-center p-4">
                    <Input 
                        id="checkbox"
                        type="checkbox" 
                        className="w-4 h-4 m-4"
                        style={{
                            accentColor: "#000000",
                        }}
                        onChange={handleCheckboxChange}
                    />
                    <label htmlFor="checkbox" className="text-sm">
                        私は20歳以上かつ独身で<a className="pink-text" href="#">利用規約</a>および<a className="pink-text" href="#">プライバシーポリシー</a>に同意します。
                    </label>
                </div>
            </div>
            <div className="flex items-center p-4 w-full">
                <Button
                    className="w-full neon-bg"
                    disabled={!isValid}
                    onClick={handleNext}
                >同意する</Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    )
}