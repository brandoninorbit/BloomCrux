"use client";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

interface DebriefBannerProps {
  recommendation: string;
}

export default function DebriefBanner({ recommendation }: DebriefBannerProps) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="mb-6 p-4 bg-primary/10 border-l-4 border-primary rounded-lg text-primary/80 flex items-center space-x-3"
    >
      <Info className="h-5 w-5 text-primary" />
      <p className="font-medium">{recommendation}</p>
    </motion.div>
  );
}


