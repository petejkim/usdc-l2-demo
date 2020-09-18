import React, { useCallback } from "react";
import "./TextField.scss";

export interface TextFieldProps {
  value: string;
  placeholder?: string;
  onChange?: (text: string) => void;
}

export function TextField(props: TextFieldProps): JSX.Element {
  const { value, placeholder, onChange } = props;

  const change = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(evt.target.value);
    },
    [onChange]
  );

  return (
    <input
      type="text"
      className="TextField"
      value={value}
      placeholder={placeholder}
      onChange={change}
    />
  );
}
