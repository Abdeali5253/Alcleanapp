import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, MessageCircle, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Logo } from "./Logo";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: "Returns & Exchanges",
    question: "What is your return and exchange policy?",
    answer: "We only accept returns and exchanges for damaged items. If you receive a damaged product, please send us a video and photo proof via WhatsApp within 24 hours of delivery. Our team will review your case and arrange for a replacement or refund. Please note that we do not accept returns for change of mind or incorrect orders."
  },
  {
    category: "Returns & Exchanges",
    question: "How do I report a damaged item?",
    answer: "To report a damaged item, please contact us on WhatsApp at +92 334 3353327 or +92 300 7252536 within 24 hours of receiving your order. Send clear photos and a short video showing the damage. Include your order number in the message. Our team will respond within 24 hours and arrange for a replacement."
  },
  {
    category: "Delivery",
    question: "How long does delivery take?",
    answer: "Delivery time depends on your location:\n\n• Karachi: 1-2 business days\n• Lahore: 1-2 business days\n• Islamabad/Rawalpindi: 1-2 business days\n• Other cities: 4-5 business days\n\nOrders are processed within 24 hours of confirmation. You will receive tracking information once your order is shipped."
  },
  {
    category: "Delivery",
    question: "Do you deliver across Pakistan?",
    answer: "Yes! We deliver to all major cities and towns across Pakistan. Our main hubs are in Karachi, Lahore, and Rawalpindi, ensuring fast delivery to these areas. We also deliver to remote locations, though delivery may take 4-5 business days."
  },
  {
    category: "Delivery",
    question: "What are your delivery charges?",
    answer: "Delivery charges vary by location:\n\n• Karachi, Lahore, Islamabad, Rawalpindi: Fixed Rs. 200\n• Other cities: Rs. 50 per kg\n\nFree delivery on orders above Rs. 5,000 (selected areas only). Delivery charges are calculated automatically at checkout based on your location and order weight."
  },
  {
    category: "Store Information",
    question: "What are your store timings?",
    answer: "Our stores are open:\n\n• Monday to Saturday: 9:00 AM - 6:00 PM\n• Sunday: Closed\n\nOur online store is available 24/7. You can place orders anytime, and we'll process them during business hours. For urgent queries, please contact us via WhatsApp during store hours."
  },
  {
    category: "Store Information",
    question: "Where are your stores located?",
    answer: "We have three locations:\n\n1. Karachi (Head Office): Shop no 1, Husamia Manzil, Kutcury Road, Pakistan Chowk\n\n2. Lahore: Shop no 1, Mashallah Plaza, 33 Nisbat Road\n\n3. Rawalpindi: Shop # 455-3, Opposite to HBL Bank Adamjee Road, Saddar\n\nYou can visit any of our stores for in-person shopping or product inquiries."
  },
  {
    category: "Orders",
    question: "How can I track my order?",
    answer: "Once your order is shipped, you'll receive a tracking number via SMS and email. You can track your order in the 'Tracking' section of the app. Simply login to your account and go to the Tracking page to see real-time updates on your order status."
  },
  {
    category: "Orders",
    question: "Can I cancel or modify my order?",
    answer: "You can cancel or modify your order within 2 hours of placing it. After that, the order goes into processing and cannot be changed. To cancel or modify an order, please contact us immediately via WhatsApp at +92 334 3353327 with your order number."
  },
  {
    category: "Payment",
    question: "What payment methods do you accept?",
    answer: "We accept two payment methods:\n\n1. Cash on Delivery (COD): Pay when you receive your order\n\n2. Bank Transfer: Transfer payment to our bank account and upload the screenshot during checkout. Your order will be processed once payment is confirmed.\n\nCurrently, we do not accept credit/debit cards or online payment gateways."
  },
  {
    category: "Products",
    question: "Are your products original and authentic?",
    answer: "Yes, all our products are 100% original and sourced directly from authorized distributors and manufacturers. We are one of Pakistan's leading suppliers of cleaning chemicals and equipment, serving both retail and corporate clients. Every product comes with a quality guarantee."
  },
  {
    category: "Products",
    question: "Do you offer bulk discounts for corporate orders?",
    answer: "Yes! We offer special discounts for bulk orders and corporate clients. For corporate inquiries, please contact:\n\nQuaid: +92 335 3444053\nEmail: quaid@alclean.pk\n\nOur corporate sales team will provide you with a customized quote based on your requirements."
  },
  {
    category: "Account",
    question: "Why do I need to create an account?",
    answer: "Creating an account allows you to:\n\n• Track your orders in real-time\n• View order history\n• Save delivery addresses\n• Receive personalized notifications about offers and discounts\n• Faster checkout process\n• Easy access to customer support\n\nYour account is synced with Shopify for seamless order management."
  }
];

const categories = Array.from(new Set(faqs.map(faq => faq.category)));

export function HelpSupport() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFAQs = selectedCategory === "All" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-gray-900 text-2xl mb-2">Help & Support</h1>
        <p className="text-gray-600 mb-6">Frequently Asked Questions</p>

        {/* Category Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === "All"
                ? "bg-[#6DB33F] text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-[#6DB33F] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-[#6DB33F]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-3 mb-8">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <div className="text-xs text-[#6DB33F] mb-1">{faq.category}</div>
                  <div className="text-gray-900">{faq.question}</div>
                </div>
                {openIndex === index ? (
                  <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-4 pb-4">
                  <div className="text-gray-700 whitespace-pre-line border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-br from-[#6DB33F] to-[#5da035] rounded-2xl p-6 text-white">
          <h2 className="text-xl mb-2">Still need help?</h2>
          <p className="text-white/90 mb-4">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          
          <div className="space-y-3">
            <a
              href="https://wa.me/923343353327"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-colors"
            >
              <MessageCircle size={20} />
              <div className="flex-1">
                <div className="text-sm">WhatsApp Support</div>
                <div className="text-xs text-white/80">+92 334 3353327</div>
              </div>
            </a>

            <a
              href="tel:+923343353327"
              className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-colors"
            >
              <Phone size={20} />
              <div className="flex-1">
                <div className="text-sm">Call Us</div>
                <div className="text-xs text-white/80">Mon-Sat, 9 AM - 6 PM</div>
              </div>
            </a>

            <Link to="/contact">
              <Button
                variant="outline"
                className="w-full bg-transparent border-white text-white hover:bg-white hover:text-[#6DB33F]"
              >
                Visit Contact Page
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}