import React, { useCallback, useEffect, useState } from "react";
import { formatTime } from "../util/types";
import "./Clock.scss";

/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

export function Clock(): JSX.Element {
  const [date, setDate] = useState(new Date());

  const click = useCallback((evt: React.MouseEvent) => {
    evt.preventDefault();
    document.body.classList?.toggle("alt-color");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDate(new Date());
    }, 1000);
    return (): void => window.clearTimeout(timer);
  }, [date]);

  return (
    <div className="Clock" onClick={click}>
      <div className="Clock-time">{formatTime(date)}</div>
      <div className="Clock-nosleep">Ethereum Never Sleeps</div>
    </div>
  );
}
