"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "./ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Instagram,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  BarChart3
} from "lucide-react";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      onLogin(email, password);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-cyan-700 p-12 flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">ReelCraft</h1>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Create Viral Content
              <br />
              <span className="text-teal-100">Automatically</span>
            </h2>
            <p className="text-teal-100 text-lg leading-relaxed">
              Transform your Instagram presence with AI-powered reel generation.
              Choose from viral templates, customize captions, and watch your engagement soar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Zap className="h-8 w-8 text-teal-200 mb-3" />
              <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
              <p className="text-teal-100 text-sm">Generate reels in seconds with our AI engine</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <TrendingUp className="h-8 w-8 text-teal-200 mb-3" />
              <h3 className="text-white font-semibold mb-2">Viral Ready</h3>
              <p className="text-teal-100 text-sm">Templates designed for maximum engagement</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Users className="h-8 w-8 text-teal-200 mb-3" />
              <h3 className="text-white font-semibold mb-2">Multi-Account</h3>
              <p className="text-teal-100 text-sm">Manage multiple Instagram accounts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <BarChart3 className="h-8 w-8 text-teal-200 mb-3" />
              <h3 className="text-white font-semibold mb-2">Analytics</h3>
              <p className="text-teal-100 text-sm">Track performance and optimize content</p>
            </div>
          </div>
        </div>

        <div className="text-teal-100 text-sm">
          © 2025 ReelCraft. Transform your social media presence.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ReelCraft</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account to continue creating amazing content</p>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 h-11 border-gray-300 hover:bg-gray-50"
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Continue with Instagram
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="#" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign up for free
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
