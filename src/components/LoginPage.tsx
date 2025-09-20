"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "./ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Instagram,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  AlertCircle
} from "lucide-react";

export const LoginPage = () => {
  const { login, register, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read error from URL parameters on component mount
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      // Clean the URL by removing the error parameter
      router.replace('/');
    }
  }, [searchParams, router]);

  const handleSubmit = async () => {
    setError(null);
    
    // Test with a simple validation error first
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      if (isRegistering) {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          setError("Please fill in all fields");
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
        const result = await register(formData.email, formData.password, fullName);
        
        if (result.success) {
          // Success - let the ProtectedRoute handle the redirect naturally
          return;
        } else {
          // Redirect to login page with error parameter
          const errorMessage = result.error || "Registration failed";
          router.push(`/?error=${encodeURIComponent(errorMessage)}`);
          return;
        }
      } else {
        const result = await login(formData.email, formData.password);
        
        if (result.success) {
          // Success - let the ProtectedRoute handle the redirect naturally
          return;
        } else {
          // Redirect to login page with error parameter
          const errorMessage = result.error || "Login failed";
          router.push(`/?error=${encodeURIComponent(errorMessage)}`);
          return;
        }
      }
    } catch {
      // Redirect to login page with error parameter
      router.push(`/?error=${encodeURIComponent("An unexpected error occurred")}`);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen bg-teal-50 flex flex-col lg:flex-row">
      {/* Left Side - Branding - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-600 p-8 xl:p-12 flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-white rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 xl:h-6 xl:w-6 text-teal-600" />
          </div>
          <h1 className="text-xl xl:text-2xl font-bold text-white">ReelCraft</h1>
        </div>

        <div className="space-y-6 xl:space-y-8">
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4">
              Create Viral Content
              <br />
              <span className="text-teal-100">Automatically</span>
            </h2>
            <p className="text-teal-100 text-base xl:text-lg leading-relaxed">
              Transform your Instagram presence with AI-powered reel generation.
              Choose from viral templates, customize captions, and watch your engagement soar.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 xl:p-6">
              <Zap className="h-6 w-6 xl:h-8 xl:w-8 text-teal-200 mb-2 xl:mb-3" />
              <h3 className="text-white font-semibold mb-1 xl:mb-2 text-sm xl:text-base">Lightning Fast</h3>
              <p className="text-teal-100 text-xs xl:text-sm">Generate reels in seconds with our AI engine</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 xl:p-6">
              <TrendingUp className="h-6 w-6 xl:h-8 xl:w-8 text-teal-200 mb-2 xl:mb-3" />
              <h3 className="text-white font-semibold mb-1 xl:mb-2 text-sm xl:text-base">Viral Ready</h3>
              <p className="text-teal-100 text-xs xl:text-sm">Templates designed for maximum engagement</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 xl:p-6">
              <Users className="h-6 w-6 xl:h-8 xl:w-8 text-teal-200 mb-2 xl:mb-3" />
              <h3 className="text-white font-semibold mb-1 xl:mb-2 text-sm xl:text-base">Multi-Account</h3>
              <p className="text-teal-100 text-xs xl:text-sm">Manage multiple Instagram accounts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 xl:p-6">
              <BarChart3 className="h-6 w-6 xl:h-8 xl:w-8 text-teal-200 mb-2 xl:mb-3" />
              <h3 className="text-white font-semibold mb-1 xl:mb-2 text-sm xl:text-base">Analytics</h3>
              <p className="text-teal-100 text-xs xl:text-sm">Track performance and optimize content</p>
            </div>
          </div>
        </div>

        <div className="text-teal-100 text-xs xl:text-sm">
          © 2025 ReelCraft. Transform your social media presence.
        </div>
      </div>

      {/* Right Side - Login Form - Responsive */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-0 lg:min-h-0">
        <div className="w-full max-w-md space-y-4 sm:space-y-6 py-4 sm:py-6">
          <div className="text-center">
            {/* Mobile Logo - Only shown on small screens */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white border-2 border-teal-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ReelCraft</h1>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base px-2">
              {isRegistering 
                ? 'Sign up to start creating amazing content' 
                : 'Sign in to your account to continue creating amazing content'
              }
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl text-center">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-center text-xs sm:text-sm lg:text-base">
                {isRegistering 
                  ? 'Fill in your details to get started'
                  : 'Enter your credentials to access your dashboard'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {isRegistering && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="firstName" className="text-xs sm:text-sm lg:text-base">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-9 sm:h-10 lg:h-11 text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="lastName" className="text-xs sm:text-sm lg:text-base">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-9 sm:h-10 lg:h-11 text-sm"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm lg:text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-9 sm:h-10 lg:h-11 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm lg:text-base">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isRegistering ? "Create a strong password" : "Enter your password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-9 sm:h-10 lg:h-11 pr-10 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isRegistering && (
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm lg:text-base">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-9 sm:h-10 lg:h-11 text-sm"
                      required
                    />
                  </div>
                )}

                {!isRegistering && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-xs sm:text-sm">
                      <input type="checkbox" className="rounded border-gray-300 w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-gray-600">Remember me</span>
                    </label>
                    <a href="#" className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium">
                      Forgot password?
                    </a>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm flex items-center space-x-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full h-9 sm:h-10 lg:h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent" />
                      <span>{isRegistering ? 'Creating Account...' : 'Signing In...'}</span>
                    </div>
                  ) : (
                    isRegistering ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </div>

              {!isRegistering && (
                <div className="mt-3 sm:mt-4 lg:mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2 sm:mt-3 lg:mt-4 h-9 sm:h-10 lg:h-11 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm"
                  >
                    <Instagram className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Continue with Instagram
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs sm:text-sm text-gray-600 px-2">
            {isRegistering ? (
              <>
                Already have an account?{" "}
                <button 
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Sign in here
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button 
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Sign up for free
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
