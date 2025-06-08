// apps/frontend/src/auth/index.ts
// 認証モジュールのエントリーポイント（分割版）

// ===== Core Provider =====
export { AuthContext } from './providers/AuthContext';
export { AuthProvider } from './providers/AuthProvider';

// ===== Types =====
export type {
  AuthActions,
  AuthConditionalRender,
  AuthContextType,
  AuthError,
  AuthState,
  GoogleAuthResponse,
  StoredAuthData,
  User,
} from './types/auth.types';

// ===== Custom Hooks =====
export {
  useAuth,
  useAuthConditional,
  useCurrentUser,
  useRequireAuth,
} from './useAuth';

// ===== Services (Advanced Usage) =====
export {
  authApi,
  getAuthErrorMessage,
  isAuthenticationError,
} from './services/authApi';
export { authStorage } from './services/authStorage';

// ===== Error Classes =====
export {
  AuthenticationError,
  TokenValidationError,
} from './types/auth.types';

// ===== Context Helpers =====
export {
  getAuthContextDebugInfo,
  getAuthErrorBoundaryMessage,
  validateAuthContext,
} from './providers/AuthContext';

// ===== Components (今後追加予定) =====
// export { GoogleLoginButton } from './components/GoogleLoginButton';
// export { ProtectedRoute } from './components/ProtectedRoute';

// ===== 使用例コメント =====

/*
基本的な使用方法:

1. アプリのルートでAuthProviderを設定:
```tsx
import { AuthProvider } from './auth';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

2. コンポーネントで認証状態を使用:
```tsx
import { useAuth, useCurrentUser } from './auth';

function UserProfile() {
  const { isAuthenticated, logout } = useAuth();
  const user = useCurrentUser();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return (
    <div>
      <h1>Hello, {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

3. React 19新機能を活用:
```tsx
import { useAuth, useAuthConditional } from './auth';

function Dashboard() {
  const { isTransitioning, isLoading } = useAuth(); // 直接分割代入
  const { showForAuth, showWhileLoading } = useAuthConditional();
  
  return (
    <>
      {showWhileLoading(<LoadingSpinner />)}
      {showForAuth(
        <div>
          {isTransitioning && <TransitionIndicator />}
          <UserDashboard />
        </div>
      )}
    </>
  );
}
```

4. ログイン/ログアウト処理:
```tsx
import { useAuth } from './auth';

function LoginButton() {
  const { login, logout, isAuthenticated, isTransitioning } = useAuth();
  
  const handleGoogleLogin = async (credential: string) => {
    try {
      await login(credential);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return isAuthenticated ? (
    <button onClick={logout} disabled={isTransitioning}>
      {isTransitioning ? 'Logging out...' : 'Logout'}
    </button>
  ) : (
    <GoogleLoginButton onLogin={handleGoogleLogin} />
  );
}
```
*/
