"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import type { FloatingWhatsAppProps } from "react-floating-whatsapp";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";

type DeviceOverrides = {
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  chatboxStyle?: React.CSSProperties;
  chatboxClassName?: string;
  buttonClassName?: string;
  chatboxHeight?: FloatingWhatsAppProps["chatboxHeight"];
};

type WidgetLogEvent = "click" | "open" | "close" | "message";

type ChatAuthor = "agent" | "user";

type ChatMessage = {
  id: string;
  author: ChatAuthor;
  text: string;
  timestamp: Date;
  preset?: boolean;
};

export interface WhatsAppWidgetProps {
  phoneNumber?: FloatingWhatsAppProps["phoneNumber"];
  accountName?: FloatingWhatsAppProps["accountName"];
  avatar?: FloatingWhatsAppProps["avatar"];
  statusMessage?: FloatingWhatsAppProps["statusMessage"];
  chatMessage?: FloatingWhatsAppProps["chatMessage"];
  placeholder?: FloatingWhatsAppProps["placeholder"];
  allowClickAway?: FloatingWhatsAppProps["allowClickAway"];
  allowEsc?: FloatingWhatsAppProps["allowEsc"];
  notification?: FloatingWhatsAppProps["notification"];
  notificationDelay?: FloatingWhatsAppProps["notificationDelay"];
  notificationLoop?: FloatingWhatsAppProps["notificationLoop"];
  messageDelay?: FloatingWhatsAppProps["messageDelay"];
  notificationSound?: FloatingWhatsAppProps["notificationSound"];
  notificationSoundSrc?: FloatingWhatsAppProps["notificationSoundSrc"];
  desktopOverrides?: DeviceOverrides;
  mobileOverrides?: DeviceOverrides;
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: string) => void;
  onClick?: FloatingWhatsAppProps["onClick"];
}

const DEFAULT_PHONE_NUMBER = "+201001741666";
const DEFAULT_ACCOUNT_NAME = "Care N Tour Concierge";
const DEFAULT_CHAT_MESSAGE =
  "Hello! How can we support your care journey today?";
const DEFAULT_STATUS = "Typically replies within minutes";
const DEFAULT_PLACEHOLDER = "Write your message...";
const TOGGLE_BUTTON_CLASS = "whatsapp-widget-toggle";
const CHATBOX_CLASS = "whatsapp-widget-chatbox";

const DESKTOP_PRESET: Required<DeviceOverrides> = {
  style: { zIndex: 60 },
  buttonStyle: {
    bottom: "2rem",
    right: "1.75rem",
    width: "60px",
    height: "60px",
  },
  chatboxStyle: {
    bottom: "7rem",
    right: "4rem",
    width: "380px",
  },
  chatboxClassName: undefined,
  buttonClassName: undefined,
  chatboxHeight: 420,
};

const MOBILE_PRESET: Required<DeviceOverrides> = {
  style: { zIndex: 60 },
  buttonStyle: {
    bottom: "1.5rem",
    right: "1.25rem",
    width: "56px",
    height: "56px",
  },
  chatboxStyle: {
    bottom: "5.5rem",
    left: "1rem",
    right: "1rem",
    width: "auto",
    maxWidth: "calc(100% - 2rem)",
  },
  chatboxClassName: undefined,
  buttonClassName: undefined,
  chatboxHeight: 360,
};

const mergeDeviceOverrides = (
  preset: Required<DeviceOverrides>,
  overrides?: DeviceOverrides,
): Required<DeviceOverrides> => ({
  style: { ...preset.style, ...overrides?.style },
  buttonStyle: { ...preset.buttonStyle, ...overrides?.buttonStyle },
  chatboxStyle: { ...preset.chatboxStyle, ...overrides?.chatboxStyle },
  chatboxClassName: overrides?.chatboxClassName ?? preset.chatboxClassName,
  buttonClassName: overrides?.buttonClassName ?? preset.buttonClassName,
  chatboxHeight: overrides?.chatboxHeight ?? preset.chatboxHeight,
});

const generateMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createChatMessage = (
  author: ChatAuthor,
  text: string,
  options: { preset?: boolean } = {},
): ChatMessage => ({
  id: generateMessageId(),
  author,
  text,
  timestamp: new Date(),
  preset: options.preset ?? false,
});

const formatTimestamp = (value: Date) =>
  value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function WhatsAppWidget({
  phoneNumber = DEFAULT_PHONE_NUMBER,
  accountName = DEFAULT_ACCOUNT_NAME,
  avatar = "/care-n-tour-logo-light.png",
  statusMessage = DEFAULT_STATUS,
  chatMessage = DEFAULT_CHAT_MESSAGE,
  placeholder = DEFAULT_PLACEHOLDER,
  allowClickAway = true,
  allowEsc = true,
  notification = true,
  notificationDelay = 90,
  notificationLoop = 2,
  messageDelay = 2,
  notificationSound = false,
  notificationSoundSrc,
  desktopOverrides,
  mobileOverrides,
  onOpen,
  onClose,
  onMessage,
  onClick,
}: WhatsAppWidgetProps) {
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [chatBodyElement, setChatBodyElement] =
    React.useState<HTMLDivElement | null>(null);

  const normalizedInitialMessage = React.useMemo(
    () => chatMessage?.trim() ?? "",
    [chatMessage],
  );

  const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
    normalizedInitialMessage
      ? [createChatMessage("agent", normalizedInitialMessage, { preset: true })]
      : [],
  );

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    setMessages((current) => {
      const nonPreset = current.filter((message) => !message.preset);
      if (!normalizedInitialMessage) {
        return nonPreset;
      }
      return [
        createChatMessage("agent", normalizedInitialMessage, { preset: true }),
        ...nonPreset,
      ];
    });
  }, [normalizedInitialMessage]);

  const mergedDeviceOptions = React.useMemo(
    () =>
      mergeDeviceOverrides(
        isMobile ? MOBILE_PRESET : DESKTOP_PRESET,
        isMobile ? mobileOverrides : desktopOverrides,
      ),
    [isMobile, desktopOverrides, mobileOverrides],
  );

  const logEvent = React.useCallback((type: WidgetLogEvent) => {
    console.info("[WhatsAppWidget]", type, {
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleClick = React.useCallback(
    (event: Parameters<NonNullable<FloatingWhatsAppProps["onClick"]>>[0]) => {
      logEvent("click");
      setIsChatOpen((previous) => {
        if (!previous) {
          logEvent("open");
          onOpen?.();
        }
        return true;
      });
      onClick?.(event);
    },
    [logEvent, onClick, onOpen],
  );

  const handleClose = React.useCallback(() => {
    if (isChatOpen) {
      logEvent("close");
      onClose?.();
    }
    setIsChatOpen(false);
  }, [isChatOpen, logEvent, onClose]);

  React.useEffect(() => {
    if (!isMounted) {
      return;
    }
    const chatBox = containerRef.current?.querySelector(
      `.${CHATBOX_CLASS}`,
    ) as HTMLDivElement | null;
    if (!chatBox) {
      return;
    }
    const body = chatBox.querySelector(
      "div[class*='chatBody']",
    ) as HTMLDivElement | null;
    setChatBodyElement(body);
  }, [isMounted, isChatOpen]);

  React.useEffect(() => {
    if (!chatBodyElement) {
      return;
    }

    chatBodyElement.dataset.whatsappWidget = "chat-body";
    chatBodyElement.style.position = "relative";
    chatBodyElement.style.overflowY = "auto";

    const defaultMessage = chatBodyElement.querySelector(
      "div[class*='message__']",
    );
    if (defaultMessage instanceof HTMLElement) {
      defaultMessage.style.display = "none";
    }

    const typingIndicator = chatBodyElement.querySelector(
      "div[class*='typing__']",
    );
    if (typingIndicator instanceof HTMLElement) {
      typingIndicator.style.display = "none";
    }
  }, [chatBodyElement]);

  const handleMessageSubmit = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }

      logEvent("message");
      setMessages((current) => [
        ...current,
        createChatMessage("user", trimmed),
      ]);
      onMessage?.(trimmed);
    },
    [logEvent, onMessage],
  );

  React.useEffect(() => {
    if (!isMounted || !containerRef.current) {
      return;
    }

    const form = containerRef.current.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const interceptSubmit = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) {
        event.stopImmediatePropagation();
      }

      const input = form.querySelector("input");
      const inputElement = input as HTMLInputElement | null;
      const value = inputElement?.value ?? "";

      handleMessageSubmit(value);

      if (inputElement) {
        inputElement.value = "";
      }
    };

    form.addEventListener("submit", interceptSubmit, true);

    return () => {
      form.removeEventListener("submit", interceptSubmit, true);
    };
  }, [handleMessageSubmit, isMounted, isChatOpen]);

  React.useEffect(() => {
    if (!allowClickAway || !isMounted || !isChatOpen) {
      return;
    }

    const interceptDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (target.closest(`.${TOGGLE_BUTTON_CLASS}`)) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener("click", interceptDocumentClick, true);

    return () => {
      document.removeEventListener("click", interceptDocumentClick, true);
    };
  }, [allowClickAway, isChatOpen, isMounted]);

  React.useEffect(() => {
    if (!chatBodyElement) {
      return;
    }
    chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
  }, [chatBodyElement, messages]);

  if (!isMounted) {
    return null;
  }

  const floatingProps: FloatingWhatsAppProps = {
    phoneNumber,
    accountName,
    avatar,
    statusMessage,
    chatMessage: "",
    placeholder,
    allowClickAway,
    allowEsc,
    notification,
    notificationDelay,
    notificationLoop,
    messageDelay,
    notificationSound,
    notificationSoundSrc,
    darkMode: resolvedTheme === "dark",
    style: mergedDeviceOptions.style,
    buttonStyle: mergedDeviceOptions.buttonStyle,
    chatboxStyle: mergedDeviceOptions.chatboxStyle,
    chatboxClassName: [CHATBOX_CLASS, mergedDeviceOptions.chatboxClassName]
      .filter(Boolean)
      .join(" "),
    buttonClassName: [TOGGLE_BUTTON_CLASS, mergedDeviceOptions.buttonClassName]
      .filter(Boolean)
      .join(" "),
    chatboxHeight: mergedDeviceOptions.chatboxHeight,
    onClick: handleClick,
    onClose: handleClose,
  };

  const handleWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isChatOpen || !allowClickAway) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest(`.${CHATBOX_CLASS}`)) {
      event.stopPropagation();
    }
  };

  return (
    <div ref={containerRef} onClick={handleWrapperClick}>
      <FloatingWhatsApp {...floatingProps} />
      {chatBodyElement &&
        createPortal(
          <ChatTranscript
            messages={messages}
            isDark={resolvedTheme === "dark"}
          />,
          chatBodyElement,
        )}
    </div>
  );
}

