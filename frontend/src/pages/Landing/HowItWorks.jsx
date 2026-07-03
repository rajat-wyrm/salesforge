import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const scaleInUp = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function HowItWorks() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const steps = [
    {
      step: "01", title: "Set Requirements",
      desc: "Choose your criteria: Job title, Location, Industry, and more.",
      color: "from-violet-500 to-purple-600",
    },
    {
      step: "02", title: "Run Search",
      desc: "Our engine scans millions of records to find verified matches.",
      color: "from-purple-500 to-indigo-600",
    },
    {
      step: "03", title: "Export Data",
      desc: "Download your leads in CSV format and start your outreach.",
      color: "from-indigo-500 to-blue-600",
    },
  ];

  return (
    <section id="how-it-works" className={`py-24 relative ${darkMode ? "bg-slate-950" : "bg-white"}`}>
      <motion.div
        className={`absolute top-1/2 left-1/4 w-[200px] h-[200px] rounded-full blur-[80px] opacity-10 ${darkMode ? "bg-violet-500" : "bg-violet-300"}`}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
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
            Simple process
          </span>
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Generate Targeted Leads{" "}
            <br />
            <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              in Bulk
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={scaleInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              className={`relative p-8 rounded-2xl border transition-all duration-300 group ${
                darkMode
                  ? "bg-slate-900/50 border-slate-800/50 hover:border-violet-500/30"
                  : "bg-gray-50/80 border-gray-200/50 hover:border-violet-300"
              } hover:shadow-xl hover:-translate-y-1 hover:shadow-violet-500/5`}
            >
              <div className={`text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${step.color} opacity-50 group-hover:opacity-100 transition-opacity`}>
                {step.step}
              </div>
              <h3 className={`text-xl font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                {step.title}
              </h3>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {step.desc}
              </p>
              <div className={`h-1 w-12 mt-6 rounded-full bg-gradient-to-r ${step.color} group-hover:w-full transition-all duration-500`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
