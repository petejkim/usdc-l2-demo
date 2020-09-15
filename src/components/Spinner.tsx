import React from "react";
import spinner from "../images/spinner.svg";
import "./Spinner.scss";

export function Spinner(): JSX.Element {
  return <img className="Spinner" src={spinner} alt="" />;
}
