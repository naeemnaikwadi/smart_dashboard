import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

export const login = createAsyncThunk('user/login', async (data: { email: string, password: string }) => {
  const res = await API.post('/auth/login', data);
  localStorage.setItem('token', res.data.token);
  return res.data.user;
});

export const register = createAsyncThunk('user/register', async (data: { name: string, email: string, password: string, role: string }) => {
  const res = await API.post('/auth/register', data);
  return res.data.user;
});

const userSlice = createSlice({
  name: 'user',
  initialState: { user: null, status: 'idle' } as any,
  reducers: {
    logout(state) {
      state.user = null;
      localStorage.removeItem('token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(register.fulfilled, (state, action) => { state.user = action.payload; });
  }
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;