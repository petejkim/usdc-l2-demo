import clsx from "clsx";
import React, { useCallback } from "react";
import "./Button.scss";
import { Link } from "./Link";

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  href?: string;
  small?: boolean;
}

export function Button(props: ButtonProps): JSX.Element {
  const { children, onClick, disabled, title, href, small } = props;

  const click = useCallback(
    (evt: React.MouseEvent) => {
      evt.preventDefault();
      onClick?.();
    },
    [onClick]
  );

  const className = clsx("Button", small && "Button-small");

  return href && !disabled ? (
    <Link className={className} url={href} title={title} blank>
      {children}
    </Link>
  ) : (
    <button
      className={className}
      onClick={click}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
