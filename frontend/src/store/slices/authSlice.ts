import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API } from '@/api';
import type { RootState, AuthState, AuthUser, ApiResponse } from '@/store/types';

const auth = API.auth;

// ============================================================================
// INITIAL STATE
// ============================================================================

// Попытка получить CSRF из localStorage
const getCSRFFromStorage = (): string | undefined => {
  try {
    const token = localStorage.getItem('csrf_token');
    return token || undefined;
  } catch {
    return undefined;
  }
};

const initialState: AuthState = {
  user: { is_authenticated: false },
  loading: false,
  error: null,
  csrfToken: getCSRFFromStorage(),
};

// ============================================================================
// ASYNC THUNKS (API ACTIONS)
// ============================================================================

/**
 * Проверка сессии пользователя
 */
export const checkAuthSession = createAsyncThunk<AuthUser, {}, { state: RootState }>(
  'auth/checkSession',
  async (args) => {
    return await auth.getSessionInfo(args);
  }
);

/**
 * Вход в систему
 */
export const loginUser = createAsyncThunk<
  ApiResponse,
  { username: string; password: string },
  { state: RootState }
>(
  'auth/login',
  async (credentials) => {
    const { username, password } = credentials;
    const response = await auth.postSessionLogin(username, password);
    return response;
  }
);

/**
 * Регистрация пользователя
 */
export const registerUser = createAsyncThunk<
  ApiResponse,
  { username: string; email: string; password: string },
  { state: RootState }
>(
  'auth/register',
  async (data) => {
    const { username, email, password } = data;
    const response = await auth.postUserCreate(username, email, password);
    return response;
  }
);

/**
 * Получение CSRF токена
 */
export const fetchCSRFToken = createAsyncThunk<string | undefined, void, { state: RootState }>(
  'auth/fetchCSRF',
  async () => {
    const token = await auth.getCSRFToken();
    return token;
  }
);

/**
 * Добавление SSH ключа
 */
export const addSSHKey = createAsyncThunk<
  ApiResponse,
  { username: string; keyname: string; sshkey: string },
  { state: RootState }
>(
  'auth/addSSHKey',
  async (data) => {
    const { username, keyname, sshkey } = data;
    const response = await auth.postUserSSHKeyAdd(username, keyname, sshkey);
    return response;
  }
);

/**
 * Получение SSH ключей
 */
export const getSSHKeys = createAsyncThunk<
  ApiResponse,
  { username: string; keynames?: string[] },
  { state: RootState }
>(
  'auth/getSSHKeys',
  async (data) => {
    const { username, keynames = [] } = data;
    const response = await auth.postUserSSHKeyGet(username, keynames);
    return response;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = { is_authenticated: false };
      state.csrfToken = undefined;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCSRFToken: (state, action: PayloadAction<string>) => {
      state.csrfToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check session
      .addCase(checkAuthSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthSession.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuthSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check session';
        if (!state.user.is_authenticated) {
          state.user = { is_authenticated: false };
        }
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.loading = false;
        state.user.is_authenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      
      // CSRF Token
      .addCase(fetchCSRFToken.fulfilled, (state, action: PayloadAction<string | undefined>) => {
        state.csrfToken = action.payload;
      });
  },
});

export const { logout, clearError, setCSRFToken } = authSlice.actions;

export default authSlice.reducer;