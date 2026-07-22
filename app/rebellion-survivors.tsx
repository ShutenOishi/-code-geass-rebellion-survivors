"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PilotId = "lelouch" | "kallen" | "suzaku";
type Screen = "briefing" | "battle" | "result";
type EnemyKind = "sutherland" | "gloucester" | "vincent" | "siegfried";

type Pilot = {
  id: PilotId;
  callSign: string;
  name: string;
  machine: string;
  role: string;
  weapon: string;
  subweapon: string;
  burst: string;
  quote: string;
  accent: string;
  accent2: string;
  image: string;
  portrait: string;
  hp: number;
  speed: number;
  damage: number;
  armor: number;
  summary: string;
};

type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  boss: boolean;
  flash: number;
};

type Projectile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
  pierce: number;
  hit: Set<number>;
  kind: "shot" | "wave" | "blade";
};

type Gem = { id: number; x: number; y: number; value: number; life: number };
type Spark = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};
type FloatText = { id: number; x: number; y: number; text: string; life: number; color: string };
type Shockwave = {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  startRadius: number;
  endRadius: number;
  color: string;
  width: number;
};

type UpgradeKey =
  | "weapon"
  | "rate"
  | "multi"
  | "power"
  | "armor"
  | "speed"
  | "magnet"
  | "energy";

type Upgrade = {
  key: UpgradeKey;
  title: string;
  category: string;
  description: string;
  glyph: string;
  color: string;
};

type GameState = {
  pilot: Pilot;
  elapsed: number;
  duration: number;
  lastTime: number;
  spawnClock: number;
  fireClock: number;
  meleeClock: number;
  shieldClock: number;
  shieldActive: number;
  shieldHitClock: number;
  bossFlags: Set<number>;
  player: {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    armor: number;
    invulnerable: number;
    boost: number;
  };
  enemies: Enemy[];
  projectiles: Projectile[];
  gems: Gem[];
  sparks: Spark[];
  shockwaves: Shockwave[];
  floaters: FloatText[];
  kills: number;
  score: number;
  level: number;
  xp: number;
  xpNext: number;
  weaponRank: number;
  rateRank: number;
  multi: number;
  power: number;
  magnet: number;
  special: number;
  specialMax: number;
  nextId: number;
  hitPulse: number;
  impactFlash: number;
  shake: number;
  combo: number;
  comboBest: number;
  comboClock: number;
  soundClock: number;
  soundCue: "shot" | "slash" | "kill" | null;
  evolution: boolean;
};

const PILOTS: Pilot[] = [
  {
    id: "lelouch",
    callSign: "ZERO",
    name: "ルルーシュ・ランペルージ",
    machine: "蜃気楼",
    role: "戦術防御・広域制圧",
    weapon: "ハドロンショット",
    subweapon: "絶対守護領域",
    burst: "絶対守護領域",
    quote: "撃っていいのは、撃たれる覚悟のある奴だけだ",
    accent: "#d7b85b",
    accent2: "#8b5cf6",
    image: "/assets/kmf/shinkiro.webp",
    portrait: "/assets/pilots/lelouch.webp",
    hp: 150,
    speed: 184,
    damage: 1.06,
    armor: 4,
    summary: "貫通するハドロンショットに加え、絶対守護領域を一定間隔で自動展開。包囲した敵を防壁で押し潰す。",
  },
  {
    id: "kallen",
    callSign: "Q-1",
    name: "紅月カレン",
    machine: "紅蓮聖天八極式",
    role: "近接突破・瞬間殲滅",
    weapon: "輻射波動機構",
    subweapon: "徹甲砲撃右腕部",
    burst: "聖天八極解放",
    quote: "ここから先は、この紅蓮が相手よ！",
    accent: "#ff3b45",
    accent2: "#ff9f43",
    image: "/assets/kmf/guren-seiten.webp",
    portrait: "/assets/pilots/kallen.webp",
    hp: 160,
    speed: 202,
    damage: 1.08,
    armor: 2,
    summary: "徹甲砲撃右腕から放つ近距離の輻射波動。威力は高いが、有効範囲へ踏み込む判断が必要な突破型。",
  },
  {
    id: "suzaku",
    callSign: "KNIGHT OF ZERO",
    name: "枢木スザク",
    machine: "ランスロット・アルビオン",
    role: "高速機動・射撃近接連携",
    weapon: "スーパーヴァリス",
    subweapon: "MVS（二刀）",
    burst: "『生きろ』のギアス",
    quote: "僕は、生きなければならない！",
    accent: "#80d8ff",
    accent2: "#f5d76e",
    image: "/assets/kmf/lancelot-albion.webp",
    portrait: "/assets/pilots/suzaku.webp",
    hp: 142,
    speed: 222,
    damage: 1,
    armor: 3,
    summary: "開幕から複数照準するスーパーヴァリスと、近距離で二連斬りを放つMVS。機動射撃と斬撃を繋ぐ万能型。",
  },
];

const UPGRADES: Upgrade[] = [
  { key: "weapon", title: "固有武装強化", category: "WEAPON", description: "固有武装の威力と射程を増幅。最終段階で進化する。", glyph: "◆", color: "#ff4057" },
  { key: "rate", title: "ファクトスフィア", category: "TARGETING", description: "索敵演算を高速化し、攻撃間隔を8%短縮。", glyph: "◉", color: "#83d8ff" },
  { key: "multi", title: "多重照準リンク", category: "SYSTEM", description: "同時攻撃数を1つ追加。MVSと近接武装の手数も増幅。", glyph: "⌁", color: "#d7b85b" },
  { key: "power", title: "出力リミッター解除", category: "CORE", description: "全攻撃のダメージを16%上昇。", glyph: "▲", color: "#ff9d5c" },
  { key: "armor", title: "複合装甲", category: "FRAME", description: "被ダメージを2軽減し、耐久力を回復。", glyph: "⬡", color: "#a7f3d0" },
  { key: "speed", title: "ランドスピナー強化", category: "MOBILITY", description: "移動速度を10%上昇。", glyph: "»", color: "#c4b5fd" },
  { key: "magnet", title: "広域索敵", category: "SENSOR", description: "サクラダイト回収範囲を35%拡大。", glyph: "◎", color: "#77ffe6" },
  { key: "energy", title: "エナジーフィラー", category: "SUPPLY", description: "最大耐久力を20増加し、25回復。", glyph: "＋", color: "#f8fafc" },
];

const ENEMY_DATA: Record<EnemyKind, { hp: number; speed: number; damage: number; radius: number; color: string; label: string }> = {
  sutherland: { hp: 30, speed: 76, damage: 12, radius: 18, color: "#7c6bc4", label: "RPI-13" },
  gloucester: { hp: 62, speed: 58, damage: 18, radius: 22, color: "#a33952", label: "GLOUCESTER" },
  vincent: { hp: 100, speed: 95, damage: 22, radius: 21, color: "#d6a323", label: "VINCENT" },
  siegfried: { hp: 1100, speed: 35, damage: 32, radius: 48, color: "#ff7b35", label: "SIEGFRIED" },
};

