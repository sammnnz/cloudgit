import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  fetchUserRepos, 
  fetchRepoByPath, 
  createRepo, 
  deleteRepo, 
  fetchRepoData,
  RepoData 
} from '@/store/slices/repoSlice';
import type { ApiResponse } from '@/store/types';

// ============================================================================
// RETURN TYPE FOR useRepo HOOK
// ============================================================================

export interface UseRepoReturn {
  userRepos: RepoData[];
  currentRepo: RepoData | null;
  repoData: any;
  loading: boolean;
  error: string | null;
  operation: string | null;
  repos: RepoData[];
  isLoading: boolean;
  getRepos: (username: string) => Promise<RepoData[]>;
  getRepo: (username: string, reponame: string, access?: string) => Promise<RepoData>;
  createNewRepo: (username: string, reponame: string, access: 'private' | 'public', description: string) => Promise<ApiResponse>;
  removeRepo: (username: string, reponame: string) => Promise<ApiResponse>;
  getRepoData: (username: string, reponame: string, branch?: string, dir?: string) => Promise<any>;
}

// ============================================================================
// useRepo HOOK
// ============================================================================

/**
 * Хук для работы с репозиториями
 * 
 * @example
 * const { repos, isLoading, error, getRepos, createNewRepo } = useRepo();
 * 
 * // Получение репозиториев пользователя
 * const userRepos = await getRepos('username');
 * 
 * // Создание репозитория
 * await createNewRepo('username', 'my-repo', 'private', 'My description');
 */
export const useRepo = (): UseRepoReturn => {
  const dispatch = useAppDispatch();
  const repo = useAppSelector((state) => state.repo);

  /**
   * Получение репозиториев пользователя
   */
  const getRepos = async (username: string): Promise<RepoData[]> => {
    return await dispatch(fetchUserRepos(username)).unwrap();
  };

  /**
   * Получение репозитория по пути
   */
  const getRepo = async (username: string, reponame: string, access?: string): Promise<RepoData> => {
    return await dispatch(fetchRepoByPath({ username, reponame, access })).unwrap();
  };

  /**
   * Создание нового репозитория
   */
  const createNewRepo = async (
    username: string, 
    reponame: string, 
    access: 'private' | 'public', 
    description: string
  ): Promise<ApiResponse> => {
    return await dispatch(createRepo({ username, reponame, access, description })).unwrap();
  };

  /**
   * Удаление репозитория
   */
  const removeRepo = async (username: string, reponame: string): Promise<ApiResponse> => {
    return await dispatch(deleteRepo({ username, reponame })).unwrap();
  };

  /**
   * Получение данных репозитория
   */
  const getRepoData = async (
    username: string, 
    reponame: string, 
    branch?: string, 
    dir?: string
  ): Promise<any> => {
    return await dispatch(fetchRepoData({ username, reponame, branch, dir })).unwrap();
  };

  return {
    ...repo,
    repos: repo.userRepos,
    currentRepo: repo.currentRepo,
    repoData: repo.repoData,
    isLoading: repo.loading,
    error: repo.error,
    operation: repo.operation,
    getRepos,
    getRepo,
    createNewRepo,
    removeRepo,
    getRepoData,
  };
};