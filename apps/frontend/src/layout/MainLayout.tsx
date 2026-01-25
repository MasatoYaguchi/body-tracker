import type React from 'react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { UserNameRegistrationModal } from '../auth/components/UserNameRegistrationModal';
import { useAuth } from '../auth/useAuth';
import { UserHeader } from './UserHeader';

/**
 * 認証済みユーザー向けのメインレイアウト
 * ヘッダーとメインコンテンツエリア、プロフィール登録モーダルを含む
 */
export function MainLayout(): React.ReactElement {
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // ユーザー名が未設定の場合、または手動で開いた場合にモーダルを表示
  // Note: ユーザーが名前を設定した後も、手動で開いている場合(isProfileModalOpen=true)は表示され続ける
  const showNameRegistration = (user && !user.name) || isProfileModalOpen;

  return (
    <div>
      <UserHeader onProfileClick={() => setIsProfileModalOpen(true)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      {/* ユーザー名登録モーダル */}
      <UserNameRegistrationModal
        isOpen={!!showNameRegistration}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
