import clsx from "clsx";
import React from "react";
import "./Modal.scss";
import { Panel } from "./Panel";

export interface ModalProps {
  className?: string;
  title: string;
  children: React.ReactNode;
}

export function Modal(props: ModalProps): JSX.Element {
  const { title, className, children } = props;
  return (
    <div className={clsx("Modal", className)}>
      <Panel title={title}>{children}</Panel>
    </div>
  );
}
