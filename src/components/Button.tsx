import React, { useCallback } from "react";
import "./Button.scss";

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  const { children, onClick, disabled, title } = props;

  const click = useCallback(
    (evt: React.MouseEvent) => {
      evt.preventDefault();
      onClick?.();
    },
    [onClick]
  );

  return (
    <button
      className="Button"
      onClick={click}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
