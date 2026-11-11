import Link from "next/link";

import { SpilledCauldron } from "@/components/cauldron";
import { ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

/** An unknown precon slug: the general 404 look, with the way back to the full list. */
export default function PreconNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <div className="relative mb-2 flex flex-col items-center gap-3">
        <SpilledCauldron className="text-[5px] sm:text-[6px]" />
        <span className="numeral rounded-sm bg-brand px-2 py-1 text-3xl text-ink shadow-md">404</span>
      </div>
      <h1 className="text-4xl leading-tight font-medium">No precon at this address</h1>
      <p className="text-muted-foreground">The link may be old or mistyped. Every precon is in the list, by year and color.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/precons" />}>
          All precons <ArrowRightIcon aria-hidden />
        </Button>
      </div>
    </div>
  );
}
