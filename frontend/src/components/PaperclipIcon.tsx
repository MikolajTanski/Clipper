import React from "react";

type Props = {
  className?: string;
  title?: string;
};

/** Wire paperclip — signature mark for Spinacz */
export const PaperclipIcon: React.FC<Props> = ({ className, title = "Spinacz" }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    width="48"
    height="48"
    aria-hidden={title ? undefined : true}
    role={title ? "img" : undefined}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M16.5 28.5V14.2c0-4.2 3.2-7.7 7.2-7.7s7.2 3.5 7.2 7.7v16.6c0 2.9-2.2 5.3-5 5.3s-5-2.4-5-5.3V16.8c0-1.2.9-2.2 2-2.2s2 1 2 2.2v12.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
