import clsx from "clsx";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import * as logger from "../util/logger";
import { formatTime } from "../util/types";
import { useRerender } from "../util/useRerender";
import { Link } from "./Link";
import "./Logs.scss";

export function Logs(): JSX.Element {
  const [i, rerender] = useRerender();
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logger.on(rerender);
    return (): void => logger.off(rerender);
  }, [rerender]);

  useLayoutEffect(() => {
    const div = divRef.current;
    if (div) {
      div.scrollTop = Math.max(div.scrollHeight - div.clientHeight, 0);
    }
  }, [i]);

  return (
    <div className="Logs" ref={divRef}>
      {logger.logs.map((entry, i) => (
        <LogEntry key={i} entry={entry} />
      ))}
    </div>
  );
}

function LogEntry(props: { entry: logger.LogEntry }): JSX.Element {
  const { entry } = props;
  const { error, url, createdAt } = entry;
  const text = error ? `Error: ${entry.text}` : entry.text;

  return (
    <div className={clsx("Logs-entry", error && "Logs-entry-error")}>
      <span className="Logs-created-at">[{formatTime(createdAt)}]</span>{" "}
      {url ? (
        <Link url={url} blank>
          {text}
        </Link>
      ) : (
        text
      )}
    </div>
  );
}
