import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

export const fetchSkills = createAsyncThunk('skill/fetchAll', async () => {
  const res = await API.get('/skills');
  return res.data;
});

export const createSkill = createAsyncThunk('skill/create', async (data: any) => {
  const res = await API.post('/skills', data);
  return res.data;
});

const skillSlice = createSlice({
  name: 'skill',
  initialState: { skills: [], status: 'idle' } as any,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.fulfilled, (state, action) => { state.skills = action.payload; })
      .addCase(createSkill.fulfilled, (state, action) => { state.skills.push(action.payload); });
  }
});

export default skillSlice.reducer;