import React from "react";
import "./HintBubble.scss";

export interface HintBubbleProps {
  children?: React.ReactNode;
}

export function HintBubble(props: HintBubbleProps): JSX.Element {
  return (
    <div className="HintBubble">
      <div className="HintBubble-bubble">{props.children}</div>
    </div>
  );
}
