import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import { authService, User } from "../lib/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Logo } from "./Logo";

export function EditProfile() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [name, setName] = useState(currentUser?.name || ");
  const [email, setEmail] = useState(currentUser?.email || ");
  const [phone, setPhone] = useState(currentUser?.phone || ");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!authService.isLoggedIn()) {
      navigate("/account");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser: User = {
        ...currentUser!,
        name,
        email,
        phone
      };
      
      authService.updateUser(updatedUser);
      toast.success("Profile updated successfully!");
      
      setTimeout(() => {
        navigate("/account");
      }, 1000);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <Link to="/" className="flex-1 flex justify-center">
              <Logo />
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-gray-900 text-2xl mb-2">
            Edit Profile
          </h1>
          <p className="text-gray-600">
            Update your personal information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#6DB33F] hover:bg-[#5da035] flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </main>
    </div>
  );
}
