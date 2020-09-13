import React, { useCallback } from "react";
import "./Button.scss";

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button(props: ButtonProps): JSX.Element {
  const { children, onClick, disabled } = props;

  const click = useCallback(
    (evt: React.MouseEvent) => {
      evt.preventDefault();
      onClick?.();
    },
    [onClick]
  );

  return (
    <button className="Button" onClick={click} disabled={disabled}>
      {children}
    </button>
  );
}
