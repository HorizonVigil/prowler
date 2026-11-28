import { type ReactElement } from "react";

import { NavbarClient } from "./navbar-client";

interface NavbarProps {
  title: string;
  icon?: ReactElement;
}

// The product-updates feed bell is omitted so the right-side controls match
// the platform header; FeedsServer stays in the repo for later re-enable.
export function Navbar({ title, icon }: NavbarProps) {
  return <NavbarClient title={title} icon={icon} />;
}
