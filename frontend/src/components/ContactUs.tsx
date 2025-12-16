import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

interface Location {
  city: string;
  type: string;
  address: string;
  phone?: string;
  mobile?: string[];
  email?: string;
  corporateSales?: string;
  corporateEmail?: string;
}

const locations: Location[] = [
  {
    city: "KARACHI",
    type: "Head Office",
    address: "Shop no 1, Husamia Manzil, Kutcury Road, Pakistan Chowk, Karachi, Pakistan",
    phone: "+92 21 32621680",
    mobile: ["+92 334 3353327", "+92 300 7252536"],
    email: "info@alclean.pk",
    corporateSales: "+92 335 3444053",
    corporateEmail: "quaid@alclean.pk"
  },
  {
    city: "LAHORE",
    type: "Branch Office",
    address: "Shop no 1, Mashallah Plaza, 33 Nisbat Road, Lahore, Pakistan",
    mobile: ["+92 321 4481252", "+92 323 5555702"]
  },
  {
    city: "RAWALPINDI",
    type: "Branch Office",
    address: "Shop # 455-3, Opposite to HBL Bank Adamjee Road, Saddar, Rawalpindi, Pakistan",
    mobile: ["+92 334 5245651"]
  }
];

export function ContactUs() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <Link to="/">
            <Logo className="h-10 cursor-pointer" />
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-gray-900 text-2xl mb-2">Contact Us</h1>
        <p className="text-gray-600 mb-6">Get in touch with our team at any of our locations</p>

        <div className="space-y-6">
          {locations.map((location, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-gray-900 text-xl mb-1">{location.city}</h2>
                <p className="text-[#6DB33F]">{location.type}</p>
              </div>

              <div className="space-y-4">
                {/* Address */}
                <div className="flex gap-3">
                  <MapPin size={20} className="text-gray-400 flex-shrink-0 mt-1" />
                  <p className="text-gray-700">{location.address}</p>
                </div>

                {/* Phone */}
                {location.phone && (
                  <div className="flex gap-3">
                    <Phone size={20} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Contact No</p>
                      <a href={`tel:${location.phone}`} className="text-gray-900 hover:text-[#6DB33F]">
                        {location.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Mobile */}
                {location.mobile && (
                  <div className="flex gap-3">
                    <Phone size={20} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Mobile No</p>
                      {location.mobile.map((mobile, idx) => (
                        <a
                          key={idx}
                          href={`tel:${mobile}`}
                          className="block text-gray-900 hover:text-[#6DB33F]"
                        >
                          {mobile}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email */}
                {location.email && (
                  <div className="flex gap-3">
                    <Mail size={20} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Email</p>
                      <a
                        href={`mailto:${location.email}`}
                        className="text-gray-900 hover:text-[#6DB33F]"
                      >
                        {location.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Corporate Sales */}
                {location.corporateSales && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm mb-2">Corporate Sales</p>
                    <div className="space-y-2">
                      <a
                        href={`tel:${location.corporateSales}`}
                        className="flex items-center gap-2 text-gray-900 hover:text-[#6DB33F]"
                      >
                        <Phone size={16} />
                        {location.corporateSales}
                      </a>
                      {location.corporateEmail && (
                        <a
                          href={`mailto:${location.corporateEmail}`}
                          className="flex items-center gap-2 text-gray-900 hover:text-[#6DB33F]"
                        >
                          <Mail size={16} />
                          {location.corporateEmail}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-gray-900 text-xl mb-4">Send us a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DB33F]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DB33F]"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-2">Message</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6DB33F] h-32 resize-none"
                placeholder="Your message..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-[#6DB33F] hover:bg-[#5da035] text-white py-3 rounded-lg transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}