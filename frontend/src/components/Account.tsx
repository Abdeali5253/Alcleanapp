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
  Settings
} from "lucide-react";
import { authService, User as AuthUser } from "../lib/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Logo } from "./Logo";

const menuItems = [
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
    link: "/notifications/settings",
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
  {
    icon: Settings,
    label: "Backend Test",
    description: "Test Shopify integration (Admin)",
    link: "/backend-test",
    adminOnly: true,
  },
];

export function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState(");
  const [email, setEmail] = useState(");
  const [password, setPassword] = useState(");
  const [phone, setPhone] = useState(");

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authService.subscribe((newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await authService.login(email, password);
      toast.success("Login successful!");
      
      // Check if there's a redirect path
      const redirectPath = authService.getAndClearRedirect();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      await authService.signup(name, email, password, phone);
      toast.success("Account created successfully!");
      
      // Check if there's a redirect path
      const redirectPath = authService.getAndClearRedirect();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
  };

  // If not logged in, show login/signup form
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
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#6DB33F] hover:bg-[#5da035]"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#6DB33F] hover:bg-[#5da035]"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <button 
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setEmail(");
                    setPassword(");
                    setName(");
                    setPhone(");
                  }}
                  className="text-[#6DB33F] hover:underline"
                >
                  {isSignup ? "Login" : "Sign up"}
                </button>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-xs text-center">
                {isSignup 
                  ? "Your account will be synced with Shopify for order tracking" 
                  : "For demo: enter any email and password to login"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If logged in, show account menu
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
        {/* Profile Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#6DB33F] flex items-center justify-center text-white text-2xl">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-gray-900 text-lg mb-1">
                {user.name}
              </h2>
              <p className="text-gray-500">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl border border-gray-200 divide-y overflow-hidden mb-6">
          {menuItems.map((item, index) =>
            item.link.startsWith("#") ? (
              <button
                key={index}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <item.icon
                    size={20}
                    className="text-gray-600"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-gray-900">{item.label}</p>
                  <p className="text-gray-500 text-sm">
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400"
                />
              </button>
            ) : (
              <Link
                key={index}
                to={item.link}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <item.icon
                    size={20}
                    className="text-gray-600"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-gray-900">{item.label}</p>
                  <p className="text-gray-500 text-sm">
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400"
                />
              </Link>
            ),
          )}
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </main>
    </div>
  );
}