import { createSlice } from "@reduxjs/toolkit";

type SidebarState = {
  isSidebarOpen: boolean;
};

const initialState: SidebarState = {
  /** Closed on first paint so the main area is visible on small screens; desktop forces the drawer open via CSS. */
  isSidebarOpen: false,
};

export const dashboardSlice = createSlice({
  name: "dashboard",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    /** Use after navigation on mobile so the drawer closes (desktop uses xl:translate-x-0). */
    closeSidebar: (state) => {
      state.isSidebarOpen = false;
    },
  },
});

export const { setSidebar, closeSidebar } = dashboardSlice.actions;

export default dashboardSlice.reducer;
