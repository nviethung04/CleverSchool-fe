"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { useAuth } from "@/lib/context/auth-context";
import { getAssignmentsRoute } from "@/lib/utils/route-utils";
import { AudioEffects } from "@/lib/utils/audio-utils"

export default function HomeworkResultPage() {
  const { user } = useAuth();
  const params = useParams()
  const router = useRouter()
  const homeworkId = params.id as string

  useEffect(() => {
    // Play success sound when result page loads
    const playSuccessSound = () => {
      AudioEffects.complete();
    };

    // Delay sound to sync with animation
    const timer = setTimeout(playSuccessSound, 800);

    return () => clearTimeout(timer);
  }, [homeworkId]);
  
  const handleOkClick = () => {
    // Play navigation sound when clicking OK button
    AudioEffects.navigate();

    router.push(getAssignmentsRoute(user))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      {/* Main Content Card */}
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full relative overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ minHeight: "500px" }}
      >
        {/* Decorative Elements Inside Card */}
        {/* UFO - Top Right */}
        <motion.div
          className="absolute top-20 right-28"
          animate={{ x: [0, 15, 0], y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <Image src="/images/ufo.png" alt="UFO" width={110} height={83} className="opacity-80" />
        </motion.div>

        {/* Stars Inside Card */}
        <motion.div
          className="absolute top-16 left-16"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <Image src="/images/star-light-blue.png" alt="Star" width={30} height={30} />
        </motion.div>

        {/* Bottom Stars - repositioned to match the image */}
        <motion.div
          className="absolute bottom-16 right-20"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
        >
          <Image src="/images/star-blue.png" alt="Star" width={50} height={50} />
        </motion.div>

        <motion.div
          className="absolute bottom-40 right-20"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
        >
          <Image src="/images/star-cyan.png" alt="Star" width={22} height={22} />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-[#32428D] mb-2">BÀI TẬP VỀ NHÀ</h1>
          <p className="text-[#32428D] text-2xl font-bold">COMPLETED!</p>
        </motion.div>

        {/* Content Area */}
        <div className="flex justify-center">
          {/* Robot Character - Bottom Left */}
          <motion.div
            className="absolute bottom-12 left-8 flex-shrink-0"
            initial={{ scale: 0, x: -50 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 200 }}
          >
            <Image
              src="/images/robot-character.png"
              alt="Happy Robot"
              width={180}
              height={180}
              className="drop-shadow-lg"
            />
          </motion.div>

          {/* Score and Time Section - Centered */}
          <motion.div
            className="flex-1 max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {/* Card */}
            <div className="bg-[#F3F5FF] rounded-[2rem] p-8 shadow-sm">
              {/* Congratulations */}
              <div className="text-center">
                <p className="text-[#32428D] text-xl font-semibold mb-3">Congratulations!</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* OK Button */}
        <motion.div
          className="text-center mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <motion.button
            onClick={handleOkClick}
            className="bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-4 px-16 rounded-full text-xl shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Quay lại
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