const formatTime = (seconds: number) => {
  const remaining = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGame(pilot: Pilot): GameState {
  return {
    pilot,
    elapsed: 0,
    duration: 300,
    lastTime: 0,
    spawnClock: 0,
    fireClock: 0.12,
    meleeClock: 0.18,
    shieldClock: pilot.id === "lelouch" ? 2.4 : Number.POSITIVE_INFINITY,
    shieldActive: 0,
    shieldHitClock: 0,
    bossFlags: new Set(),
    player: { x: 0, y: 0, hp: pilot.hp, maxHp: pilot.hp, speed: pilot.speed, armor: pilot.armor, invulnerable: 1.8, boost: 0 },
    enemies: [],
    projectiles: [],
    gems: [],
    sparks: [],
    shockwaves: [],
    floaters: [],
    kills: 0,
    score: 0,
    level: 1,
    xp: 0,
    xpNext: 20,
    weaponRank: 1,
    rateRank: 0,
    multi: pilot.id === "suzaku" ? 2 : 1,
    power: pilot.damage,
    magnet: 142,
    special: 0,
    specialMax: 24,
    nextId: 1,
    hitPulse: 0,
    impactFlash: 0,
    shake: 0,
    combo: 0,
    comboBest: 0,
    comboClock: 0,
    soundClock: 0,
    soundCue: null,
    evolution: false,
  };
}

export function RebellionSurvivors() {
  const [screen, setScreen] = useState<Screen>("briefing");
  const [selectedId, setSelectedId] = useState<PilotId>("lelouch");
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [levelChoices, setLevelChoices] = useState<Upgrade[] | null>(null);
  const [hud, setHud] = useState({ hp: 1, maxHp: 1, xp: 0, xpNext: 1, level: 1, kills: 0, score: 0, remaining: 300, special: 0, specialMax: 24, weaponRank: 1, evolution: false, combo: 0, shieldActive: 0, shieldClock: 0 });
  const [result, setResult] = useState({ won: false, kills: 0, score: 0, level: 1, time: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const keysRef = useRef(new Set<string>());
  const stickRef = useRef({ x: 0, y: 0, active: false, pointer: -1 });
  const imagesRef = useRef(new Map<PilotId, HTMLImageElement>());
  const audioRef = useRef<AudioContext | null>(null);
  const hudClockRef = useRef(0);
  const selectedPilot = useMemo(() => PILOTS.find((p) => p.id === selectedId) ?? PILOTS[0], [selectedId]);

  const tone = useCallback((frequency = 260, duration = 0.08, type: OscillatorType = "sine", gain = 0.035) => {
    if (!sound || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioRef.current ?? new AudioCtx();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.72), ctx.currentTime + duration);
      vol.gain.setValueAtTime(gain, ctx.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(vol).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Sound is optional; gameplay remains available when the browser blocks audio.
    }
  }, [sound]);

  useEffect(() => {
    PILOTS.forEach((pilot) => {
      const image = new Image();
      image.src = pilot.image;
      imagesRef.current.set(pilot.id, image);
    });
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
      keysRef.current.add(event.key.toLowerCase());
      if (levelChoices && ["1", "2", "3"].includes(event.key)) {
        const choice = levelChoices[Number(event.key) - 1];
        if (choice) applyUpgrade(choice);
      }
      if (event.key.toLowerCase() === "p" && screen === "battle") setPaused((value) => !value);
      if (event.key === " " && screen === "battle") activateBurst();
    };
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && screen === "battle") setPaused(true);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [screen]);

  const syncHud = useCallback((game: GameState) => {
    setHud({
      hp: game.player.hp,
      maxHp: game.player.maxHp,
      xp: game.xp,
      xpNext: game.xpNext,
      level: game.level,
      kills: game.kills,
      score: game.score,
      remaining: game.duration - game.elapsed,
      special: game.special,
      specialMax: game.specialMax,
      weaponRank: game.weaponRank,
      evolution: game.evolution,
      combo: game.combo,
      shieldActive: game.shieldActive,
      shieldClock: game.shieldClock,
    });
  }, []);

  const startBattle = useCallback(() => {
    const game = makeGame(selectedPilot);
    gameRef.current = game;
    syncHud(game);
    setPaused(false);
    setLevelChoices(null);
    setScreen("battle");
    tone(360, 0.18, "sawtooth", 0.04);
  }, [selectedPilot, syncHud, tone]);

  const finishBattle = useCallback((won: boolean) => {
    const game = gameRef.current;
    if (!game) return;
    setResult({ won, kills: game.kills, score: game.score + (won ? 5000 : 0), level: game.level, time: game.elapsed });
    setLevelChoices(null);
    setPaused(false);
    setScreen("result");
    tone(won ? 520 : 120, 0.4, won ? "triangle" : "sawtooth", 0.06);
  }, [tone]);

  const pickChoices = useCallback((game: GameState) => {
    const pool = UPGRADES.filter((upgrade) => {
      if (upgrade.key === "multi" && game.multi >= 5) return false;
      if (upgrade.key === "weapon" && game.weaponRank >= 6) return false;
      return true;
    });
    const choices: Upgrade[] = [];
    const random = mulberry32(Math.floor(game.elapsed * 1000) + game.level * 7919);
    while (choices.length < 3 && pool.length) {
      const candidate = pool[Math.floor(random() * pool.length)];
      if (!choices.some((item) => item.key === candidate.key)) choices.push(candidate);
    }
    setLevelChoices(choices);
    tone(690, 0.16, "triangle", 0.045);
  }, [tone]);

  const applyUpgrade = useCallback((upgrade: Upgrade) => {
    const game = gameRef.current;
    if (!game) return;
    switch (upgrade.key) {
      case "weapon":
        game.weaponRank += 1;
        game.power *= 1.11;
        if (game.weaponRank >= 6) game.evolution = true;
        break;
      case "rate": game.rateRank += 1; break;
      case "multi": game.multi += 1; break;
      case "power": game.power *= 1.16; break;
      case "armor":
        game.player.armor += 2;
        game.player.hp = Math.min(game.player.maxHp, game.player.hp + 30);
        break;
      case "speed": game.player.speed *= 1.1; break;
      case "magnet": game.magnet *= 1.35; break;
      case "energy":
        game.player.maxHp += 20;
        game.player.hp = Math.min(game.player.maxHp, game.player.hp + 25);
        break;
    }
    setLevelChoices(null);
    syncHud(game);
    tone(420, 0.13, "square", 0.035);
  }, [syncHud, tone]);

  function activateBurst() {
    const game = gameRef.current;
    if (!game || game.special < game.specialMax || screen !== "battle" || paused || levelChoices) return;
    game.special = 0;
    game.shake = 0.8;
    if (game.pilot.id === "lelouch") {
      game.player.invulnerable = 7;
      game.shieldActive = Math.max(game.shieldActive, 7);
      game.shieldClock = 8;
      for (const enemy of game.enemies) {
        enemy.hp -= 82 * game.power;
        enemy.flash = 0.35;
      }
      radialSparks(game, game.player.x, game.player.y, "#d7b85b", 42, 380);
      addShockwave(game, game.player.x, game.player.y, "#f4d67a", 58, 610, 0.72, 7);
    } else if (game.pilot.id === "kallen") {
      game.player.boost = 9;
      const targets = game.enemies.filter((enemy) => Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) < 470);
      for (const enemy of targets) {
        enemy.hp -= 112 * game.power;
        enemy.flash = 0.45;
      }
      radialSparks(game, game.player.x, game.player.y, "#ff4057", 52, 480);
      addShockwave(game, game.player.x, game.player.y, "#ff4057", 45, 500, 0.55, 10);
    } else {
      game.player.invulnerable = 4;
      game.player.boost = 10;
      game.player.hp = Math.max(game.player.hp, game.player.maxHp * 0.45);
      for (const enemy of game.enemies) {
        const distance = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
        if (distance < 310) {
          enemy.hp -= 96 * game.power;
          enemy.flash = 0.45;
        }
      }
      radialSparks(game, game.player.x, game.player.y, "#80d8ff", 48, 420);
      addShockwave(game, game.player.x, game.player.y, "#80d8ff", 36, 340, 0.48, 8);
    }
    game.floaters.push({ id: game.nextId++, x: game.player.x, y: game.player.y - 62, text: game.pilot.burst, life: 1.6, color: game.pilot.accent });
    syncHud(game);
    tone(game.pilot.id === "kallen" ? 150 : 240, 0.55, "sawtooth", 0.075);
  }

  useEffect(() => {
    if (screen !== "battle" || paused || levelChoices) return;
    const canvas = canvasRef.current;
    const game = gameRef.current;
    if (!canvas || !game) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let stopped = false;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (time: number) => {
      if (stopped) return;
      if (!game.lastTime) game.lastTime = time;
      const dt = Math.min(0.033, Math.max(0.001, (time - game.lastTime) / 1000));
      game.lastTime = time;
      updateGame(game, dt, keysRef.current, stickRef.current, pickChoices, finishBattle);
      if (game.soundCue) {
        if (game.soundCue === "slash") tone(175, 0.055, "sawtooth", 0.018);
        else if (game.soundCue === "kill") tone(105, 0.075, "square", 0.022);
        else tone(game.pilot.id === "lelouch" ? 440 : game.pilot.id === "kallen" ? 210 : 560, 0.045, "square", 0.012);
        game.soundCue = null;
      }
      drawGame(ctx, canvas, game, imagesRef.current);
      hudClockRef.current += dt;
      if (hudClockRef.current > 0.09) {
        hudClockRef.current = 0;
        syncHud(game);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      game.lastTime = 0;
    };
  }, [finishBattle, levelChoices, paused, pickChoices, screen, syncHud, tone]);

  const handleStick = (event: React.PointerEvent<HTMLDivElement>, phase: "start" | "move" | "end") => {
    const knob = event.currentTarget.querySelector<HTMLElement>("[data-stick-knob]");
    if (phase === "end") {
      if (stickRef.current.pointer === event.pointerId) {
        stickRef.current = { x: 0, y: 0, active: false, pointer: -1 };
        if (knob) knob.style.transform = "translate(0px, 0px)";
      }
      return;
    }
    if (phase === "start") {
      event.currentTarget.setPointerCapture(event.pointerId);
      stickRef.current.active = true;
      stickRef.current.pointer = event.pointerId;
    }
    if (stickRef.current.pointer !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(x, y) || 1;
    const cap = rect.width * 0.34;
    const scale = Math.min(1, cap / length);
    stickRef.current.x = (x * scale) / cap;
    stickRef.current.y = (y * scale) / cap;
    if (knob) knob.style.transform = `translate(${stickRef.current.x * 38}px, ${stickRef.current.y * 38}px)`;
  };

  if (screen === "briefing") {
    return (
      <main className="shell briefing-screen" style={{ "--pilot": selectedPilot.accent } as React.CSSProperties}>
        <div className="scanline" />
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark">C.G.</span>
            <div><strong>REBELLION SURVIVORS</strong><small>C&apos;S WORLD COMBAT ARCHIVE</small></div>
          </div>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setSound((value) => !value)} aria-label={sound ? "サウンドをオフ" : "サウンドをオン"}>{sound ? "SOUND ON" : "SOUND OFF"}</button>
            <button className="icon-button" onClick={() => setHelpOpen(true)}>HOW TO PLAY</button>
          </div>
        </header>

        <section className="briefing-hero">
          <div className="hero-copy">
            <p className="eyebrow"><span>UNAUTHORIZED REPLAY</span>{" // ARCHIVE 99-02"}</p>
            <h1><span>CODE GEASS</span>REBELLION<br />SURVIVORS</h1>
            <p className="hero-lead">Cの世界に残された戦闘記録が暴走。選んだパイロットとKMFで、5分間の包囲戦を突破せよ。</p>
            <div className="mission-strip">
              <span>OPERATION</span><strong>TOKYO SETTLEMENT</strong><i>05:00</i>
            </div>
          </div>
          <div className="hero-machine" aria-hidden="true">
            <div className="machine-halo" />
            <img src={selectedPilot.image} alt="" />
            <div className="machine-id"><small>SELECTED FRAME</small><strong>{selectedPilot.machine}</strong><span>{selectedPilot.callSign}</span></div>
          </div>
        </section>

        <section className="roster-section" aria-labelledby="roster-title">
          <div className="section-heading"><div><span>01</span><p>SELECT YOUR UNIT</p></div><h2 id="roster-title">出撃ユニット選択</h2></div>
          <div className="pilot-grid">
            {PILOTS.map((pilot, index) => (
              <button key={pilot.id} className={`pilot-card ${pilot.id === selectedId ? "selected" : ""}`} onClick={() => { setSelectedId(pilot.id); tone(220 + index * 80, 0.08, "square", 0.025); }} style={{ "--accent": pilot.accent, "--accent2": pilot.accent2 } as React.CSSProperties}>
                <span className="card-index">0{index + 1}</span>
                <div className="card-art"><img src={pilot.image} alt={`${pilot.machine}のゲーム用イラスト`} /></div>
                <div className="card-body">
                  <img className="pilot-portrait" src={pilot.portrait} alt="" aria-hidden="true" />
                  <span className="callsign">{pilot.callSign}</span>
                  <strong>{pilot.name}</strong>
                  <h3>{pilot.machine}</h3>
                  <p>{pilot.summary}</p>
                  <dl><div><dt>MAIN</dt><dd>{pilot.weapon}</dd></div><div><dt>SUB / AUTO</dt><dd>{pilot.subweapon}</dd></div><div><dt>BURST</dt><dd>{pilot.burst}</dd></div></dl>
                </div>
                <span className="selected-label">SELECTED</span>
              </button>
            ))}
          </div>
        </section>

        <section className="launch-panel">
          <div><span>COMBAT ROLE</span><strong>{selectedPilot.role}</strong><p>移動は自分で、攻撃は自動。サクラダイトを回収して武装を進化させます。</p></div>
          <button className="launch-button" onClick={startBattle}><span>作戦開始</span><strong>LAUNCH</strong><i>→</i></button>
        </section>

        <footer className="site-footer">
          <p>非公式ファンメイド・プレイアブルプロトタイプ。権利者各社とは関係ありません。</p>
          <div><a href="https://geass.jp/r2/mecha.html" target="_blank" rel="noreferrer">KMF公式設定</a><a href="https://geass.jp/r2/figure.html" target="_blank" rel="noreferrer">武装資料</a></div>
        </footer>
        {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
      </main>
    );
  }

  if (screen === "result") {
    return (
      <main className={`shell result-screen ${result.won ? "won" : "lost"}`} style={{ "--pilot": selectedPilot.accent } as React.CSSProperties}>
        <div className="result-emblem">{result.won ? "作戦完了" : "KMF LOST"}</div>
        <p className="eyebrow">COMBAT ARCHIVE // RESULT</p>
        <h1>{result.won ? "包囲網、突破" : "戦闘記録、途絶"}</h1>
        <p className="result-quote">「{selectedPilot.quote}」</p>
        <div className="result-machine"><img src={selectedPilot.image} alt={selectedPilot.machine} /></div>
        <div className="result-stats"><div><span>SCORE</span><strong>{result.score.toLocaleString()}</strong></div><div><span>撃破数</span><strong>{result.kills}</strong></div><div><span>到達LEVEL</span><strong>{result.level}</strong></div><div><span>SURVIVED</span><strong>{formatTime(result.time)}</strong></div></div>
        <div className="result-actions"><button onClick={startBattle}>同じ機体で再出撃</button><button className="secondary" onClick={() => setScreen("briefing")}>ユニット選択へ</button></div>
      </main>
    );
  }

  const hpRatio = Math.max(0, hud.hp / hud.maxHp);
  const xpRatio = Math.max(0, Math.min(1, hud.xp / hud.xpNext));
  const burstRatio = Math.min(1, hud.special / hud.specialMax);
  const systemStatus = selectedPilot.id === "lelouch"
    ? hud.shieldActive > 0 ? "ABSOLUTE DEFENSE // ACTIVE" : `ABSOLUTE DEFENSE // ${Math.max(0, hud.shieldClock).toFixed(1)}s`
    : selectedPilot.id === "suzaku" ? "MVS TWIN EDGE // ×2" : "RADIANT WAVE // CLOSE RANGE";
  return (
    <main className="battle-screen" style={{ "--pilot": selectedPilot.accent, "--pilot2": selectedPilot.accent2 } as React.CSSProperties}>
      <canvas ref={canvasRef} className="battle-canvas" aria-label="戦闘エリア" />
      <div className="battle-vignette" />
      <header className="battle-header">
        <div className="pilot-chip"><img src={selectedPilot.portrait} alt="" /><div><span>{selectedPilot.callSign}</span><strong>{selectedPilot.machine}</strong></div></div>
        <div className="timer"><span>TIME TO SURVIVE</span><strong>{formatTime(hud.remaining)}</strong></div>
        <div className="battle-actions"><button onClick={() => setSound((value) => !value)} aria-label="サウンド切替">{sound ? "♪" : "×"}</button><button onClick={() => setPaused(true)} aria-label="一時停止">Ⅱ</button></div>
      </header>
      <aside className="combat-readout">
        <div><span>LEVEL</span><strong>{String(hud.level).padStart(2, "0")}</strong></div>
        <div><span>KILLS</span><strong>{hud.kills.toLocaleString()}</strong></div>
        <div><span>SCORE</span><strong>{hud.score.toLocaleString()}</strong></div>
      </aside>
      <div className="weapon-readout"><span>ACTIVE WEAPON</span><strong>{hud.evolution ? `${selectedPilot.weapon}・極` : selectedPilot.weapon}</strong><em>{selectedPilot.subweapon}</em><i>RANK {hud.weaponRank}</i></div>
      <div className={`system-readout ${hud.shieldActive > 0 ? "active" : ""}`}>{systemStatus}</div>
      {hud.combo >= 3 && <div className="combo-readout"><strong>{hud.combo}</strong><span>CHAIN</span></div>}
      <div className="health-panel"><div className="health-label"><span>FRAME INTEGRITY</span><strong>{Math.ceil(hud.hp)} / {hud.maxHp}</strong></div><div className="health-bar"><i style={{ width: `${hpRatio * 100}%` }} /></div></div>
      <div className="xp-panel"><span>Lv.{hud.level}</span><div><i style={{ width: `${xpRatio * 100}%` }} /></div><strong>SAKURADITE</strong></div>
      <div className="virtual-stick" onPointerDown={(event) => handleStick(event, "start")} onPointerMove={(event) => handleStick(event, "move")} onPointerUp={(event) => handleStick(event, "end")} onPointerCancel={(event) => handleStick(event, "end")}>
        <div className="stick-arrows">＋</div><i data-stick-knob />
      </div>
      <button className={`burst-button ${burstRatio >= 1 ? "ready" : ""}`} onClick={activateBurst} aria-label={`${selectedPilot.burst}を発動`}>
        <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" pathLength="1" style={{ strokeDashoffset: 1 - burstRatio }} /></svg>
        <span>{burstRatio >= 1 ? "BURST" : `${Math.floor(burstRatio * 100)}%`}</span><strong>{selectedPilot.burst}</strong>
      </button>
      <div className="controls-hint">WASD / 矢印キーで移動　・　SPACEでBURST</div>
      {paused && <PauseDialog onResume={() => setPaused(false)} onQuit={() => { setPaused(false); setScreen("briefing"); }} />}
      {levelChoices && <LevelDialog choices={levelChoices} pilot={selectedPilot} onChoose={applyUpgrade} />}
    </main>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="modal-panel help-panel"><span className="modal-code">TACTICAL MANUAL // 01</span><h2 id="help-title">包囲戦を生き残れ</h2><div className="help-grid"><article><b>01</b><strong>移動に集中</strong><p>攻撃は自動。キーボード、または画面左下のスティックで敵との間合いを取ります。</p></article><article><b>02</b><strong>サクラダイト回収</strong><p>撃破したKMFが落とす結晶でレベルアップ。3つの強化から1つ選択します。</p></article><article><b>03</b><strong>BURSTを切る</strong><p>ゲージ満タンで固有BURSTが使用可能。包囲された瞬間が使いどころです。</p></article></div><button className="modal-primary" onClick={onClose}>了解 — BRIEFINGへ戻る</button></div></div>;
}

function PauseDialog({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal-panel pause-panel"><span className="modal-code">COMBAT PAUSED</span><h2>戦術演算を中断</h2><button className="modal-primary" onClick={onResume}>戦闘を再開</button><button className="modal-secondary" onClick={onQuit}>作戦を破棄</button></div></div>;
}

function LevelDialog({ choices, pilot, onChoose }: { choices: Upgrade[]; pilot: Pilot; onChoose: (upgrade: Upgrade) => void }) {
  return <div className="modal-backdrop level-backdrop" role="dialog" aria-modal="true" aria-labelledby="level-title"><div className="level-panel"><p className="eyebrow">SAKURADITE REACTION // LEVEL UP</p><h2 id="level-title">戦術システムを選択</h2><div className="upgrade-grid">{choices.map((choice, index) => <button key={choice.key} onClick={() => onChoose(choice)} style={{ "--upgrade": choice.color } as React.CSSProperties}><span className="upgrade-number">0{index + 1}</span><i>{choice.glyph}</i><small>{choice.category}</small><strong>{choice.title}</strong><p>{choice.description}</p><b>INSTALL →</b></button>)}</div><p className="level-pilot"><span style={{ color: pilot.accent }}>●</span> {pilot.machine}{" // 戦闘中は時間が停止しています"}</p></div></div>;
}

function updateGame(game: GameState, dt: number, keys: Set<string>, stick: { x: number; y: number }, onLevel: (game: GameState) => void, onFinish: (won: boolean) => void) {
  game.elapsed += dt;
  game.player.invulnerable = Math.max(0, game.player.invulnerable - dt);
  game.player.boost = Math.max(0, game.player.boost - dt);
  game.special = Math.min(game.specialMax, game.special + dt * (game.player.boost > 0 ? 1.7 : 1));
  game.hitPulse = Math.max(0, game.hitPulse - dt);
  game.impactFlash = Math.max(0, game.impactFlash - dt);
  game.shake = Math.max(0, game.shake - dt);
  game.comboClock = Math.max(0, game.comboClock - dt);
  if (game.comboClock <= 0) game.combo = 0;
  game.soundClock = Math.max(0, game.soundClock - dt);
  game.shieldHitClock = Math.max(0, game.shieldHitClock - dt);

  if (game.pilot.id === "lelouch") {
    if (game.shieldActive > 0) {
      game.shieldActive = Math.max(0, game.shieldActive - dt);
      game.player.invulnerable = Math.max(game.player.invulnerable, 0.12);
    } else {
      game.shieldClock -= dt;
      if (game.shieldClock <= 0) activateAbsoluteDefense(game);
    }
  }

  let dx = stick.x;
  let dy = stick.y;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;
  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  const moveLength = Math.hypot(dx, dy);
  if (moveLength > 0) {
    const speed = game.player.speed * (game.player.boost > 0 ? 1.28 : 1);
    game.player.x += (dx / moveLength) * speed * dt;
    game.player.y += (dy / moveLength) * speed * dt;
  }

  const intensity = 1 + game.elapsed / 54;
  game.spawnClock -= dt;
  if (game.spawnClock <= 0 && game.enemies.length < 220) {
    const count = Math.min(7, 1 + Math.floor(game.elapsed / 40));
    for (let i = 0; i < count; i++) spawnEnemy(game, false);
    game.spawnClock = Math.max(0.105, 0.52 / intensity);
  }
  for (const checkpoint of [60, 150, 240]) {
    if (game.elapsed >= checkpoint && !game.bossFlags.has(checkpoint)) {
      game.bossFlags.add(checkpoint);
      spawnEnemy(game, true);
    }
  }

  game.fireClock -= dt;
  const baseFireRate = game.pilot.id === "kallen" ? 0.74 : game.pilot.id === "suzaku" ? 0.57 : 0.66;
  const fireRate = Math.max(0.12, baseFireRate * Math.pow(0.92, game.rateRank) / (game.player.boost > 0 ? 1.7 : 1));
  if (game.fireClock <= 0 && game.enemies.length) {
    fireWeapon(game);
    game.fireClock = fireRate;
  }

  if (game.pilot.id === "suzaku") {
    game.meleeClock -= dt;
    if (game.meleeClock <= 0 && game.enemies.length) {
      fireAlbionMvs(game);
      const meleeRate = Math.max(0.24, 0.62 * Math.pow(0.94, game.rateRank) / (game.player.boost > 0 ? 1.45 : 1));
      game.meleeClock = meleeRate;
    }
  }

  for (const enemy of game.enemies) {
    enemy.flash = Math.max(0, enemy.flash - dt);
    const ex = game.player.x - enemy.x;
    const ey = game.player.y - enemy.y;
    const distance = Math.hypot(ex, ey) || 1;
    const wobble = enemy.kind === "vincent" ? Math.sin(game.elapsed * 4 + enemy.id) * 0.38 : 0;
    enemy.x += ((ex / distance) - (ey / distance) * wobble) * enemy.speed * (1 + game.elapsed / 420) * dt;
    enemy.y += ((ey / distance) + (ex / distance) * wobble) * enemy.speed * (1 + game.elapsed / 420) * dt;
    if (distance < enemy.radius + 28 && game.player.invulnerable <= 0) {
      const damage = Math.max(1, enemy.damage - game.player.armor);
      game.player.hp -= damage;
      game.player.invulnerable = 0.54;
      game.hitPulse = 0.35;
      game.shake = 0.25;
      game.floaters.push({ id: game.nextId++, x: game.player.x, y: game.player.y - 48, text: `-${damage}`, life: 0.75, color: "#ff4057" });
      const knock = 26;
      enemy.x -= (ex / distance) * knock;
      enemy.y -= (ey / distance) * knock;
    }
  }

  if (game.pilot.id === "lelouch" && game.shieldActive > 0 && game.shieldHitClock <= 0) {
    let shieldHits = 0;
    const shieldRadius = 116 + game.weaponRank * 3;
    for (const enemy of game.enemies) {
      const ex = enemy.x - game.player.x;
      const ey = enemy.y - game.player.y;
      const distance = Math.hypot(ex, ey) || 1;
      if (distance < shieldRadius + enemy.radius) {
        const damage = (18 + game.weaponRank * 5.5) * game.power * (enemy.boss ? 0.7 : 1);
        enemy.hp -= damage;
        enemy.flash = 0.22;
        enemy.x += (ex / distance) * 34;
        enemy.y += (ey / distance) * 34;
        shieldHits += 1;
        game.floaters.push({ id: game.nextId++, x: enemy.x, y: enemy.y - enemy.radius, text: `${Math.round(damage)}`, life: 0.48, color: "#f4d67a" });
      }
    }
    if (shieldHits > 0) {
      game.shake = Math.max(game.shake, 0.1);
      game.impactFlash = Math.max(game.impactFlash, 0.045);
      addShockwave(game, game.player.x, game.player.y, "#f4d67a", shieldRadius - 22, shieldRadius + 35, 0.24, 4);
      radialSparks(game, game.player.x, game.player.y, "#f4d67a", Math.min(18, 5 + shieldHits), 185);
    }
    game.shieldHitClock = 0.3;
  }

  for (const projectile of game.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (projectile.kind === "wave") projectile.radius += dt * 108;
    for (const enemy of game.enemies) {
      if (projectile.hit.has(enemy.id)) continue;
      const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (distance < projectile.radius + enemy.radius) {
        projectile.hit.add(enemy.id);
        enemy.hp -= projectile.damage;
        enemy.flash = 0.12;
        projectile.pierce -= 1;
        game.floaters.push({ id: game.nextId++, x: enemy.x, y: enemy.y - enemy.radius, text: `${Math.round(projectile.damage)}`, life: 0.55, color: projectile.color });
        const sparkCount = projectile.kind === "blade" ? 9 : projectile.kind === "wave" ? 6 : 4;
        for (let i = 0; i < sparkCount; i++) game.sparks.push({ id: game.nextId++, x: enemy.x, y: enemy.y, vx: (Math.random() - 0.5) * 190, vy: (Math.random() - 0.5) * 190, life: 0.3 + Math.random() * 0.22, size: 2 + Math.random() * 4, color: projectile.color });
        game.shake = Math.max(game.shake, projectile.kind === "blade" ? 0.16 : 0.07);
        game.impactFlash = Math.max(game.impactFlash, projectile.kind === "blade" ? 0.07 : 0.035);
        if (projectile.kind !== "shot" || Math.random() < 0.22) addShockwave(game, enemy.x, enemy.y, projectile.color, 5, enemy.radius + 25, 0.2, 3);
        if (projectile.pierce < 0) projectile.life = 0;
      }
    }
  }

  const dead = game.enemies.filter((enemy) => enemy.hp <= 0);
  for (const enemy of dead) {
    game.combo = game.comboClock > 0 ? game.combo + 1 : 1;
    game.comboClock = 1.7;
    game.comboBest = Math.max(game.comboBest, game.combo);
    game.kills += 1;
    const chainBonus = 1 + Math.min(50, game.combo) * 0.018;
    game.score += enemy.boss ? 2500 : Math.round(enemy.maxHp * 4 * chainBonus);
    game.special = Math.min(game.specialMax, game.special + (enemy.boss ? 4 : 0.12));
    const gemCount = enemy.boss ? 18 : 1;
    for (let i = 0; i < gemCount; i++) game.gems.push({ id: game.nextId++, x: enemy.x + (Math.random() - 0.5) * 44, y: enemy.y + (Math.random() - 0.5) * 44, value: enemy.boss ? 7 : enemy.kind === "vincent" ? 3 : 1, life: 18 });
    radialSparks(game, enemy.x, enemy.y, enemy.boss ? "#ffcf70" : game.pilot.accent, enemy.boss ? 48 : 13, enemy.boss ? 390 : 205);
    addShockwave(game, enemy.x, enemy.y, enemy.boss ? "#ffcf70" : game.pilot.accent, enemy.radius * 0.35, enemy.boss ? 130 : 52, enemy.boss ? 0.72 : 0.34, enemy.boss ? 9 : 4);
    game.shake = Math.max(game.shake, enemy.boss ? 0.82 : 0.14);
    game.impactFlash = Math.max(game.impactFlash, enemy.boss ? 0.25 : 0.055);
    if (game.soundClock <= 0 && (enemy.boss || game.combo % 5 === 0)) {
      game.soundCue = "kill";
      game.soundClock = 0.14;
    }
    if (game.combo === 10 || game.combo === 25 || game.combo === 50 || (game.combo > 50 && game.combo % 25 === 0)) {
      game.floaters.push({ id: game.nextId++, x: game.player.x, y: game.player.y - 105, text: `${game.combo} CHAIN`, life: 1.15, color: game.pilot.accent });
      game.soundCue = "kill";
      game.soundClock = 0.1;
    }
  }
  game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
  game.projectiles = game.projectiles.filter((projectile) => projectile.life > 0);

  for (const gem of game.gems) {
    gem.life -= dt;
    const gx = game.player.x - gem.x;
    const gy = game.player.y - gem.y;
    const distance = Math.hypot(gx, gy) || 1;
    if (distance < game.magnet) {
      const speed = 360 + (game.magnet - distance) * 3.1;
      gem.x += (gx / distance) * speed * dt;
      gem.y += (gy / distance) * speed * dt;
    }
    if (distance < 34) {
      game.xp += gem.value;
      game.special = Math.min(game.specialMax, game.special + gem.value * 0.16);
      gem.life = 0;
    }
  }
  game.gems = game.gems.filter((gem) => gem.life > 0);
  game.sparks.forEach((spark) => { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vx *= 0.94; spark.vy *= 0.94; spark.life -= dt; });
  game.sparks = game.sparks.filter((spark) => spark.life > 0);
  game.shockwaves.forEach((wave) => { wave.life -= dt; });
  game.shockwaves = game.shockwaves.filter((wave) => wave.life > 0);
  game.floaters.forEach((floater) => { floater.y -= 25 * dt; floater.life -= dt; });
  game.floaters = game.floaters.filter((floater) => floater.life > 0);

  if (game.xp >= game.xpNext) {
    game.xp -= game.xpNext;
    game.level += 1;
    game.xpNext = Math.floor(18 + game.level * 11 + Math.pow(game.level, 1.24));
    onLevel(game);
  }
  if (game.player.hp <= 0) onFinish(false);
  if (game.elapsed >= game.duration) onFinish(true);
}

function spawnEnemy(game: GameState, boss: boolean) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 520 + Math.random() * 280;
  let kind: EnemyKind;
  if (boss) kind = "siegfried";
  else if (game.elapsed > 115 && Math.random() < 0.16) kind = "vincent";
  else if (game.elapsed > 38 && Math.random() < 0.28) kind = "gloucester";
  else kind = "sutherland";
  const data = ENEMY_DATA[kind];
  const scale = boss ? 1 + game.elapsed / 440 : 1 + game.elapsed / 260;
  game.enemies.push({ id: game.nextId++, kind, x: game.player.x + Math.cos(angle) * distance, y: game.player.y + Math.sin(angle) * distance, hp: data.hp * scale, maxHp: data.hp * scale, speed: data.speed, damage: data.damage, radius: data.radius, boss, flash: 0 });
  if (boss) game.floaters.push({ id: game.nextId++, x: game.player.x, y: game.player.y - 180, text: "WARNING // SIEGFRIED", life: 3, color: "#ff634d" });
}

function activateAbsoluteDefense(game: GameState) {
  game.shieldActive = 3.2 + game.weaponRank * 0.12;
  game.shieldClock = Math.max(7.8, 11.4 - game.weaponRank * 0.45);
  game.shieldHitClock = 0;
  game.player.invulnerable = Math.max(game.player.invulnerable, game.shieldActive);
  game.shake = Math.max(game.shake, 0.24);
  game.floaters.push({ id: game.nextId++, x: game.player.x, y: game.player.y - 90, text: "ABSOLUTE DEFENSE", life: 1.2, color: "#f4d67a" });
  addShockwave(game, game.player.x, game.player.y, "#f4d67a", 28, 148, 0.42, 6);
  radialSparks(game, game.player.x, game.player.y, "#f4d67a", 28, 245);
}

function fireAlbionMvs(game: GameState) {
  const rank = game.weaponRank;
  const range = 255 + rank * 18;
  const nearby = [...game.enemies]
    .filter((enemy) => Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) < range)
    .sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y));
  if (!nearby.length) return;
  const slashCount = Math.min(6, 2 + Math.floor((rank - 1) / 2) + Math.max(0, game.multi - 2));
  for (let i = 0; i < slashCount; i++) {
    const enemy = nearby[i % Math.min(nearby.length, Math.max(1, game.multi))];
    const baseAngle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
    const offset = (i % 2 === 0 ? -1 : 1) * (0.1 + Math.floor(i / 2) * 0.035);
    const angle = baseAngle + offset;
    const speed = 430;
    game.projectiles.push({
      id: game.nextId++,
      x: game.player.x + Math.cos(angle) * 42,
      y: game.player.y + Math.sin(angle) * 42,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: (13 + rank * 5.5) * game.power,
      radius: 54 + rank * 4,
      life: 0.34,
      maxLife: 0.34,
      color: rank >= 6 ? "#fff3a3" : "#b8edff",
      pierce: 2 + Math.floor(rank / 2),
      hit: new Set(),
      kind: "blade",
    });
  }
  game.shake = Math.max(game.shake, 0.08);
  radialSparks(game, game.player.x, game.player.y, "#80d8ff", 5 + slashCount, 145);
  if (game.soundClock <= 0) {
    game.soundCue = "slash";
    game.soundClock = 0.16;
  }
}

