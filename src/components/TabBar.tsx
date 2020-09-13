import clsx from "clsx";
import React, { useCallback } from "react";
import { useMediaQuery } from "react-responsive";
import "./TabBar.scss";

export type TabId = 1 | 2;

export interface TabBarProps {
  selected: TabId;
  onSelect?: (selected: TabId) => void;
}

export function TabBar(props: TabBarProps): JSX.Element {
  const isSmallScreen = useMediaQuery({
    query: "only screen and (max-width: 470px)",
  });
  const layer = isSmallScreen ? "L" : "Layer ";

  const { selected, onSelect } = props;
  return (
    <div className="TabBar">
      <ul>
        <TabBarItem
          id={2}
          selected={selected}
          label={`${layer}2 / Mumbai Testnet`}
          onSelect={onSelect}
        />
        <TabBarItem
          id={1}
          selected={selected}
          label={`${layer}1 / Görli Testnet`}
          onSelect={onSelect}
        />
      </ul>
    </div>
  );
}

function TabBarItem(props: {
  id: TabId;
  selected: TabId;
  label: string;
  onSelect?: (selected: TabId) => void;
}): JSX.Element {
  const { id, selected, label, onSelect } = props;

  const onClick = useCallback(() => {
    onSelect?.(id);
  }, [id, onSelect]);

  return (
    <li>
      <button
        className={clsx(selected === id && "TabBar-active")}
        onClick={onClick}
      >
        {label}
      </button>
    </li>
  );
}
