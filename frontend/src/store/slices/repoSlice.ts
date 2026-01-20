import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  postRepoGet, 
  postRepoCreate, 
  postRepoDelete, 
  postRepoDataGet 
} from '@/api/repo.jsx';
import type { RootState, RepoState, ApiResponse } from '@/store/types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface RepoData {
  username: string;
  reponame: string;
  access?: 'private' | 'public';
  description?: string;
  [key: string]: any;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: RepoState = {
  userRepos: [],
  currentRepo: null,
  repoData: null,
  loading: false,
  error: null,
  operation: null,
};

// ============================================================================
// ASYNC THUNKS (API ACTIONS)
// ============================================================================

/**
 * Получение репозиториев пользователя
 */
export const fetchUserRepos = createAsyncThunk<
  RepoData[],
  string,
  { state: RootState }
>(
  'repo/fetchUserRepos',
  async (username: string) => {
    const response = await postRepoGet(username);
    return response?.data || [];
  }
);

/**
 * Получение репозитория по пути
 */
export const fetchRepoByPath = createAsyncThunk<
  RepoData,
  { username: string; reponame: string; access?: "public" | "private" | null },
  { state: RootState }
>(
  'repo/fetchRepoByPath',
  async (data) => {
    const { username, reponame, access } = data;
    const response = await postRepoGet(username, reponame, access);
    return response?.data;
  }
);

/**
 * Создание репозитория
 */
export const createRepo = createAsyncThunk<
  ApiResponse,
  { username: string; reponame: string; access: 'private' | 'public'; description: string },
  { state: RootState }
>(
  'repo/create',
  async (data) => {
    const { username, reponame, access, description } = data;
    const response = await postRepoCreate(username, reponame, access, description);
    return response;
  }
);

/**
 * Удаление репозитория
 */
export const deleteRepo = createAsyncThunk<
  ApiResponse,
  { username: string; reponame: string },
  { state: RootState }
>(
  'repo/delete',
  async (data) => {
    const { username, reponame } = data;
    const response = await postRepoDelete(username, reponame);
    return response;
  }
);

/**
 * Получение данных репозитория
 */
export const fetchRepoData = createAsyncThunk<
  any,
  { username: string; reponame: string; branch?: string; dir?: string },
  { state: RootState }
>(
  'repo/fetchRepoData',
  async (data) => {
    const { username, reponame, branch = 'main', dir = '/' } = data;
    const response = await postRepoDataGet(username, reponame, branch, dir);
    return response?.data;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const repoSlice = createSlice({
  name: 'repo',
  initialState,
  reducers: {
    clearRepoData: (state) => {
      state.currentRepo = null;
      state.repoData = null;
      state.error = null;
    },
    clearRepoError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user repositories
      .addCase(fetchUserRepos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRepos.fulfilled, (state, action: PayloadAction<RepoData[]>) => {
        state.loading = false;
        state.userRepos = action.payload;
      })
      .addCase(fetchUserRepos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch repositories';
      })
      
      // Fetch repo by path
      .addCase(fetchRepoByPath.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRepoByPath.fulfilled, (state, action: PayloadAction<RepoData>) => {
        state.loading = false;
        state.currentRepo = action.payload;
      })
      .addCase(fetchRepoByPath.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch repository';
      })
      
      // Create repo
      .addCase(createRepo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operation = 'creating';
      })
      .addCase(createRepo.fulfilled, (state, action) => {
        state.loading = false;
        state.operation = null;
        // Optionally add new repo to the list
      })
      .addCase(createRepo.rejected, (state, action) => {
        state.loading = false;
        state.operation = null;
        state.error = action.error.message || 'Failed to create repository';
      })
      
      // Delete repo
      .addCase(deleteRepo.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.operation = 'deleting';
      })
      .addCase(deleteRepo.fulfilled, (state, action) => {
        state.loading = false;
        state.operation = null;
      })
      .addCase(deleteRepo.rejected, (state, action) => {
        state.loading = false;
        state.operation = null;
        state.error = action.error.message || 'Failed to delete repository';
      })
      
      // Fetch repo data
      .addCase(fetchRepoData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRepoData.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.repoData = action.payload;
      })
      .addCase(fetchRepoData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch repository data';
      });
  },
});

export const { clearRepoData, clearRepoError } = repoSlice.actions;

export default repoSlice.reducer;