function fireWeapon(game: GameState) {
  const targets = [...game.enemies].sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.y) - Math.hypot(b.x - game.player.x, b.y - game.player.y)).slice(0, game.multi);
  targets.forEach((enemy, index) => {
    const dx = enemy.x - game.player.x;
    const dy = enemy.y - game.player.y;
    const distance = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx) + (index - (targets.length - 1) / 2) * 0.08;
    const rank = game.weaponRank;
    if (game.pilot.id === "kallen") {
      const speed = 270;
      game.projectiles.push({ id: game.nextId++, x: game.player.x + (dx / distance) * 28, y: game.player.y + (dy / distance) * 28, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: (23 + rank * 8) * game.power, radius: 18 + rank * 2.4, life: 0.54 + rank * 0.04, maxLife: 0.82, color: "#ff4057", pierce: 1 + Math.floor(rank / 3), hit: new Set(), kind: "wave" });
    } else if (game.pilot.id === "lelouch") {
      const speed = 560;
      game.projectiles.push({ id: game.nextId++, x: game.player.x, y: game.player.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: (25 + rank * 8.5) * game.power, radius: 10 + rank, life: 1.3, maxLife: 1.3, color: rank >= 6 ? "#f4d67a" : "#b890ff", pierce: 3 + rank, hit: new Set(), kind: "shot" });
    } else {
      const speed = 660;
      const spread = rank >= 5 ? [-0.06, 0, 0.06] : rank >= 3 ? [-0.04, 0.04] : [0];
      spread.forEach((offset) => game.projectiles.push({ id: game.nextId++, x: game.player.x, y: game.player.y, vx: Math.cos(angle + offset) * speed, vy: Math.sin(angle + offset) * speed, damage: (15 + rank * 5) * game.power, radius: 7.5 + rank * 0.35, life: 1.08, maxLife: 1.08, color: rank >= 6 ? "#fff3a3" : "#80d8ff", pierce: Math.floor(rank / 3), hit: new Set(), kind: "shot" }));
    }
  });
  if (targets.length && game.soundClock <= 0) {
    game.soundCue = "shot";
    game.soundClock = 0.14;
  }
}

