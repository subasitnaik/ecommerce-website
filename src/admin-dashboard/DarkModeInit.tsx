"use client";

import { useEffect } from "react";
import { useAppDispatch } from "./hooks";
import { setDarkMode } from "./features/darkMode/darkModeSlice";

/** Applies saved theme before paint mismatch; syncs Redux with `<html class="dark">`. */
export function DarkModeInit() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const stored = localStorage.getItem("theme");
    const shouldDark =
      stored === "dark" || (stored !== "light" && prefersDark);
    dispatch(setDarkMode(shouldDark));
  }, [dispatch]);

  return null;
}