interface ChatTranscriptProps {
  messages: ChatMessage[];
  isDark: boolean;
}

function ChatTranscript({ messages, isDark }: ChatTranscriptProps) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col justify-end gap-3">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} isDark={isDark} />
      ))}
    </div>
  );
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isDark: boolean;
}

function ChatMessageBubble({ message, isDark }: ChatMessageBubbleProps) {
  const isAgent = message.author === "agent";

  const containerClassName = clsx(
    "flex w-full",
    isAgent ? "justify-start" : "justify-end",
  );

  const bubbleClassName = clsx(
    "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug",
    isAgent
      ? isDark
        ? "bg-[#1f2c34] text-[#e9edef]"
        : "bg-white text-[#111b21] shadow-sm"
      : isDark
        ? "bg-[#005c4b] text-[#e9edef]"
        : "bg-[#d9fdd3] text-[#111b21] shadow-sm",
  );

  const timestampClassName = clsx(
    "mt-1 block text-[10px] font-medium tracking-wide text-right",
    isDark ? "text-[#8696a0]" : "text-[#667781]",
  );

  return (
    <div className={containerClassName}>
      <div className={bubbleClassName}>
        <p className="whitespace-pre-line">{message.text}</p>
        <span className={timestampClassName}>
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default WhatsAppWidget;
