import { Button } from '@/components/ui/button';

export function LineLoginButton() {
  const handleLogin = () => {
    // デバッグログを追加
    console.log('[DEBUG] LINE Login Config:', {
      channelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID,
      callbackUrl: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL,
      currentUrl: window.location.href
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL!,
      state: 'random_state',
      scope: 'profile openid email'
    });

    const url = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
    console.log('[DEBUG] Generated LINE Auth URL:', url);
    window.location.href = url;
  };

  return (
    <Button 
      onClick={handleLogin}
      className="bg-[#00B900] hover:bg-[#00A000] text-white"
    >
      LINEでログイン
    </Button>
  );
} 