import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useRepo } from '@/hooks/useRepo';
import { useAppSelector } from '@/store/hooks';

const AccountRedux = () => {
  const navigate = useNavigate();
  
  // Используем хуки для работы с данными
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { repos, isLoading: reposLoading, getRepos } = useRepo();
  
  // Получаем состояние напрямую из store
  const csrfToken = useAppSelector((state) => state.auth.csrfToken);

  // Загружаем репозитории пользователя
  useEffect(() => {
    if (isAuthenticated && user.username) {
      getRepos(user.username);
    }
  }, [isAuthenticated, user.username]);

  // Если не авторизован - перенаправляем на главную
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading || reposLoading) {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="account-container">
      <div className="account-header">
        <h1>Hello, {user.username}!</h1>
        <div className="user-info">
          <p>User ID: {user.id}</p>
          <p>Is Authenticated: Yes</p>
          {csrfToken && (
            <p className="csrf-info">
              CSRF Token: {csrfToken.substring(0, 16)}...
            </p>
          )}
        </div>
      </div>

      <div className="repos-section">
        <h2>Your Repositories ({repos.length})</h2>
        
        {repos.length === 0 ? (
          <p>No repositories yet. Create your first repository!</p>
        ) : (
          <ul className="repo-list">
            {repos.map((repo: any) => (
              <li key={`${repo.username}-${repo.reponame}`}>
                <div className="repo-item">
                  <strong>{repo.reponame}</strong>
                  <span className={`access-badge ${repo.access}`}>
                    {repo.access}
                  </span>
                  {repo.description && (
                    <p className="repo-description">{repo.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="actions-section">
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/create-repo')}
        >
          Create Repository
        </button>
        
        <button 
          className="btn btn-danger"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccountRedux;