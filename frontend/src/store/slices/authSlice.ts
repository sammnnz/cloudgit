import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API } from '@/api';
import type { RootState, AuthState, AuthUser, ApiResponse } from '@/store/types';
import { WResponse } from '@/common/types';
import { getResponseData, isEmailValid, isUsernameValid, passwordParams } from '@/common/utils';
import validator from "validator/es";
import { isUserExists } from '@/api/auth';

const auth = API.auth;

// ============================================================================
// INITIAL STATE
// ============================================================================

// Попытка получить CSRF из localStorage
// const getCSRFFromStorage = (): string | undefined => {
//   try {
//     const token = localStorage.getItem('csrf_token');
//     return token || undefined;
//   } catch {
//     return undefined;
//   }
// };

const initialState: AuthState = {
  user: { is_authenticated: false },
  loading: false,
  error: null,
  errorObject: { msg: undefined },
  csrfToken: undefined
};

// ============================================================================
// ASYNC THUNKS (API ACTIONS)
// ============================================================================

/**
 * Get user session
 */
export const getSession = createAsyncThunk<
  AuthUser, 
  void, 
  { state: RootState }
>(
  'auth/getSession',
  async () => {
    const response = await auth.getSessionInfo();

    // TODO: make scheme
    const result = {
          'id': undefined,
          'is_authenticated': false,
          'username': undefined
        };
    Object.assign(result, getResponseData(response));
    return result;
  }
);

/**
 * Login in account
 */
export const login = createAsyncThunk<
  WResponse<AuthUser>,
  { username: string; password: string },
  { 
    state: RootState;
    rejectValue: string;
  }
>(
  'auth/login',
  async (credentials, thunkAPI) => {
    const { username, password } = credentials;

    // 1. Validation
    if (!username || !password) {
      return thunkAPI.rejectWithValue('Username and password are required');
    }
    
    // 2. Call API
    const response = await auth.postSessionLogin(
      username, 
      password
    );
    
    // 3. API error handling
    if (!response.success) {
      switch (response.status) {
        case 403: // CSRF token invalid
          return thunkAPI.rejectWithValue("No access to account");
        case 404:
        case 422:
          return thunkAPI.rejectWithValue("Invalid credentials");
        default:
          return thunkAPI.rejectWithValue(response.message);
      }
    }
    
    // 4. Side-effects
    // if (...) {
    //   thunkAPI.dispatch(...);
    // }
    
    return response;
  }
);

/**
 * Logout
 */
export const logout = createAsyncThunk<
  WResponse,
  {},
  { 
    state: RootState;
    rejectValue: string;
  }
>(
  'auth/logout',
  async ({}, thunkAPI) => {
    const response = await auth.getSessionLogout();

    if (!response.success)
        return thunkAPI.rejectWithValue("Logout failed. Please try again.");
    
    return response;
  }
);

export interface PayloadRejectCreateUser {
  username: string | undefined;
  email: string | undefined;
  password: string | undefined;
  msg: string | undefined;
}

/**
 * Signup
 */
export const createUser = createAsyncThunk<
  WResponse,
  { username: string; email: string; password: string },
  { state: RootState }
>(
  'auth/createUser',
  async (data, thunkAPI) => {
    const { username, email, password } = data
        , payload: PayloadRejectCreateUser = {
            username: undefined,
            email: undefined,
            password: undefined,
            msg: undefined
        };

    // 1. Validation
    if (!username)
      payload.username = "Username is required"

    if ((!isUsernameValid(username)) && (!payload.username))
      payload.username = "Invalid username. " +
                    "Use any letters of the English alphabet " +
                    "(upper and lower case), numbers (0-9), " +
                    "and the underscore (_)"
    
    if (!payload.username) {
      switch (await isUserExists(username)) {
        case undefined: // unkwown case (may be error in endpoint)
          payload.username = "Server problem"
          break
        case true:
          payload.username = "Username is already exists"
          break
        default:
          break
      }
    }

    if (!email)
      payload.email = "Email is required";

    if ((!isEmailValid(email)) && (!payload.email)) 
      payload.email = "Invalid email";

    // TODO: check email exists

    if (!password)
      payload.password = "Password is required";

    if ((!validator.isStrongPassword(password, passwordParams)) && (!payload.password))
      payload.password =
      'Not Strong Password. Please use at least 8 characters, 1 lowercase ' +
      'letter, 1 uppercase letter, 1 number and 1 symbol';

    if (payload.username || payload.email || payload.password)
      return thunkAPI.rejectWithValue(payload)

    // 2. Call API
    const response = await auth.postUserCreate(
      username, 
      email, 
      password
    );

    // 3. API error handling
    if (!response.success) {
      switch (response.status) {
        case 403: // CSRF token invalid
          payload.msg = "No access to server";
          break
        case 404:
        case 422:
        default:
          payload.msg = getResponseData(response as WResponse<string>);
      }

      return thunkAPI.rejectWithValue(payload)
    }

    return response;
  }
);

/**
 * Get CSRF token
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
    clearError: (state) => {
      state.error = null;
      state.errorObject = { msg: undefined };
    },
    setCSRFToken: (state, action: PayloadAction<string>) => {
      state.csrfToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check session
      .addCase(getSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSession.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check session';
        if (!state.user.is_authenticated) {
          state.user = { is_authenticated: false };
        }
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<WResponse<AuthUser>>) => {
        state.loading = false;
        state.user = getResponseData(action.payload) as AuthUser;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = { is_authenticated: false };
        state.csrfToken = undefined;
      })
      .addCase(logout.rejected, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.error = action.payload || 'Logout failed';
      })
      
      // Register
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action: PayloadAction<PayloadRejectCreateUser>) => {
        state.loading = false;
        state.error = action.payload.msg ?? "";
        state.errorObject = action.payload;
      })
      
      // CSRF Token
      .addCase(fetchCSRFToken.fulfilled, (state, action: PayloadAction<string | undefined>) => {
        state.csrfToken = action.payload;
      });
  },
});

export const { clearError, setCSRFToken } = authSlice.actions;

export default authSlice.reducer;