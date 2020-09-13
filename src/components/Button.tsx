import React from "react";
import "./Button.scss";

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

export function Button(props: ButtonProps): JSX.Element {
  const { children } = props;
  return (
    <button className="Button" onClick={props.onClick}>
      {children}
    </button>
  );
}
