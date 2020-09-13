import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as logger from "../util/logger";
import { formatTime } from "../util/types";
import "./Logs.scss";

export function Logs(): JSX.Element {
  const [i, setI] = useState(0);
  const rerender = useCallback(() => setI(i + 1), [i]);

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
        <a href={url} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ) : (
        text
      )}
    </div>
  );
}
