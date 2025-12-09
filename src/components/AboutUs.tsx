import image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357 from 'figma:asset/8f03d5c7f7a5ad0420573e04e40e094b85ac1357.png';
import { Link } from "react-router-dom";
import { Target, Eye, Award, Users } from "lucide-react";
import logo from "figma:asset/0d56b91e4ffc112930c8a550a03dc9cfc1f9fbf4.png";

export function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <Link to="/">
            <img
              src={image_8f03d5c7f7a5ad0420573e04e40e094b85ac1357}
              alt="AlClean"
              className="h-10 cursor-pointer"
            />
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-gray-900 text-2xl mb-2">
          About AlClean
        </h1>
        <p className="text-gray-600 mb-6">
          Your trusted partner in cleaning solutions
        </p>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#6DB33F] to-[#5da035] rounded-2xl p-6 text-white mb-6">
          <h2 className="text-xl mb-3">Who We Are</h2>
          <p className="text-white/90">
            AlClean is Pakistan's leading provider of
            professional-grade cleaning chemicals and equipment.
            We are committed to delivering high-quality products
            that make cleaning easier, more efficient, and
            environmentally friendly.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-[#6DB33F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target size={24} className="text-[#6DB33F]" />
            </div>
            <h3 className="text-gray-900 mb-2">Our Mission</h3>
            <p className="text-gray-600 text-sm">
              To provide premium cleaning solutions that exceed
              expectations
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-[#00A3E0]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye size={24} className="text-[#00A3E0]" />
            </div>
            <h3 className="text-gray-900 mb-2">Our Vision</h3>
            <p className="text-gray-600 text-sm">
              To be the most trusted cleaning brand in Pakistan
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-[#FFA500]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award size={24} className="text-[#FFA500]" />
            </div>
            <h3 className="text-gray-900 mb-2">
              Quality First
            </h3>
            <p className="text-gray-600 text-sm">
              Professional-grade products for every cleaning
              need
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
            <div className="w-12 h-12 bg-[#9B59B6]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-[#9B59B6]" />
            </div>
            <h3 className="text-gray-900 mb-2">Trusted</h3>
            <p className="text-gray-600 text-sm">
              Serving thousands of satisfied customers
              nationwide
            </p>
          </div>
        </div>

        {/* What We Offer */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <h2 className="text-gray-900 text-xl mb-4">
            What We Offer
          </h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-[#6DB33F] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">
                <span className="text-gray-900">
                  Wide Product Range:
                </span>{" "}
                From fabric detergents to industrial degreasers
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-[#6DB33F] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">
                <span className="text-gray-900">
                  Professional Equipment:
                </span>{" "}
                Advanced cleaning tools and machinery
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-[#6DB33F] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">
                <span className="text-gray-900">
                  Expert Support:
                </span>{" "}
                Dedicated team to help you choose the right
                products
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-[#6DB33F] rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">
                <span className="text-gray-900">
                  Nationwide Delivery:
                </span>{" "}
                Serving customers across Pakistan
              </p>
            </div>
          </div>
        </div>

        {/* Our Locations */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <h2 className="text-gray-900 text-xl mb-4">
            Our Locations
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-900">Karachi</span>
              <span className="text-[#6DB33F]">
                Head Office
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-900">Lahore</span>
              <span className="text-gray-600">
                Branch Office
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-900">Rawalpindi</span>
              <span className="text-gray-600">
                Branch Office
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-100 rounded-2xl p-6 text-center">
          <h2 className="text-gray-900 text-xl mb-2">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-4">
            Browse our products or contact us for assistance
          </p>
          <div className="flex gap-3">
            <Link
              to="/products"
              className="flex-1 bg-[#6DB33F] hover:bg-[#5da035] text-white py-3 rounded-lg transition-colors text-center"
            >
              Shop Now
            </Link>
            <Link
              to="/contact"
              className="flex-1 bg-white hover:bg-gray-50 text-gray-900 py-3 rounded-lg border border-gray-300 transition-colors text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}