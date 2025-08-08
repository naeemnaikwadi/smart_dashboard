import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userInfo: null,
    token: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.userInfo = action.payload.userInfo;
      state.token = action.payload.token;
    },
    clearUser: (state) => {
      state.userInfo = null;
      state.token = null;
    },
    logoutUser: (state) => {
      state.userInfo = null;
      state.token = null;
      localStorage.removeItem('userInfo');
    },
  },
});

export const { setUser, clearUser, logoutUser } = userSlice.actions;
export default userSlice.reducer;
