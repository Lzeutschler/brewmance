import type { Icon, IconProps } from "@phosphor-icons/react";
import {
  ArrowCounterClockwiseIcon as ArrowCounterClockwiseBase,
  ArrowDownIcon as ArrowDownBase,
  ArrowLeftIcon as ArrowLeftBase,
  ArrowRightIcon as ArrowRightBase,
  ArrowUpIcon as ArrowUpBase,
  ArrowUpRightIcon as ArrowUpRightBase,
  ArrowsClockwiseIcon as ArrowsClockwiseBase,
  ArrowUUpLeftIcon as ArrowUUpLeftBase,
  CaretDownIcon as CaretDownBase,
  CaretLeftIcon as CaretLeftBase,
  CaretRightIcon as CaretRightBase,
  CardsIcon as CardsBase,
  ChartBarIcon as ChartBarBase,
  ChatCircleTextIcon as ChatCircleTextBase,
  CheckCircleIcon as CheckCircleBase,
  CheckIcon as CheckBase,
  CircleNotchIcon as CircleNotchBase,
  CopyIcon as CopyBase,
  DotsThreeIcon as DotsThreeBase,
  DownloadSimpleIcon as DownloadSimpleBase,
  EnvelopeSimpleIcon as EnvelopeSimpleBase,
  GithubLogoIcon as GithubLogoBase,
  HandIcon as HandBase,
  HeartIcon as HeartBase,
  InfoIcon as InfoBase,
  KeyboardIcon as KeyboardBase,
  ListChecksIcon as ListChecksBase,
  ListIcon as ListBase,
  MagnifyingGlassIcon as MagnifyingGlassBase,
  MinusIcon as MinusBase,
  NotePencilIcon as NotePencilBase,
  PackageIcon as PackageBase,
  PlayIcon as PlayBase,
  PlusIcon as PlusBase,
  RedditLogoIcon as RedditLogoBase,
  ShareNetworkIcon as ShareNetworkBase,
  ShieldCheckIcon as ShieldCheckBase,
  ShoppingCartSimpleIcon as ShoppingCartSimpleBase,
  ShuffleIcon as ShuffleBase,
  SidebarSimpleIcon as SidebarSimpleBase,
  SkipForwardIcon as SkipForwardBase,
  SlidersHorizontalIcon as SlidersHorizontalBase,
  StackIcon as StackBase,
  StarIcon as StarBase,
  SwapIcon as SwapBase,
  SwordIcon as SwordBase,
  TrashIcon as TrashBase,
  UploadSimpleIcon as UploadSimpleBase,
  WarningIcon as WarningBase,
  XCircleIcon as XCircleBase,
  XIcon as XBase,
} from "@phosphor-icons/react/ssr";

import { BrandMarkSvg } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

/** Phosphor icons default to the bold weight here: it holds up at 16px next to condensed labels. */
function bold(Base: Icon, name: string) {
  function BoldIcon(props: IconProps) {
    return <Base weight="bold" {...props} />;
  }
  BoldIcon.displayName = name;
  return BoldIcon;
}

