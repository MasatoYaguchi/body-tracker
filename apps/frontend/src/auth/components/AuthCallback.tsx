import { useEffect, useState } from 'react';
import type { AuthDomainError } from '../domain/result';
import { handleAuthCallback } from '../services/authCodeFlow';

export function AuthCallback() {
  const [message, setMessage] = useState('コード交換中...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await handleAuthCallback(window.location.href);
      if (cancelled) return;
      if (!result.ok) {
        const e: AuthDomainError = result.error;
        setIsError(true);
        setMessage(`${e.message} (${e.code})`);
        return;
      }
      setMessage('ログイン成功。リダイレクト中...');
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm text-center space-y-4">
        <h1 className="text-lg font-semibold">認証処理</h1>
        <p className={isError ? 'text-red-600 text-sm' : 'text-gray-700 text-sm'}>{message}</p>
        {!isError && (
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent mx-auto rounded-full" />
        )}
        {isError && (
          <button
            type="button"
            onClick={() => window.location.replace('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            戻る
          </button>
        )}
      </div>
    </div>
  );
}
