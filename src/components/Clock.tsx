import React, { useEffect, useState } from "react";
import "./Clock.scss";

export function Clock(): JSX.Element {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDate(new Date());
    }, 1000);
    return (): void => window.clearTimeout(timer);
  }, [date]);

  const [h, m, s] = [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map((v) => v.toString().padStart(2, "0"));

  return (
    <div className="Clock">
      <div className="Clock-time">
        {h}:{m}:{s}
      </div>
      <div className="Clock-nosleep">Ethereum Never Sleeps</div>
    </div>
  );
}
