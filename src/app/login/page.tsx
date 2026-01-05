"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

function FloatingCards() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating kanban cards - positioned at edges to avoid center content */}
      <div
        className="absolute top-[8%] left-[3%] w-44 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-slow opacity-60"
        style={{ animationDelay: "0s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs text-text-muted">In Progress</span>
        </div>
        <p className="text-sm text-text-primary font-medium">
          Design new landing
        </p>
        <div className="mt-2 flex gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
            UI
          </span>
        </div>
      </div>

      <div
        className="absolute top-[12%] right-[2%] w-40 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-medium opacity-60"
        style={{ animationDelay: "0.5s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-text-muted">Complete</span>
        </div>
        <p className="text-sm text-text-primary font-medium">Ship v2.0</p>
      </div>

      <div
        className="absolute bottom-[8%] left-[5%] w-48 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-fast opacity-60"
        style={{ animationDelay: "1s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-text-muted" />
          <span className="text-xs text-text-muted">Todo</span>
        </div>
        <p className="text-sm text-text-primary font-medium">
          Write documentation
        </p>
        <p className="text-xs text-text-dim mt-1 line-clamp-2">
          Add examples and API reference
        </p>
      </div>

      <div
        className="absolute bottom-[12%] right-[3%] w-36 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-slow opacity-60"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs text-text-muted">In Progress</span>
        </div>
        <p className="text-sm text-text-primary font-medium">Code review</p>
      </div>
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px] animate-pulse-slower" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

function FeatureShowcase() {
  const features = [
    { icon: "⚡", text: "Kanban boards" },
    { icon: "✓", text: "Quick tasks" },
    { icon: "📝", text: "Project notes" },
    { icon: "🔄", text: "Real-time sync" },
  ];

  return (
    <div className="hidden lg:flex relative flex-col justify-center items-center flex-1 bg-background-elevated p-12 overflow-hidden">
      <AmbientBackground />
      <FloatingCards />

      {/* Content */}
      <div className="relative z-10 max-w-md text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg">
              <svg
                className="w-7 h-7 text-background"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="absolute -inset-2 bg-accent/30 rounded-3xl blur-xl -z-10 animate-pulse-slow" />
          </div>
        </div>

        {/* Tagline */}
        <h1
          className="text-4xl md:text-5xl font-semibold text-text-primary mb-4 animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          Heya,
          <br />
          <span className="font-display italic text-accent">
            this is my project management tool I made
          </span>
        </h1>

        <p
          className="text-lg text-text-secondary mb-10 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          The project space for creatives who move fast and stay organized.
        </p>

        {/* Feature pills */}
        <div
          className="flex flex-wrap justify-center gap-3 animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          {features.map((feature, i) => (
            <div
              key={feature.text}
              className="flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-sm border border-border/50 rounded-full text-sm text-text-secondary"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <span>{feature.icon}</span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Left side - Feature showcase */}
      <FeatureShowcase />

      {/* Right side - Login form */}
      <div className="flex-1 lg:max-w-xl flex flex-col justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-10 animate-fade-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
              <svg
                className="w-6 h-6 text-background"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="absolute -inset-1 bg-accent/20 rounded-xl blur-md -z-10" />
          </div>
          <h1 className="text-2xl tracking-tight">
            <span className="font-semibold text-text-primary">vibe</span>
            <span className="font-display italic text-accent">flow</span>
          </h1>
        </div>

        {/* Mobile tagline */}
        <div className="lg:hidden text-center mb-10 animate-fade-in-up">
          <h2 className="text-2xl font-semibold text-text-primary mb-2">
            Ship ideas,{" "}
            <span className="font-display italic text-accent">
              not spreadsheets
            </span>
          </h2>
          <p className="text-sm text-text-muted">
            Project management for creatives
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              Welcome back
            </h2>
            <p className="text-text-muted mb-8">
              Sign in to continue to your projects
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger animate-fade-in">
                {error}
              </div>
            )}

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "150ms" }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm",
                  "text-text-primary placeholder:text-text-dim",
                  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
                  "transition-all duration-200"
                )}
                placeholder="you@example.com"
              />
            </div>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={cn(
                  "w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm",
                  "text-text-primary placeholder:text-text-dim",
                  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
                  "transition-all duration-200"
                )}
                placeholder="Enter your password"
              />
            </div>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "250ms" }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200",
                  "bg-accent text-background hover:bg-accent-hover",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30",
                  "transform hover:-translate-y-0.5 active:translate-y-0"
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <p
            className="mt-8 text-center text-sm text-text-muted animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-accent hover:text-accent-hover font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
