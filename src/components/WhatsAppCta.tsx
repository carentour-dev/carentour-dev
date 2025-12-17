"use client";

import * as React from "react";
import { clsx } from "clsx";

export type WhatsAppCtaProps = {
  phoneNumber?: string;
  message?: string;
  label?: string;
  className?: string;
};

const DEFAULT_PHONE_NUMBER = "201229503333";
const DEFAULT_MESSAGE =
  "Hi! I'd like to learn more about Care N Tour's services.";

const cleanPhoneNumber = (value?: string) => {
  const digits = (value ?? "").replace(/[^\d]/g, "");
  return digits || DEFAULT_PHONE_NUMBER;
};

const buildWhatsAppLink = (phoneNumber: string, message: string) =>
  `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

export function WhatsAppCta({
  phoneNumber = DEFAULT_PHONE_NUMBER,
  message = DEFAULT_MESSAGE,
  label = "Chat on WhatsApp",
  className,
}: WhatsAppCtaProps) {
  const cleanedPhone = React.useMemo(
    () => cleanPhoneNumber(phoneNumber),
    [phoneNumber],
  );

  const prefilledMessage = React.useMemo(
    () => message.trim() || DEFAULT_MESSAGE,
    [message],
  );

  const link = React.useMemo(
    () => buildWhatsAppLink(cleanedPhone, prefilledMessage),
    [cleanedPhone, prefilledMessage],
  );

  const handleClick = React.useCallback(() => {
    window.open(link, "_blank", "noopener,noreferrer");
    console.info("[WhatsAppCTA] click", {
      timestamp: new Date().toISOString(),
      link,
    });
  }, [link]);

  return (
    <div
      className={clsx(
        "fixed bottom-6 right-4 z-50 flex items-center justify-end sm:bottom-8 sm:right-6",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus-visible:ring-emerald-200"
        aria-label={label}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white">
          <svg
            aria-hidden
            viewBox="0 0 32 32"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path d="M16 3C9.382 3 4 8.264 4 14.75c0 2.456.792 4.758 2.184 6.625L4.262 29 12 26.945c1.247.394 2.574.605 3.997.605 6.618 0 12-5.265 12-11.75C28 8.264 22.618 3 16 3m0 21.422c-1.272 0-2.52-.212-3.706-.63l-.264-.094-3.54.934.944-3.316-.172-.24C8.32 19.68 7.75 17.78 7.75 15.75 7.75 9.825 11.996 5.5 16 5.5c4.004 0 8.25 4.325 8.25 10.25 0 5.38-4.522 8.672-8.25 8.672m4.334-6.534c-.24-.12-1.413-.695-1.63-.774-.218-.08-.377-.12-.536.12-.158.238-.614.774-.752.934-.138.159-.277.179-.517.06-.24-.12-1.009-.362-1.923-1.152-.71-.622-1.19-1.39-1.329-1.629-.138-.239-.015-.369.104-.488.107-.107.24-.277.36-.416.12-.139.158-.238.237-.397.08-.159.04-.298-.02-.417-.06-.12-.537-1.297-.735-1.78-.194-.467-.392-.403-.536-.411l-.458-.008c-.159 0-.417.06-.636.298-.218.238-.833.813-.833 1.983 0 1.169.853 2.3.97 2.458.119.159 1.676 2.557 4.064 3.473.568.219 1.011.35 1.356.448.569.162 1.088.14 1.497.085.456-.068 1.413-.576 1.612-1.132.198-.556.198-1.031.139-1.132-.06-.1-.218-.159-.456-.278" />
          </svg>
        </span>
        <span>{label}</span>
      </button>
    </div>
  );
}

export default WhatsAppCta;
