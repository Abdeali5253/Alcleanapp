import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import {
  User,
  LogOut,
  Bell,
  HelpCircle,
  ChevronRight,
  Info,
  MessageCircle,
  LogIn,
  Settings,
  Package,
  Eye,
  EyeOff,
  Mail,
  Phone as PhoneIcon,
  Lock,
  Heart,
  Loader2,
  Trash2,
} from "lucide-react";
import { authService, User as AuthUser } from "../lib/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { UnifiedHeader } from "./UnifiedHeader";

const menuItems = [
  {
    icon: Package,
    label: "My Orders",
    description: "View your order history",
    link: "/tracking",
  },
  {
    icon: Heart,
    label: "My Wishlist",
    description: "Your favorite products",
    link: "/wishlist",
  },
  {
    icon: User,
    label: "Edit Profile",
    description: "Update your personal information",
    link: "/edit-profile",
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Notification preferences",
    link: "/notifications",
  },
  {
    icon: HelpCircle,
    label: "Help & Support",
    description: "FAQs and support",
    link: "/help-support",
  },
  {
    icon: Info,
    label: "About Us",
    description: "Learn more about AlClean",
    link: "/about",
  },
  {
    icon: MessageCircle,
    label: "Contact Us",
    description: "Get in touch with us",
    link: "/contact",
  },
];

