import Link from "next/link";
import { type AnchorHTMLAttributes, forwardRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CustomLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  target?: "_self" | "_blank" | string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
  scroll?: boolean;
  size?: string;
}

// The platform's own routes live outside this app's basePath, so they must be
// plain anchors: next/link would prefix them and point at /security/docs.
function isPlatformHref(href: string) {
  return href === "/docs" || href.startsWith("/docs/");
}

function isExternalHref(href: string) {
  return (
    /^https?:\/\//.test(href) ||
    href.startsWith("mailto:") ||
    isPlatformHref(href)
  );
}

function hasDynamicHrefPlaceholder(href: string) {
  return href.includes("[") && href.includes("]");
}

export const CustomLink = forwardRef<HTMLAnchorElement, CustomLinkProps>(
  (
    {
      href,
      target = "_blank",
      ariaLabel,
      className,
      children,
      scroll = true,
      size = "xs",
      ...props
    },
    ref,
  ) => {
    const linkClassName = cn(
      `text-${size} text-button-tertiary p-0`,
      className,
    );
    const shouldUseAnchor =
      isExternalHref(href) || hasDynamicHrefPlaceholder(href);

    if (shouldUseAnchor) {
      return (
        <a
          ref={ref}
          href={href}
          aria-label={ariaLabel}
          target={target}
          rel={target === "_blank" ? "noopener noreferrer" : undefined}
          className={linkClassName}
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        scroll={scroll}
        aria-label={ariaLabel}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={linkClassName}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

CustomLink.displayName = "CustomLink";
