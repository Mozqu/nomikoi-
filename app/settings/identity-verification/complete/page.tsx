'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IdentityVerificationComplete() {
  const router = useRouter();

  useEffect(() => {
    // 3秒後に設定ページに自動遷移
    const timer = setTimeout(() => {
      router.push('/settings');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            本人確認を受け付けました
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            本人確認書類を受け付けました。確認には数分かかる場合があります。
            確認が完了次第、ステータスが更新されます。
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            設定ページに戻ります...
          </div>
          <Button
            onClick={() => router.push('/settings')}
            className="w-full mt-4"
            variant="outline"
          >
            今すぐ戻る
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 