import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { authService, User as AuthUser } from "../lib/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Logo } from "./Logo";
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
    setIsLoggingIn(true);

    try {
      await authService.googleLogin();
      // The redirect will happen, result handled in App.tsx
    } catch (error: any) {
      toast.error(error.message || "Google login failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    authService.logOut();
  };

  // Forgot Password Form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>
        </header>

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
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>
        </header>

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

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            >
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
              Continue with Google
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
      </main>
    </div>
  );
}
