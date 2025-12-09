import image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357 from 'figma:asset/8f03d5c7f7a5ad0420573e04e40e094b85ac1357.png';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import { authService, User } from "../lib/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

export function EditProfile() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
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

    // Simulate saving (in production, this would update Shopify customer)
    setTimeout(() => {
      toast.success("Profile updated successfully!");
      setIsSaving(false);
      navigate("/account");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/account")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <Link to="/" className="flex-1 flex justify-center">
              <img
                src={image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357}
                alt="AlClean"
                className="h-10"
              />
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-gray-900 text-2xl mb-2">Edit Profile</h1>
        <p className="text-gray-600 mb-6">Update your personal information</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-[#6DB33F] flex items-center justify-center text-white text-3xl mb-4">
                {name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <p className="text-gray-500 text-sm">Profile picture coming soon</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
            <h2 className="text-gray-900 text-lg mb-4">Personal Information</h2>
            
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
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
              <p className="text-gray-500 text-xs mt-1">
                Email is linked to your Shopify account
              </p>
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
              <p className="text-gray-500 text-xs mt-1">
                Used for order updates and delivery
              </p>
            </div>
          </div>

          {/* Save Button */}
          <Button
            type="submit"
            className="w-full bg-[#6DB33F] hover:bg-[#5da035] h-12 flex items-center justify-center gap-2"
            disabled={isSaving}
          >
            <Save size={20} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full border-gray-300"
            onClick={() => navigate("/account")}
          >
            Cancel
          </Button>
        </form>
      </main>
    </div>
  );
}
