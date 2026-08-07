"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "interviewlab:install-dismissed";

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    function handlePrompt(event: Event) {
      event.preventDefault();
      if (localStorage.getItem(DISMISSED_KEY)) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (!visible || !installEvent) return null;

  return (
    <div className="install-banner" role="complementary" aria-label="Install InterviewLab">
      <Download size={18} />
      <div>
        <strong>Install InterviewLab</strong>
        <p>Add this practice app to your home screen for one-tap, full-screen access.</p>
      </div>
      <button
        className="button button-small"
        onClick={async () => {
          await installEvent.prompt();
          await installEvent.userChoice;
          setVisible(false);
        }}
      >
        Install
      </button>
      <button
        aria-label="Dismiss install prompt"
        className="install-dismiss"
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, "1");
          setVisible(false);
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
