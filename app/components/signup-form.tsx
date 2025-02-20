'use client'
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, signupWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password);
      router.push('/mypage'); // 登録成功後のリダイレクト
    } catch (error) {
      console.error('登録エラー:', error);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signupWithGoogle();
      router.push('/mypage'); // Google登録成功後のリダイレクト
    } catch (error) {
      console.error('Google登録エラー:', error);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email">メールアドレス:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="password">パスワード:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          メールアドレスで登録
        </button>
      </form>
      
      <div className="text-center">または</div>
      
      <button
        onClick={handleGoogleSignup}
        className="w-full p-2 border border-gray-300 rounded flex items-center justify-center gap-2"
      >
        <img src="/google-icon.png" alt="Google" className="w-6 h-6" />
        Googleで登録
      </button>
    </div>
  );
}; 