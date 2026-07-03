import { motion } from "framer-motion";
import { useModal } from "@/context/ModalContext";
import { useTheme } from "../../context/ThemeContext";
import GlowButton from "@/components/GlowButton";

const scaleInUp = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function Pricing() {
  const { setSelectedModal } = useModal();
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const handleCardClick = (p) => setSelectedModal(p);

  const plans = [
    {
      id: "free-plan", name: "Free", price: "₹0",
      desc: "Perfect for getting started with lead management.",
      features: ["Up to 100 leads", "Basic enrichment", "Single user"],
      cta: "Get Started", highlighted: false,
      details: "Start building your lead database for free. Ideal for individuals, interns, and small teams testing out lead management.",
    },
    {
      id: "pro-plan", name: "Professional", price: "₹999",
      desc: "Advanced features for growing teams.",
      features: ["Unlimited leads", "Advanced enrichment", "Team access (3 users)", "Analytics dashboard", "Priority support"],
      cta: "Start Free Trial", highlighted: true,
      details: "Scale your sales with unlimited leads and team collaboration. Includes all data enrichment tools and advanced analytics.",
    },
    {
      id: "enterprise-plan", name: "Enterprise", price: "Custom",
      desc: "For organizations with advanced requirements.",
      features: ["Custom lead limits", "Team & role-based access", "API access", "Dedicated support", "Custom integrations"],
      cta: "Contact Sales", highlighted: false,
      details: "Enterprise-grade solutions with dedicated support, custom integrations, and advanced security features.",
    },
  ];

  return (
    <section id="pricing" className={`py-24 relative ${darkMode ? "bg-slate-950" : "bg-white"}`}>
      <motion.div
        className={`absolute top-1/3 right-1/4 w-[250px] h-[250px] rounded-full blur-[100px] opacity-10 ${darkMode ? "bg-purple-500" : "bg-purple-300"}`}
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      />
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-violet-100/80 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50 text-sm font-medium text-violet-700 dark:text-violet-300">
            Pricing
          </span>
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"} max-w-2xl mx-auto`}>
            Choose the plan that fits your team's needs. No credit card required to start.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              variants={scaleInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              onClick={() => handleCardClick(plan)}
              className={`relative cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden group ${
                plan.highlighted
                  ? darkMode
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 border-violet-500/30 hover:border-violet-500/50 shadow-xl shadow-violet-500/10"
                    : "bg-gradient-to-br from-white to-gray-50 border-violet-300 hover:border-violet-400 shadow-xl shadow-violet-500/10"
                  : darkMode
                  ? "bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80"
                  : "bg-white/80 border-gray-200/50 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
              )}

              <div className="p-8">
                {plan.highlighted && (
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-full mb-4 shadow-lg shadow-violet-500/30">
                    MOST POPULAR
                  </div>
                )}

                <h3 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {plan.desc}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}> /month</span>
                  )}
                </div>

                <GlowButton
                  variant={plan.highlighted ? "primary" : "secondary"}
                  className="w-full mb-6"
                  onClick={(e) => { e.stopPropagation(); handleCardClick(plan); }}
                >
                  {plan.cta}
                </GlowButton>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-start gap-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
