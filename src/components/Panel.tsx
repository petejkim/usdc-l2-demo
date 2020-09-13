import clsx from "clsx";
import React from "react";
import { Box, Flex } from "reflexbox";
import "./Panel.scss";

export interface PanelProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Panel(props: PanelProps): JSX.Element {
  const { title, className, children } = props;

  return (
    <Flex
      className={clsx("Panel", className)}
      flexDirection="column"
      flexGrow={1}
      height="100%"
    >
      {title && (
        <Box flexShrink={0} className="Panel-title">
          {title}
        </Box>
      )}
      <Box flexGrow={1} className="Panel-contents">
        {children}
      </Box>
    </Flex>
  );
}
