import clsx from "clsx";
import React from "react";
import "./TabBar.scss";

export interface TabBarProps {
  activeLayer: 1 | 2;
}

const activeCls = "TabBar-active";

export function TabBar(props: TabBarProps): JSX.Element {
  const { activeLayer } = props;
  return (
    <div className="TabBar">
      <ul>
        <li className={clsx(activeLayer === 2 && activeCls)}>
          Layer 2 / Mumbai Testnet
        </li>
        <li className={clsx(activeLayer === 1 && activeCls)}>
          Layer 1 / Görli Testnet
        </li>
      </ul>
    </div>
  );
}
