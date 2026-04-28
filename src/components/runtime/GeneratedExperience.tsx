"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppConfig, PageConfig } from "@/types/config.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Sparkles } from "lucide-react";

interface GeneratedExperienceProps {
  page: PageConfig;
  appConfig: AppConfig;
}

type GameStatus = "ready" | "playing" | "over";

export default function GeneratedExperience({ page, appConfig }: GeneratedExperienceProps) {
  if (page.experience?.kind === "flappy-bird") {
    return <FlappyBirdExperience page={page} appConfig={appConfig} />;
  }

  return <LandingExperience page={page} appConfig={appConfig} />;
}

function LandingExperience({ page, appConfig }: GeneratedExperienceProps) {
  const experience = page.experience;
  const features = experience?.features?.length
    ? experience.features
    : ["Generated interface", "Responsive layout", "Admin data model"];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-700/30 bg-slate-950">
      <section className="relative min-h-[520px] px-6 py-10 sm:px-10 lg:px-14 flex flex-col justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.22),transparent_32%),linear-gradient(135deg,#0f172a,#111827_48%,#042f2e)]" />
        <div className="relative z-10 max-w-3xl">
          <Badge className="mb-5 bg-teal-400/15 text-teal-200 border-teal-300/20">Generated Site</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            {experience?.headline ?? appConfig.app.name}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
            {experience?.subheadline ?? appConfig.app.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="bg-teal-400 text-slate-950 hover:bg-teal-300 font-semibold">
              {experience?.cta ?? "Get Started"}
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
              View Dashboard
            </Button>
          </div>
        </div>
        <div className="relative z-10 grid md:grid-cols-3 gap-3 mt-10">
          {features.map((feature) => (
            <div key={feature} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
              <Sparkles className="w-4 h-4 text-teal-200 mb-3" />
              <p className="text-sm font-medium text-white">{feature}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FlappyBirdExperience({ page, appConfig }: GeneratedExperienceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const statusRef = useRef<GameStatus>("ready");
  const birdRef = useRef({ y: 240, velocity: 0 });
  const pipesRef = useRef([{ x: 850, gapY: 220, scored: false }]);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<GameStatus>("ready");

  const syncStatus = useCallback((nextStatus: GameStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const resetGame = useCallback(() => {
    scoreRef.current = 0;
    birdRef.current = { y: 240, velocity: -7 };
    pipesRef.current = [{ x: 850, gapY: 210 + Math.random() * 120, scored: false }];
    setScore(0);
    syncStatus("playing");
  }, [syncStatus]);

  const jump = useCallback(() => {
    if (statusRef.current !== "playing") {
      resetGame();
      return;
    }
    birdRef.current.velocity = -7.6;
  }, [resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const gap = 154;
    const pipeWidth = 72;
    const birdX = 170;

    const drawBird = () => {
      const bird = birdRef.current;
      ctx.save();
      ctx.translate(birdX, bird.y);
      ctx.rotate(Math.max(-0.45, Math.min(0.65, bird.velocity / 13)));
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(22, -2);
      ctx.lineTo(43, 8);
      ctx.lineTo(22, 17);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(9, -8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(-18, -24);
      ctx.lineTo(-10, -47);
      ctx.lineTo(0, -27);
      ctx.lineTo(12, -48);
      ctx.lineTo(20, -24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#38bdf8");
      gradient.addColorStop(0.62, "#86efac");
      gradient.addColorStop(1, "#14532d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255,255,255,0.78)";
      for (let i = 0; i < 5; i += 1) {
        const x = (i * 190 + scoreRef.current * 8) % (width + 130) - 80;
        ctx.beginPath();
        ctx.ellipse(x, 70 + (i % 2) * 52, 46, 16, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 35, 66 + (i % 2) * 52, 34, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const pipe of pipesRef.current) {
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY - gap / 2);
        ctx.fillRect(pipe.x, pipe.gapY + gap / 2, pipeWidth, height - pipe.gapY);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(pipe.x - 7, pipe.gapY - gap / 2 - 22, pipeWidth + 14, 22);
        ctx.fillRect(pipe.x - 7, pipe.gapY + gap / 2, pipeWidth + 14, 22);
      }

      drawBird();

      ctx.fillStyle = "rgba(15,23,42,0.70)";
      ctx.fillRect(0, height - 54, width, 54);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 24px Inter, Arial";
      ctx.fillText(`Score ${scoreRef.current}`, 24, 42);
      ctx.font = "600 16px Inter, Arial";
      ctx.fillText("Click or press Space to fly", 24, height - 21);

      if (statusRef.current !== "playing") {
        ctx.fillStyle = "rgba(15,23,42,0.72)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 42px Inter, Arial";
        ctx.textAlign = "center";
        ctx.fillText(statusRef.current === "over" ? "Game Over" : "Flappy Crown", width / 2, 215);
        ctx.font = "500 18px Inter, Arial";
        ctx.fillText("Click Start or press Space", width / 2, 252);
        ctx.textAlign = "start";
      }
    };

    const tick = () => {
      if (statusRef.current === "playing") {
        const bird = birdRef.current;
        bird.velocity += 0.38;
        bird.y += bird.velocity;

        for (const pipe of pipesRef.current) {
          pipe.x -= 3.1;
          if (!pipe.scored && pipe.x + pipeWidth < birdX) {
            pipe.scored = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
        }

        const lastPipe = pipesRef.current[pipesRef.current.length - 1];
        if (lastPipe.x < 470) {
          pipesRef.current.push({ x: width + 20, gapY: 150 + Math.random() * 230, scored: false });
        }
        pipesRef.current = pipesRef.current.filter((pipe) => pipe.x > -100);

        const hitPipe = pipesRef.current.some((pipe) => {
          const withinX = birdX + 21 > pipe.x && birdX - 21 < pipe.x + pipeWidth;
          const outsideGap = bird.y - 21 < pipe.gapY - gap / 2 || bird.y + 21 > pipe.gapY + gap / 2;
          return withinX && outsideGap;
        });

        if (bird.y > height - 78 || bird.y < 20 || hitPipe) {
          bestRef.current = Math.max(bestRef.current, scoreRef.current);
          setBest(bestRef.current);
          syncStatus("over");
        }
      }

      draw();
      frameRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [syncStatus]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jump]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">
            {page.experience?.headline ?? appConfig.app.name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {page.experience?.subheadline ?? appConfig.app.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30">Score {score}</Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-300">Best {best}</Badge>
          <Button onClick={resetGame} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            {status === "playing" ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {status === "playing" ? "Restart" : "Start"}
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-700/30 bg-gray-950 p-3">
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          onClick={jump}
          className="w-full aspect-[900/520] rounded-xl cursor-pointer"
        />
      </div>
    </div>
  );
}
