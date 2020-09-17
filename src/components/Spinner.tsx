import clsx from "clsx";
import React from "react";
import spinnerAlt from "../images/spinner-alt.svg";
import spinner from "../images/spinner.svg";
import "./Spinner.scss";

export interface SpinnerProps {
  small?: boolean;
}

export function Spinner(props: SpinnerProps): JSX.Element {
  const { small } = props;

  return (
    <>
      <img
        className={clsx("Spinner", small && "Spinner-small")}
        src={spinner}
        alt=""
      />
      <img
        className={clsx("Spinner", "Spinner-alt", small && "Spinner-small")}
        src={spinnerAlt}
        alt=""
      />
    </>
  );
}
