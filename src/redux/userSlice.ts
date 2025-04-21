import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from './store';


export interface UserState {
  userId: string
}

const initialState: UserState = {
  userId: ''
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
        state.userId = action.payload;
    }
  },
})

export const { setUserId} = userSlice.actions;

export const userState = (state: RootState) => state.user;

export default userSlice.reducer