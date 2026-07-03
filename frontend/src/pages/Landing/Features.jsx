import { motion } from "framer-motion";
import { useModal } from "../../context/ModalContext";
import { FaUsers, FaBuilding, FaSearch, FaChartLine, FaArrowRight } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const scaleInUp = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

function Features() {
  const { setSelectedModal } = useModal();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const handleCardClick = (feature) => {
    setSelectedModal({
      id: feature.id, title: feature.title, desc: feature.desc,
      icon: feature.icon, color: feature.color, details: feature.details,
    });
  };

  const features = [
    {
      id: "lead-management", title: "Lead Management",
      desc: "Create, edit, tag, and track leads with clear status stages.",
      icon: <FaUsers size={24} />, color: "from-violet-500 to-purple-600",
      details: "Organize your entire lead pipeline with our intuitive management system. Set custom stages, automate workflows, and track every interaction to ensure no opportunity is missed.",
    },
    {
      id: "org-management", title: "Organization Management",
      desc: "Manage companies and accounts by linking multiple leads together.",
      icon: <FaBuilding size={24} />, color: "from-purple-500 to-indigo-600",
      details: "Group leads by organization and unlock company-level insights. Track organizational details, relationships, and aggregate metrics across all linked leads and contacts.",
    },
    {
      id: "data-enrichment", title: "Data Enrichment Tools",
      desc: "Enrich leads using email search, domain lookup, and social data.",
      icon: <FaSearch size={24} />, color: "from-indigo-500 to-blue-600",
      details: "Instantly enrich incomplete data with verified emails, social profiles, and company information. Our AI-powered enrichment ensures your database stays fresh and accurate.",
    },
    {
      id: "analytics", title: "Analytics & Insights",
      desc: "Track lead funnels, activities, and conversion metrics.",
      icon: <FaChartLine size={24} />, color: "from-blue-500 to-cyan-600",
      details: "Visualize your sales pipeline and conversion metrics in real-time. Build custom dashboards to monitor what matters most to your team's success.",
    },
  ];

  return (
    <section id="features" className={`py-24 relative ${darkMode ? "bg-slate-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-violet-100/80 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 text-sm font-medium text-violet-700 dark:text-violet-300">
            What we offer
          </span>
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Powerful{" "}
            <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"} max-w-2xl mx-auto`}>
            Everything you need to manage leads, organizations, and outreach in one simple platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              variants={scaleInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              onClick={() => handleCardClick(feature)}
              className={`group cursor-pointer relative p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${
                darkMode
                  ? "bg-slate-800/50 border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-800/80"
                  : "bg-white/80 border-gray-200/50 hover:border-violet-300 hover:bg-white"
              } hover:shadow-xl hover:-translate-y-1 hover:shadow-violet-500/10`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.color} opacity-[0.03]`} />
              <div className={`w-14 h-14 flex items-center justify-center rounded-xl mb-4 text-white bg-gradient-to-r ${feature.color} shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                {feature.title}
              </h3>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {feature.desc}
              </p>
              <div className="mt-4 flex items-center gap-2 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent text-sm">
                  Learn more
                </span>
                <FaArrowRight size={12} className="text-violet-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
