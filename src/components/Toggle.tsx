import React from "react";

export interface Props {
  enabled: boolean;
  onLabel?: string;
  offLabel?: string;
}

export function Toggle(props: Props): JSX.Element {
  const onLabel = props.onLabel || "ON";
  const offLabel = props.offLabel || "OFF";

  return (
    <div>
      <div>{onLabel}</div>
      <div>{offLabel}</div>
    </div>
  );
}
