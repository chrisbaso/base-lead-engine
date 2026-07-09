"use client";

import { useRef, useState } from "react";
import { Mic } from "lucide-react";

type ZoneKind = "attack" | "avoid" | "neutral";

type Zone = {
  id: string;
  label: string;
  name: string;
  kind: ZoneKind;
};

type Pitch = {
  id: string;
  label: string;
  recommended?: true;
};

const zones: Zone[] = [
  { id: "up-in", label: "Up In", name: "up-in", kind: "avoid" },
  { id: "up-mid", label: "Up Mid", name: "up-middle", kind: "avoid" },
  { id: "up-away", label: "Up Away", name: "up-away", kind: "neutral" },
  { id: "mid-in", label: "Mid In", name: "middle-in", kind: "neutral" },
  { id: "mid-mid", label: "Mid Mid", name: "middle-middle", kind: "neutral" },
  { id: "mid-away", label: "Mid Away", name: "middle-away", kind: "attack" },
  { id: "low-in", label: "Low In", name: "low-in", kind: "neutral" },
  { id: "low-mid", label: "Low Mid", name: "low-middle", kind: "attack" },
  { id: "low-away", label: "Low Away", name: "low-away", kind: "attack" }
];

const pitches: Pitch[] = [
  { id: "FB", label: "FB" },
  { id: "CB", label: "CB" },
  { id: "SL", label: "SL" },
  { id: "CH", label: "CH★", recommended: true }
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PitchDemo() {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSend = Boolean(selectedZone && selectedPitch);

  function handleSend() {
    if (!selectedZone || !selectedPitch) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setSentMessage(`✓ Sent — ${selectedPitch.id} ${selectedZone.name} on catcher screen · logged to scouting db`);
    setSelectedZone(null);
    setSelectedPitch(null);
    timerRef.current = setTimeout(() => {
      setSentMessage("");
      timerRef.current = null;
    }, 2500);
  }

  return (
    <div className="demo-wrap">
      <div className="demo-card" aria-label="Interactive DugoutCall pitch calling demo">
        <div className="game-header">
          <p className="game-title">vs Chaska / Top 4 · 1 out</p>
          <div className="game-pills" aria-label="Game status">
            <span className="score-pill">0–0</span>
            <span className="live-pill">
              <span className="live-dot" aria-hidden="true" />
              Live
            </span>
          </div>
        </div>

        <div className="scout-card">
          <div>
            <p className="scout-title">#12 Carter · Bats R</p>
            <p className="scout-note">Chases low-away, dead-red early in counts</p>
            <div className="chips" aria-label="Batter plan chips">
              <span className="chip">Start soft</span>
              <span className="chip">Expand late</span>
            </div>
          </div>

          <div className="spray" aria-label="Spray chart shade pull side">
            <svg viewBox="0 0 120 92" role="img" aria-label="Spray fan chart with 55, 30, and 15 percent wedges">
              <path d="M60 84 L12 14 A72 72 0 0 1 54 2 Z" fill="#1D5FA8" opacity="0.9" />
              <path d="M60 84 L54 2 A72 72 0 0 1 94 18 Z" fill="#1D5FA8" opacity="0.48" />
              <path d="M60 84 L94 18 A72 72 0 0 1 108 64 Z" fill="#1D5FA8" opacity="0.24" />
              <path d="M60 84 L12 14 A72 72 0 0 1 108 64 Z" fill="none" stroke="#1A2230" strokeOpacity="0.22" strokeWidth="3" />
              <text x="32" y="34" fill="#ffffff" fontSize="12" fontWeight="800">55</text>
              <text x="69" y="30" fill="#1A2230" fontSize="12" fontWeight="800">30</text>
              <text x="86" y="58" fill="#1A2230" fontSize="12" fontWeight="800">15</text>
            </svg>
            <span className="spray-caption">Shade pull side</span>
          </div>
        </div>

        <div className="zone-grid" aria-label="Strike zone locations">
          {zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className="zone-button"
              data-zone-kind={zone.kind}
              data-selected={selectedZone?.id === zone.id}
              aria-pressed={selectedZone?.id === zone.id}
              onClick={() => {
                setSelectedZone(zone);
              }}
            >
              <span>
                <span className="zone-symbol" aria-hidden="true">
                  {zone.kind === "avoid" ? "×" : zone.kind === "attack" ? "•" : ""}
                </span>
                {zone.label}
              </span>
            </button>
          ))}
        </div>

        <div className="pitch-row" aria-label="Pitch choices">
          {pitches.map((pitch) => (
            <button
              key={pitch.id}
              type="button"
              className="pitch-button"
              data-selected={selectedPitch?.id === pitch.id}
              data-recommended={pitch.recommended ? "true" : "false"}
              aria-pressed={selectedPitch?.id === pitch.id}
              aria-label={pitch.recommended ? `${pitch.id} recommended` : pitch.id}
              onClick={() => {
                setSelectedPitch(pitch);
              }}
            >
              {pitch.label}
            </button>
          ))}
        </div>

        {sentMessage ? (
          <div className="sent-banner" role="status" aria-live="polite">
            {sentMessage}
          </div>
        ) : null}

        <div className="send-row">
          <button
            type="button"
            className={classNames("demo-button", canSend ? "is-ready" : undefined)}
            disabled={!canSend}
            onClick={handleSend}
          >
            {canSend ? "Send to catcher" : "Select pitch + location"}
          </button>
          <button type="button" className="mic-button" aria-label="Hold mic to talk live to catcher">
            <Mic aria-hidden="true" size={20} strokeWidth={2.5} />
          </button>
        </div>
        <p className="mic-caption">Hold mic to talk live to catcher</p>
      </div>
      <p className="demo-caption">
        New batter — scouting card loads automatically / Verdict, attack plan, spray chart: zero taps. Try it ↑
      </p>
    </div>
  );
}
