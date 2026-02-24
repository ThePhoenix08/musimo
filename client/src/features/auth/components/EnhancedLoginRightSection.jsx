"use client";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

import RIGHT_SECTION_BG_IMG from "@/assets/Images/login-background.jpg?w=400;800;1200;1600&format=webp&imagetools&as=picture&metadata";
import SmartImage from "@/components/misc/SmartImage";

function EnhancedLoginRightSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden p-12 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      {/* Background */}
      <SmartImage
        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
        image={RIGHT_SECTION_BG_IMG}
        alt="Login background"
        fit="cover"
        showPlaceholder={true}
      />

      {/* Small dark overlay for subtle readability */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* Animated glow effects */}
      <motion.div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-screen filter blur-3xl opacity-20"
        style={{
          background: "rgba(79, 172, 254, 0.3)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full mix-blend-screen filter blur-3xl opacity-15"
        style={{
          background: "rgba(236, 72, 153, 0.3)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center space-y-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Text Content */}
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-white text-balance leading-tight"
            variants={itemVariants}
          >
            Unlock Your Music's
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-cyan-400 to-pink-400">
              True Potential
            </span>
          </motion.h2>
          <motion.p
            className="text-lg text-gray-200 max-w-sm text-balance"
            variants={itemVariants}
          >
            Experience advanced AI-powered audio intelligence. Analyze every
            beat, discover hidden patterns, and elevate your sound.
          </motion.p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          className="flex flex-wrap gap-3 justify-center pt-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { icon: "♪", label: "AI Audio Analysis" },
            { icon: "⚡", label: "Real-time Detection" },
            { icon: "🎵", label: "Pattern Discovery" },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-white backdrop-blur-md hover:bg-white/20 transition-colors"
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {feature.icon} {feature.label}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default EnhancedLoginRightSection;
