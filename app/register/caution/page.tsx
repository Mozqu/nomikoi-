'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/app/firebase/config";
export default function Caution() {
    const router = useRouter();
    const [isValid, setIsValid] = useState(false);

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsValid(e.target.checked);
    }

    const handleNext = async () => {
        if (auth?.currentUser) {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                agreement: true
            }, { merge: true });
        } else {
            router.push("/signup")
        }
        router.push("/register/way_of_drinking")
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
        </div>
    )
}