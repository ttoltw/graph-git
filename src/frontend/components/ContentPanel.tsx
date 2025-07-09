import React from "react";

export const ContentPanel: React.FC<{
  ref: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}> = ({ ref, children }) => {
  return (
    <div className="content-panel" ref={ref}>
      {children}
    </div>
  );
};
