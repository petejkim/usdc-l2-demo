import clsx from "clsx";
import React, { useCallback } from "react";
import "./Button.scss";

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
    <a
      className={className}
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
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
