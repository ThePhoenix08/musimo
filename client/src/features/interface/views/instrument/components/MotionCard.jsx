import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

function MotionCard({ children, className, index = 0, hover = true }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      whileHover={
        hover ? { scale: 1.01, transition: { duration: 0.15 } } : undefined
      }
    >
      <Card className={className}>{children}</Card>
    </motion.div>
  );
}

export default MotionCard;
