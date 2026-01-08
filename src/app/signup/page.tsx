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
        className="absolute top-[6%] left-[4%] w-48 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-medium opacity-60"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-text-muted">Complete</span>
        </div>
        <p className="text-sm text-text-primary font-medium">Launch MVP</p>
        <div className="mt-2 flex gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success">
            Done
          </span>
        </div>
      </div>

      <div
        className="absolute top-[10%] right-[3%] w-44 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-slow opacity-60"
        style={{ animationDelay: "0.7s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs text-text-muted">In Progress</span>
        </div>
        <p className="text-sm text-text-primary font-medium">User testing</p>
      </div>

      <div
        className="absolute bottom-[10%] left-[3%] w-40 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-fast opacity-60"
        style={{ animationDelay: "1.2s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-text-muted" />
          <span className="text-xs text-text-muted">Todo</span>
        </div>
        <p className="text-sm text-text-primary font-medium">Scale to 1M</p>
      </div>

      <div
        className="absolute bottom-[6%] right-[4%] w-36 bg-surface border border-border rounded-xl p-3 shadow-lg animate-float-medium opacity-60"
        style={{ animationDelay: "0.4s" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-xs text-text-muted">In Progress</span>
        </div>
        <p className="text-sm text-text-primary font-medium">Add dark mode</p>
      </div>
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs - different positions */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px] animate-pulse-slower" />

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
  const benefits = [
    { title: "Drag & drop", desc: "Move cards between columns effortlessly" },
    { title: "Multi-device", desc: "Access your projects anywhere" },
    { title: "Lightning fast", desc: "Built for speed, not complexity" },
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
          Your ideas,
          <br />
          <span className="font-display italic text-accent">in flow</span>
        </h1>

        <p
          className="text-lg text-text-secondary mb-12 animate-fade-in-up"
          style={{ animationDelay: "200ms" }}
        >
          Join thousands of creators who ship faster with Vibeflow.
        </p>

        {/* Benefits list */}
        <div
          className="space-y-4 text-left animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          {benefits.map((benefit, i) => (
            <div
              key={benefit.title}
              className="flex items-start gap-3 p-3 bg-surface/40 backdrop-blur-sm border border-border/30 rounded-xl"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {benefit.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);

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

      {/* Right side - Signup form */}
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
            Your ideas,{" "}
            <span className="font-display italic text-accent">in flow</span>
          </h2>
          <p className="text-sm text-text-muted"></p>
        </div>

        {/* Form */}
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              Create your account
            </h2>
            <p className="text-text-muted mb-8">
              Move that a*s off the ground and get things done.
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
                placeholder="At least 6 characters"
              />
            </div>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "250ms" }}
            >
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className={cn(
                  "w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-sm",
                  "text-text-primary placeholder:text-text-dim",
                  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
                  "transition-all duration-200"
                )}
                placeholder="Confirm your password"
              />
            </div>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
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
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </div>

            <p
              className="text-xs text-text-dim text-center animate-fade-in-up"
              style={{ animationDelay: "350ms" }}
            >
              By signing up, you agree to our terms of service and privacy
              policy.
            </p>
          </form>

          <p
            className="mt-8 text-center text-sm text-text-muted animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-accent hover:text-accent-hover font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
