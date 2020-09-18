import React from "react";

export interface LinkProps {
  className?: string;
  url: string;
  blank?: boolean;
  title?: string;
  children?: React.ReactNode;
}

const blankProps = {
  target: "_blank",
  rel: "noopener noreferrer",
};

export function Link(props: LinkProps): JSX.Element {
  const { className, url, blank, title, children } = props;
  return blank ? (
    <a className={className} href={url} title={title} {...blankProps}>
      {children}
    </a>
  ) : (
    <a className={className} href={url} title={title}>
      {children}
    </a>
  );
}
