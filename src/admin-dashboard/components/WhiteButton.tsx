"use client";

// *********************
// Role of the component: White button component that displays the white button with the text
// Name of the component: WhiteButton.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <WhiteButton link="/" textSize="lg" width="full" py="2" text="Login now"></WhiteButton>
// Input parameters: { link: string; text: string; width: string; py:string; textSize: string; children?: React.ReactNode }
// Output: White button component that displays the white button with the text
// *********************

import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";

const WhiteButton = ({
  link,
  text,
  width,
  py,
  textSize,
  children,
}: {
  link: string;
  text: string;
  width: string;
  py: string;
  textSize: string;
  children?: React.ReactNode;
}) => {
  const widthCls =
    width === "full"
      ? "w-full"
      : width === "32"
        ? "w-full min-w-0 sm:w-32"
        : "w-full min-w-0 sm:w-48";
  return (
    <Link
      to={link}
      className={`flex min-w-0 items-center justify-center gap-x-2 bg-blackPrimary py-${py} text-${textSize} duration-200 hover:bg-gray-800 dark:bg-whiteSecondary dark:hover:bg-white ${widthCls}`}
    >
      {children}
      <span className="dark:text-blackPrimary text-whiteSecondary font-semibold">
        {text}
      </span>
    </Link>
  );
};
export default WhiteButton;
