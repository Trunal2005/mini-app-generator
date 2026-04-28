"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Zap, Github } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, name: data.name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Registration failed");
        return;
      }
      // Auto sign in
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        callbackUrl: "/dashboard",
        redirect: true,
      });
      router.push("/dashboard");
    } catch {
      setError("Network error — please try again");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0b1326]">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AppForge
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-gray-400 text-sm mb-8">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>

        {error && (
          <Alert className="border-red-500/30 bg-red-500/10 mb-6">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300 text-sm">Full Name (optional)</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="John Doe"
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 h-11"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="you@example.com"
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 h-11"
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300 text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 h-11"
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 h-11"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700/50" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-500">
            <span className="bg-[#0b1326] px-3">or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={async () => { setGithubLoading(true); await signIn("github", { callbackUrl: "/dashboard" }); }}
          disabled={githubLoading}
          className="w-full h-11 border-gray-600 bg-gray-800/30 text-gray-300 hover:bg-gray-700/50 hover:text-white gap-2"
        >
          {githubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
          Continue with GitHub
        </Button>

        <p className="mt-6 text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
