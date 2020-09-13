import clsx from "clsx";
import React, { useCallback } from "react";
import "./TabBar.scss";

export type TabId = 1 | 2;

export interface TabBarProps {
  selected: TabId;
  onSelect?: (selected: TabId) => void;
}

export function TabBar(props: TabBarProps): JSX.Element {
  const { selected, onSelect } = props;
  return (
    <div className="TabBar">
      <ul>
        <TabBarItem
          id={2}
          selected={selected}
          label={"Layer 2 / Mumbai Testnet"}
          onSelect={onSelect}
        />
        <TabBarItem
          id={1}
          selected={selected}
          label={"Layer 1 / Görli Testnet"}
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
