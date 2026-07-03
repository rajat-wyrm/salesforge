import { motion } from "framer-motion";
import { FaLinkedin, FaTwitter, FaFacebook, FaArrowUp } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { logoMainImg } from "./landingAssets";

function Footer() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socialLinks = [
    { icon: <FaTwitter size={18} />, label: "Twitter", href: "#" },
    { icon: <FaLinkedin size={18} />, label: "LinkedIn", href: "#" },
    { icon: <FaFacebook size={18} />, label: "Facebook", href: "#" },
  ];

  const footerSections = [
    {
      title: "Product",
      links: ["Features", "Pricing", "Security", "Roadmap"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Contact"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Data Policy", "Compliance"],
    },
  ];

  return (
    <footer className={`relative border-t ${darkMode ? "bg-slate-950 border-slate-800" : "bg-gray-50 border-gray-200"}`}>
      <button
        onClick={scrollToTop}
        className={`absolute -top-4 right-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:-translate-y-1 ${
          darkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-gray-900 hover:bg-gray-100"
        }`}
        aria-label="Scroll to top"
      >
        <FaArrowUp size={14} />
      </button>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <Link to="/" className="inline-block mb-4">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={logoMainImg}
                alt="UptoSkills"
                className="h-10 w-auto"
              />
            </Link>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} leading-relaxed`}>
              Generate leads and grow your business with verified data.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className={`text-sm transition-all duration-200 hover:translate-x-1 inline-block ${
                        darkMode ? "text-gray-400 hover:text-violet-400" : "text-gray-600 hover:text-violet-600"
                      }`}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={`h-px mb-8 ${darkMode ? "bg-slate-800" : "bg-gray-200"}`} />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            &copy; {new Date().getFullYear()} UptoSkills. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {socialLinks.map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                whileHover={{ scale: 1.1, y: -2 }}
                aria-label={social.label}
                className={`p-2.5 rounded-xl transition-all ${
                  darkMode
                    ? "bg-slate-800 text-gray-400 hover:text-violet-400 hover:bg-slate-700"
                    : "bg-gray-200 text-gray-600 hover:text-violet-600 hover:bg-gray-300"
                }`}
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
