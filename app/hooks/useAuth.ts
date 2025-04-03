import { useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
  signInWithCustomToken,
  Auth
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('=== useAuth effect start ===');
    const authInstance = getAuth();
    console.log('=== authInstance ===', authInstance);
    if (!authInstance) {
      console.log('=== authInstance is null ===');
      return;
    }
    
    return authInstance.onAuthStateChanged(async (user) => {
      console.log('=== onAuthStateChanged triggered ===');
      setIsAuthenticated(!!user);
      setIsLoading(false);

      console.log('=== auth state ===', {
        user: user ? { uid: user.uid, email: user.email } : null,
        db: !!db,
        authInstance: !!authInstance
      });

      // ユーザーが存在する場合、lastLoginを更新
      if (user && db) {
        const userRef = doc(db, 'users', user.uid);
        console.log('=== updating lastLogin for user ===', user.uid);
        try {
          await updateDoc(userRef, {
            lastLogin: serverTimestamp()
          });
          console.log('=== lastLogin updated successfully ===');
        } catch (error) {
          console.error('lastLoginの更新に失敗しました:', error);
        }
      } else {
        console.log('=== skipping lastLogin update ===', {
          hasUser: !!user,
          hasDb: !!db
        });
      }
    });
  }, []);

  const signup = async (email: string, password: string) => {
    if (!auth) throw new Error('認証が初期化されていません');
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const signupWithGoogle = async () => {
    if (!auth) throw new Error('認証が初期化されていません');
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  };

  return { isLoading, isAuthenticated, signup, signupWithGoogle };
} 