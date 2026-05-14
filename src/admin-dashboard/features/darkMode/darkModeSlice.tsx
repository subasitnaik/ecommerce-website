import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type DarkModeState = {
  darkMode: boolean;
};

const initialState: DarkModeState = {
  darkMode: false,
};

export const darkModeSlice = createSlice({
  name: "darkMode",
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      if (state.darkMode) {
        document.documentElement.classList.remove("dark");
        localStorage.theme = "light";
        state.darkMode = false;
      } else {
        document.documentElement.classList.add("dark");
        localStorage.theme = "dark";
        state.darkMode = true;
      }
    },
    /** Call once on the client after reading `document` / `localStorage`. */
    syncDarkModeFromDom: (state) => {
      state.darkMode = document.documentElement.classList.contains("dark");
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      const on = action.payload;
      if (on) {
        document.documentElement.classList.add("dark");
        localStorage.theme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.theme = "light";
      }
      state.darkMode = on;
    },
  },
});

export const { toggleDarkMode, syncDarkModeFromDom, setDarkMode } =
  darkModeSlice.actions;

export default darkModeSlice.reducer;