function addShockwave(game: GameState, x: number, y: number, color: string, startRadius: number, endRadius: number, life: number, width: number) {
  game.shockwaves.push({ id: game.nextId++, x, y, color, startRadius, endRadius, life, maxLife: life, width });
}

function radialSparks(game: GameState, x: number, y: number, color: string, count: number, speed: number) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
    const velocity = speed * (0.45 + Math.random() * 0.55);
    game.sparks.push({ id: game.nextId++, x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: 0.45 + Math.random() * 0.55, size: 2 + Math.random() * 5, color });
  }
}

function drawGame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, game: GameState, images: Map<PilotId, HTMLImageElement>) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const shakeX = game.shake > 0 ? (Math.random() - 0.5) * 11 * game.shake : 0;
  const shakeY = game.shake > 0 ? (Math.random() - 0.5) * 11 * game.shake : 0;
  const cameraX = game.player.x - width / 2 - shakeX;
  const cameraY = game.player.y - height / 2 - shakeY;
  ctx.clearRect(0, 0, width, height);
  drawArena(ctx, width, height, cameraX, cameraY, game.elapsed);
  const sx = (x: number) => x - cameraX;
  const sy = (y: number) => y - cameraY;

  for (const gem of game.gems) {
    const x = sx(gem.x); const y = sy(gem.y);
    if (x < -30 || x > width + 30 || y < -30 || y > height + 30) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(game.elapsed * 2 + gem.id); ctx.shadowBlur = 16; ctx.shadowColor = "#7effee"; ctx.fillStyle = "#78ffe1"; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 0); ctx.lineTo(0, 8); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  for (const wave of game.shockwaves) {
    const progress = 1 - wave.life / wave.maxLife;
    const radius = wave.startRadius + (wave.endRadius - wave.startRadius) * (1 - Math.pow(1 - progress, 3));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.max(0, (1 - progress) * 0.82);
    ctx.strokeStyle = wave.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = wave.color;
    ctx.lineWidth = wave.width * (1 - progress * 0.55);
    ctx.beginPath();
    ctx.arc(sx(wave.x), sy(wave.y), radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const enemy of game.enemies) drawEnemy(ctx, sx(enemy.x), sy(enemy.y), enemy, game.elapsed);
  for (const projectile of game.projectiles) drawProjectile(ctx, sx(projectile.x), sy(projectile.y), projectile);
  for (const spark of game.sparks) {
    ctx.globalAlpha = Math.max(0, Math.min(1, spark.life * 1.8)); ctx.fillStyle = spark.color; ctx.shadowBlur = 9; ctx.shadowColor = spark.color; ctx.fillRect(sx(spark.x) - spark.size / 2, sy(spark.y) - spark.size / 2, spark.size, spark.size); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  drawPlayer(ctx, width / 2 + shakeX, height / 2 + shakeY, game, images.get(game.pilot.id));
  for (const floater of game.floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, floater.life * 1.7)); ctx.font = floater.text.length > 8 ? "700 17px Arial" : "800 15px Arial"; ctx.textAlign = "center"; ctx.fillStyle = floater.color; ctx.shadowBlur = 10; ctx.shadowColor = floater.color; ctx.fillText(floater.text, sx(floater.x), sy(floater.y)); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  if (game.hitPulse > 0) { ctx.fillStyle = `rgba(255,30,62,${game.hitPulse * 0.24})`; ctx.fillRect(0, 0, width, height); }
  if (game.impactFlash > 0) { ctx.fillStyle = `rgba(225,248,255,${Math.min(0.16, game.impactFlash * 0.72)})`; ctx.fillRect(0, 0, width, height); }
}

