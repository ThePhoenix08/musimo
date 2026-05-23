import React from "react";

import AccordionIcon from "@/assets/instrument_svgs/accordion.svg";
import BanjoIcon from "@/assets/instrument_svgs/banjo.svg";
import BassIcon from "@/assets/instrument_svgs/bass.svg";
import CelloIcon from "@/assets/instrument_svgs/cello.svg";
import ClarinetIcon from "@/assets/instrument_svgs/clarinet.svg";
import CymbalsIcon from "@/assets/instrument_svgs/cymbals.svg";
import DrumsIcon from "@/assets/instrument_svgs/drums.svg";
import FluteIcon from "@/assets/instrument_svgs/flute.svg";
import GuitarIcon from "@/assets/instrument_svgs/guitar.svg";
import MalletPercussionIcon from "@/assets/instrument_svgs/mallet_percussion.svg";
import MandolinIcon from "@/assets/instrument_svgs/mandolin.svg";
import OrganIcon from "@/assets/instrument_svgs/organ.svg";
import PianoIcon from "@/assets/instrument_svgs/piano.svg";
import SaxophoneIcon from "@/assets/instrument_svgs/saxophone.svg";
import SynthesizerIcon from "@/assets/instrument_svgs/synthesizer.svg";
import TromboneIcon from "@/assets/instrument_svgs/trombone.svg";
import TrumpetIcon from "@/assets/instrument_svgs/trumpet.svg";
import UkuleleIcon from "@/assets/instrument_svgs/ukulele.svg";
import ViolinIcon from "@/assets/instrument_svgs/violin.svg";
import VoiceIcon from "@/assets/instrument_svgs/voice.svg";
import DefaultIcon from "@/assets/instrument_svgs/default.svg";

export const INSTRUMENT_ICONS = {
  accordion: AccordionIcon,
  banjo: BanjoIcon,
  bass: BassIcon,
  cello: CelloIcon,
  clarinet: ClarinetIcon,
  cymbals: CymbalsIcon,
  drums: DrumsIcon,
  flute: FluteIcon,
  guitar: GuitarIcon,
  mallet_percussion: MalletPercussionIcon,
  mandolin: MandolinIcon,
  organ: OrganIcon,
  piano: PianoIcon,
  saxophone: SaxophoneIcon,
  synthesizer: SynthesizerIcon,
  trombone: TromboneIcon,
  trumpet: TrumpetIcon,
  ukulele: UkuleleIcon,
  violin: ViolinIcon,
  voice: VoiceIcon,
};

export function InstrumentIcon({
  name,
  size = 24,
  className = "",
  style = {},
  muted = false,
}) {
  const normalizedKey = name?.toLowerCase();
  const iconSrc = INSTRUMENT_ICONS[normalizedKey] || DefaultIcon;

  return (
    <img
      src={iconSrc}
      alt={name ?? "instrument"}
      className={`shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        // Amber-gold tint lighter than --primary, or muted gray
        filter: muted
          ? "brightness(0) saturate(100%) invert(60%) sepia(5%) saturate(300%) hue-rotate(20deg)"
          : "brightness(0) saturate(100%) invert(85%) sepia(40%) saturate(500%) hue-rotate(5deg) brightness(1.05)",
        opacity: muted ? 0.5 : 1,
        ...style,
      }}
    />
  );
}
