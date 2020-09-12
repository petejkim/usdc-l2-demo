import React from "react";
import { Box, Flex } from "reflexbox";
import "./Panel.scss";

export interface PanelProps {
  title?: string;
  children?: React.ReactNode;
}

export function Panel(props: PanelProps): JSX.Element {
  const { title, children } = props;

  return (
    <Flex className="Panel" flexDirection="column" flexGrow={1} height="100%">
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