export const ArrowCounterClockwiseIcon = bold(ArrowCounterClockwiseBase, "ArrowCounterClockwiseIcon");
export const ArrowDownIcon = bold(ArrowDownBase, "ArrowDownIcon");
export const ArrowLeftIcon = bold(ArrowLeftBase, "ArrowLeftIcon");
export const ArrowRightIcon = bold(ArrowRightBase, "ArrowRightIcon");
export const ArrowUpIcon = bold(ArrowUpBase, "ArrowUpIcon");
export const ArrowUpRightIcon = bold(ArrowUpRightBase, "ArrowUpRightIcon");
export const ArrowsClockwiseIcon = bold(ArrowsClockwiseBase, "ArrowsClockwiseIcon");
export const ArrowUUpLeftIcon = bold(ArrowUUpLeftBase, "ArrowUUpLeftIcon");
export const CaretDownIcon = bold(CaretDownBase, "CaretDownIcon");
export const CaretLeftIcon = bold(CaretLeftBase, "CaretLeftIcon");
export const CaretRightIcon = bold(CaretRightBase, "CaretRightIcon");
export const CardsIcon = bold(CardsBase, "CardsIcon");
export const ChartBarIcon = bold(ChartBarBase, "ChartBarIcon");
export const ChatCircleTextIcon = bold(ChatCircleTextBase, "ChatCircleTextIcon");
export const CheckCircleIcon = bold(CheckCircleBase, "CheckCircleIcon");
export const CheckIcon = bold(CheckBase, "CheckIcon");
export const CircleNotchIcon = bold(CircleNotchBase, "CircleNotchIcon");
export const CopyIcon = bold(CopyBase, "CopyIcon");
export const DotsThreeIcon = bold(DotsThreeBase, "DotsThreeIcon");
export const DownloadSimpleIcon = bold(DownloadSimpleBase, "DownloadSimpleIcon");
export const EnvelopeSimpleIcon = bold(EnvelopeSimpleBase, "EnvelopeSimpleIcon");
export const GithubLogoIcon = bold(GithubLogoBase, "GithubLogoIcon");
export const HandIcon = bold(HandBase, "HandIcon");
export const HeartIcon = bold(HeartBase, "HeartIcon");
export const InfoIcon = bold(InfoBase, "InfoIcon");
export const KeyboardIcon = bold(KeyboardBase, "KeyboardIcon");
export const ListChecksIcon = bold(ListChecksBase, "ListChecksIcon");
export const ListIcon = bold(ListBase, "ListIcon");
export const MagnifyingGlassIcon = bold(MagnifyingGlassBase, "MagnifyingGlassIcon");
export const MinusIcon = bold(MinusBase, "MinusIcon");
export const NotePencilIcon = bold(NotePencilBase, "NotePencilIcon");
export const PackageIcon = bold(PackageBase, "PackageIcon");
export const PlayIcon = bold(PlayBase, "PlayIcon");
export const PlusIcon = bold(PlusBase, "PlusIcon");
export const RedditLogoIcon = bold(RedditLogoBase, "RedditLogoIcon");
export const ShareNetworkIcon = bold(ShareNetworkBase, "ShareNetworkIcon");
export const ShieldCheckIcon = bold(ShieldCheckBase, "ShieldCheckIcon");
export const ShoppingCartSimpleIcon = bold(ShoppingCartSimpleBase, "ShoppingCartSimpleIcon");
export const ShuffleIcon = bold(ShuffleBase, "ShuffleIcon");
export const SidebarSimpleIcon = bold(SidebarSimpleBase, "SidebarSimpleIcon");
export const SkipForwardIcon = bold(SkipForwardBase, "SkipForwardIcon");
export const SlidersHorizontalIcon = bold(SlidersHorizontalBase, "SlidersHorizontalIcon");
export const StackIcon = bold(StackBase, "StackIcon");
export const StarIcon = bold(StarBase, "StarIcon");
export const SwapIcon = bold(SwapBase, "SwapIcon");
export const SwordIcon = bold(SwordBase, "SwordIcon");
export const TrashIcon = bold(TrashBase, "TrashIcon");
export const UploadSimpleIcon = bold(UploadSimpleBase, "UploadSimpleIcon");
export const WarningIcon = bold(WarningBase, "WarningIcon");
export const XCircleIcon = bold(XCircleBase, "XCircleIcon");
export const XIcon = bold(XBase, "XIcon");

/** Code points in the Mana font (github.com/andrewgioia/mana). */
const MANA_GLYPHS = {
  tap: "",
  untap: "",
  creature: "",
  artifact: "",
  enchantment: "",
  instant: "",
  sorcery: "",
  land: "",
  planeswalker: "",
  battle: "",
  multicolor: "",
  token: "",
  counter: "",
} as const;

export type ManaGlyphName = keyof typeof MANA_GLYPHS;

/** A tap, untap or card type symbol from the Mana font. Sized by font-size, like text. */
export function ManaGlyph({ name, className, label }: { name: ManaGlyphName; className?: string; label?: string }) {
  return (
    <i
      className={cn("inline-block font-mana leading-none not-italic", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {MANA_GLYPHS[name]}
    </i>
  );
}

/** The brand mark (a cauldron with a heart), coloured by the theme tokens. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <BrandMarkSvg
      className={className}
      colors={{ brew: "var(--brand)", rim: "var(--brand-hover)", legs: "var(--brand-edge)", heart: "var(--heart)" }}
    />
  );
}