export function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [deletionStep, setDeletionStep] = useState<0 | 1 | 2>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const googleLoginInFlightRef = useRef(false);
  const appleLoginInFlightRef = useRef(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const unsubscribe = authService.subscribe((newUser) => {
      setUser(newUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoggingIn(true);

    try {
      await authService.logIn(email, password);

      const redirectPath = authService.getRedirectAfterLogin();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error: any) {
      toast.error(
        error.message || "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !email || !password) {
      toast.error("Please fill all required fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoggingIn(true);

    try {
      await authService.signUp(email, password, firstName, lastName, phone);

      const redirectPath = authService.getRedirectAfterLogin();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoggingIn(true);

    try {
      await authService.requestPasswordReset(email);
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoginInFlightRef.current) return;

    googleLoginInFlightRef.current = true;
    setIsLoggingIn(true);
    setIsGoogleLoading(true);

    try {
      const result = await authService.googleLogin();
      let isSuccessful = result.success;

      if (!result.success && result.requiresOverride) {
        const confirmed = window.confirm(
          `${result.error}\n\nDo you want to override this existing password account and continue with Google?`,
        );
        if (confirmed) {
          const overrideResult = await authService.googleLogin(true);
          if (!overrideResult.success) {
            return;
          }
          isSuccessful = true;
        } else {
          return;
        }
      } else if (!result.success) {
        return;
      }

      if (isSuccessful) {
        const redirectPath = authService.getRedirectAfterLogin();
        if (redirectPath) {
          navigate(redirectPath);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Google login failed. Please try again.");
    } finally {
      googleLoginInFlightRef.current = false;
      setIsGoogleLoading(false);
      setIsLoggingIn(false);
    }
  };

  const handleAppleLogin = async () => {
    if (appleLoginInFlightRef.current) return;
    appleLoginInFlightRef.current = true;
    setIsLoggingIn(true);
    setIsAppleLoading(true);
    try {
      const result = await authService.appleLogin();
      let isSuccessful = result.success;
      if (!result.success && result.requiresOverride) {
        const confirmed = window.confirm(
          `${result.error}\n\nDo you want to use Sign in with Apple for this existing account?`,
        );
        if (!confirmed) return;
        const overrideResult = await authService.appleLogin(true);
        if (!overrideResult.success) return;
        isSuccessful = true;
      } else if (!result.success) {
        return;
      }
      if (isSuccessful) {
        const redirectPath = authService.getRedirectAfterLogin();
        if (redirectPath) navigate(redirectPath);
      }
    } catch (error: any) {
      toast.error(error.message || "Apple login failed. Please try again.");
    } finally {
      appleLoginInFlightRef.current = false;
      setIsAppleLoading(false);
      setIsLoggingIn(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await authService.deleteAccount();
      setDeletionStep(0);
      navigate("/account", { replace: true });
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("cancel")) {
        toast.info("Account deletion cancelled");
      } else {
        toast.error(message || "Account deletion could not be completed. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigate("/checkout");
  };

  const handleLogout = async () => {
    await authService.logOut();
  };

  // Forgot Password Form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />

        <main className="max-w-md mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#6DB33F]/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-[#6DB33F]" />
              </div>
              <h1 className="text-gray-900 text-2xl mb-2">Reset Password</h1>
              <p className="text-gray-600">
                Enter your email to receive a password reset link
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#6DB33F] hover:bg-[#5da035] text-white"
              >
                {isLoggingIn ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-[#6DB33F] hover:underline text-sm"
              >
                Back to Login
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Login/Signup Form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <UnifiedHeader />

        {/* A WebView overlay can race the native iOS presentation context and
            prevent the Google account sheet from appearing. The button still
            shows progress while the native sheet owns the screen. */}
        {isGoogleLoading && !Capacitor.isNativePlatform() && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-white/85 px-6 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-label="Google sign-in in progress"
          >
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#6DB33F]/10">
                <Loader2 className="h-7 w-7 animate-spin text-[#6DB33F]" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Signing in with Google
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                After choosing your account, please wait 5–10 seconds while we
                finish signing you in. Do not press the button again.
              </p>
            </div>
          </div>
        )}

        <main className="max-w-md mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#6DB33F]/10 flex items-center justify-center mx-auto mb-4">
                <LogIn size={32} className="text-[#6DB33F]" />
              </div>
              <h1 className="text-gray-900 text-2xl mb-2">
                {isSignup ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-gray-600">
                {isSignup
                  ? "Sign up to start shopping with AlClean"
                  : "Login to access your account and orders"}
              </p>
            </div>

            {isSignup ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <PhoneIcon
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+92xxxxxxxxxx (use this format)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#6DB33F] hover:bg-[#5da035] text-white"
                >
                  {isLoggingIn ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#6DB33F] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#6DB33F] hover:bg-[#5da035] text-white"
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </Button>
              </form>
            )}

            <div className="mt-4 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {Capacitor.getPlatform() === "ios" && (
              <Button
                type="button"
                onClick={handleAppleLogin}
                disabled={isLoggingIn}
                aria-busy={isAppleLoading}
                className="w-full mt-4 h-11 bg-black hover:bg-gray-900 text-white border border-black"
              >
                {isAppleLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 mr-2 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.05 12.54c-.03-3.15 2.57-4.68 2.69-4.75-1.47-2.15-3.76-2.44-4.57-2.47-1.92-.2-3.79 1.15-4.77 1.15-1 0-2.51-1.13-4.14-1.1-2.09.03-4.05 1.24-5.12 3.11-2.21 3.83-.56 9.46 1.56 12.56 1.06 1.52 2.3 3.22 3.93 3.16 1.6-.07 2.2-1.01 4.13-1.01 1.91 0 2.48 1.01 4.15.97 1.72-.03 2.8-1.52 3.82-3.05 1.22-1.74 1.71-3.46 1.73-3.55-.04-.01-3.38-1.29-3.41-5.02ZM13.91 3.29A5.1 5.1 0 0 0 15.08 0a5.19 5.19 0 0 0-3.35 1.69 4.86 4.86 0 0 0-1.2 3.16 4.29 4.29 0 0 0 3.38-1.56Z" />
                  </svg>
                )}
                {isAppleLoading ? "Signing in..." : "Continue with Apple"}
              </Button>
            )}

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              aria-busy={isGoogleLoading}
              className="w-full mt-4 h-11 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              )}
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </Button>

            <div className="mt-6 text-center text-gray-600">
              {isSignup
                ? "Already have an account? "
                : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setPassword("");
                }}
                className="text-[#6DB33F] hover:underline font-medium"
              >
                {isSignup ? "Login" : "Sign up"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="text-sm font-medium text-gray-500 hover:text-[#6DB33F]"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Logged in - Show Account Menu
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <UnifiedHeader />

      {/* User Profile Section */}
      <div className="bg-[#6DB33F] text-white">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{user.name || "User"}</h1>
              <p className="text-white/80 text-sm">{user.email}</p>
              {user.phone && (
                <p className="text-white/70 text-xs">{user.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#6DB33F]/10 flex items-center justify-center">
                <item.icon size={20} className="text-[#6DB33F]" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 font-medium">{item.label}</h3>
                <p className="text-gray-500 text-sm">{item.description}</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Log Out</span>
        </button>

        <button
          type="button"
          onClick={() => setDeletionStep(1)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-4 bg-red-600 rounded-2xl border border-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <Trash2 size={20} />
          <span className="font-medium">Delete Account</span>
        </button>
      </main>

      {deletionStep > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {deletionStep === 1 ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="text-red-600" size={28} />
                </div>
                <h2
                  id="delete-account-title"
                  className="text-center text-xl font-semibold text-gray-900"
                >
                  Delete your account?
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  This permanently deletes your profile, sign-in identity, saved app data,
                  notification history, and device registrations. This cannot be undone.
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Historical transaction records may be retained only where needed for order
                  fulfillment, refunds, fraud prevention, accounting, or legal obligations.
                </p>
                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDeletionStep(0)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    onClick={() => setDeletionStep(2)}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 id="delete-account-title" className="text-xl font-semibold text-gray-900">
                  Final confirmation
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Delete your AlClean account permanently? Apple users will be asked to sign in
                  again so AlClean can revoke Sign in with Apple authorization.
                </p>
                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isDeleting}
                    onClick={() => setDeletionStep(0)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeleting}
                    aria-busy={isDeleting}
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isDeleting ? "Deleting..." : "Delete Permanently"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
