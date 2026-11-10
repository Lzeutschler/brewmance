"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ShareNetworkIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { packText } from "@/lib/share/code";

/**
 * Copies a link that carries `text` (a deck or a quiz result) under `route`; phones open the system
 * share sheet instead. `description` tells what the link shows.
 */
export function ShareButton({
  route,
  text,
  title,
  description,
  variant = "outline",
}: {
  route: "/d" | "/q";
  text: string;
  title: string;
  description: string;
  variant?: "outline" | "ghost";
}) {
  const [url, setUrl] = useState<string | null>(null);

  // Built ahead of the click: Safari only allows sharing and copying right inside the click handler.
  useEffect(() => {
    let current = true;
    packText(text).then((code) => {
      if (current) setUrl(`${window.location.origin}${route}/${code}`);
    });
    return () => {
      current = false;
    };
  }, [route, text]);

  const share = async () => {
    if (!url) return;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description });
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <Button variant={variant} onClick={share} disabled={!url}>
      <ShareNetworkIcon /> Share
    </Button>
  );
}
