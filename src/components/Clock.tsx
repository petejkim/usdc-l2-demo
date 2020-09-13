import React, { useEffect, useState } from "react";
import { formatTime } from "../util/types";
import "./Clock.scss";

export function Clock(): JSX.Element {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDate(new Date());
    }, 1000);
    return (): void => window.clearTimeout(timer);
  }, [date]);

  return (
    <div className="Clock">
      <div className="Clock-time">{formatTime(date)}</div>
      <div className="Clock-nosleep">Ethereum Never Sleeps</div>
    </div>
  );
}