function drawArena(ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number, cameraY: number, elapsed: number) {
  ctx.fillStyle = "#071018"; ctx.fillRect(0, 0, width, height);
  const grid = 80;
  const ox = ((-cameraX % grid) + grid) % grid;
  const oy = ((-cameraY % grid) + grid) % grid;
  ctx.lineWidth = 1;
  for (let x = ox; x < width; x += grid) { ctx.strokeStyle = x % (grid * 4) < 2 ? "rgba(106,207,255,.14)" : "rgba(106,207,255,.055)"; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = oy; y < height; y += grid) { ctx.strokeStyle = y % (grid * 4) < 2 ? "rgba(106,207,255,.14)" : "rgba(106,207,255,.055)"; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  const tile = 420;
  const startX = Math.floor(cameraX / tile) - 1;
  const startY = Math.floor(cameraY / tile) - 1;
  for (let tx = startX; tx < startX + Math.ceil(width / tile) + 3; tx++) {
    for (let ty = startY; ty < startY + Math.ceil(height / tile) + 3; ty++) {
      const random = mulberry32((tx * 73856093) ^ (ty * 19349663));
      if (random() < 0.36) continue;
      const x = tx * tile - cameraX + 80 + random() * 130;
      const y = ty * tile - cameraY + 65 + random() * 130;
      const w = 72 + random() * 105;
      const h = 45 + random() * 78;
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = "rgba(17,32,43,.88)"; ctx.strokeStyle = "rgba(119,202,224,.12)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(227,65,80,.16)"; for (let i = -w / 2 + 12; i < w / 2; i += 22) ctx.fillRect(i, -h / 2 + 8, 9, 3);
      ctx.restore();
    }
  }
  const pulse = (Math.sin(elapsed * 0.6) + 1) / 2;
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) * 0.7); gradient.addColorStop(0, "rgba(22,83,105,.07)"); gradient.addColorStop(1, `rgba(255,28,60,${0.035 + pulse * 0.025})`); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
}

function drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, enemy: Enemy, time: number) {
  const data = ENEMY_DATA[enemy.kind];
  ctx.save(); ctx.translate(x, y); const angle = Math.atan2(y - ctx.canvas.height / 2, x - ctx.canvas.width / 2); ctx.rotate(angle + Math.PI / 2); ctx.shadowBlur = enemy.flash > 0 ? 25 : 10; ctx.shadowColor = enemy.flash > 0 ? "#ffffff" : data.color; ctx.strokeStyle = enemy.flash > 0 ? "#ffffff" : data.color; ctx.fillStyle = enemy.flash > 0 ? "#ffffff" : `${data.color}bb`; ctx.lineWidth = enemy.boss ? 5 : 3;
  if (enemy.kind === "siegfried") {
    ctx.rotate(time * 0.18); ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const r = i % 2 ? 32 : 50; const px = Math.cos(a) * r; const py = Math.sin(a) * r; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#2b1a1c"; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(0, -enemy.radius - 6); ctx.lineTo(enemy.radius * .68, -enemy.radius * .25); ctx.lineTo(enemy.radius * .88, enemy.radius * .45); ctx.lineTo(enemy.radius * .34, enemy.radius * .30); ctx.lineTo(enemy.radius * .38, enemy.radius + 5); ctx.lineTo(0, enemy.radius * .65); ctx.lineTo(-enemy.radius * .38, enemy.radius + 5); ctx.lineTo(-enemy.radius * .34, enemy.radius * .30); ctx.lineTo(-enemy.radius * .88, enemy.radius * .45); ctx.lineTo(-enemy.radius * .68, -enemy.radius * .25); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (enemy.kind === "gloucester") { ctx.beginPath(); ctx.moveTo(0, -enemy.radius); ctx.lineTo(0, -enemy.radius - 22); ctx.stroke(); }
    if (enemy.kind === "vincent") { ctx.beginPath(); ctx.moveTo(-enemy.radius, 4); ctx.lineTo(-enemy.radius - 16, 16); ctx.moveTo(enemy.radius, 4); ctx.lineTo(enemy.radius + 16, 16); ctx.stroke(); }
    ctx.fillStyle = "#050b10"; ctx.fillRect(-5, -enemy.radius * .55, 10, 10); ctx.fillStyle = "#ff4057"; ctx.fillRect(-3, -enemy.radius * .48, 6, 2);
  }
  ctx.restore();
  if (enemy.boss) { ctx.fillStyle = "rgba(4,8,12,.8)"; ctx.fillRect(x - 58, y - 68, 116, 7); ctx.fillStyle = data.color; ctx.fillRect(x - 58, y - 68, 116 * Math.max(0, enemy.hp / enemy.maxHp), 7); ctx.fillStyle = "#fff"; ctx.font = "700 10px Arial"; ctx.textAlign = "center"; ctx.fillText(data.label, x, y - 75); }
}

function drawProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, projectile: Projectile) {
  ctx.save(); ctx.translate(x, y); ctx.shadowBlur = 18; ctx.shadowColor = projectile.color; ctx.strokeStyle = projectile.color; ctx.fillStyle = projectile.color;
  if (projectile.kind === "wave") { ctx.globalAlpha = Math.max(0.18, projectile.life / projectile.maxLife); ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2); ctx.stroke(); }
  else if (projectile.kind === "blade") {
    const angle = Math.atan2(projectile.vy, projectile.vx);
    const progress = 1 - projectile.life / projectile.maxLife;
    ctx.rotate(angle + (progress - 0.5) * 0.85);
    ctx.globalAlpha = Math.max(0.12, projectile.life / projectile.maxLife);
    ctx.lineCap = "round";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius, -1.16, 1.16);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius + 1, -1.1, 1.1);
    ctx.stroke();
  } else {
    const angle = Math.atan2(projectile.vy, projectile.vx);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = projectile.color;
    ctx.fillRect(-projectile.radius * 5.5, -projectile.radius * 0.75, projectile.radius * 6.2, projectile.radius * 1.5);
    ctx.globalAlpha = 0.94;
    ctx.fillRect(-projectile.radius * 2.5, -projectile.radius / 2, projectile.radius * 3.5, projectile.radius);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, -1, projectile.radius * 1.7, 2);
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, game: GameState, image?: HTMLImageElement) {
  ctx.save(); ctx.translate(x, y);
  if ((game.shieldActive > 0 || game.player.invulnerable > 0) && game.pilot.id === "lelouch") {
    const active = game.shieldActive > 0;
    const shieldRadius = 82 + game.weaponRank * 2 + Math.sin(game.elapsed * 6) * 3;
    ctx.strokeStyle = active ? "rgba(255,226,131,.92)" : "rgba(231,202,113,.58)";
    ctx.fillStyle = active ? "rgba(244,214,122,.095)" : "rgba(244,214,122,.04)";
    ctx.lineWidth = active ? 4 : 2;
    ctx.shadowBlur = active ? 32 : 18;
    ctx.shadowColor = "#d7b85b";
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 3 + game.elapsed * (active ? 0.42 : 0.18));
      ctx.beginPath();
      ctx.roundRect(shieldRadius - 18, -23, 39, 46, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (active) {
      ctx.globalAlpha = 0.48;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius + 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  const pulse = 1 + Math.sin(game.elapsed * 5) * .025;
  ctx.scale(pulse, pulse); ctx.globalAlpha = game.player.invulnerable > 0 && Math.floor(game.elapsed * 18) % 2 ? 0.58 : 1; ctx.shadowBlur = game.player.boost > 0 ? 38 : 20; ctx.shadowColor = game.pilot.accent;
  if (image?.complete && image.naturalWidth) { const ratio = image.naturalWidth / image.naturalHeight; const h = 116; const w = h * ratio; ctx.drawImage(image, -w / 2, -h / 2, w, h); }
  else { ctx.fillStyle = game.pilot.accent; ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(30, -10); ctx.lineTo(22, 37); ctx.lineTo(0, 26); ctx.lineTo(-22, 37); ctx.lineTo(-30, -10); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
