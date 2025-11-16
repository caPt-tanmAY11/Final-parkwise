import { Button } from "@/components/ui/button";
import { MapPin, Clock, IndianRupee, Car } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

const Hero = () => {
  return (
    <section
      className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-background via-background to-accent/20 pt-28 pb-20 overflow-hidden"
      role="banner"
    >
      {/* Background float blobs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2, delayChildren: 0.2 },
            },
          }}
        >
          {/* Heading */}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-snug tracking-tight text-balance"
          >
            <span className="gradient-text">Smart Parking</span>
            <br />
            Management System
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 22 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Find, book, and manage parking spots across multiple locations with
            real-time availability and transparent pricing.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
          >
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => (window.location.href = "/auth")}
                className="gap-2 min-h-[56px] text-lg px-10 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground hover:shadow-xl shadow-primary/20 transition-all duration-300"
              >
                <Car className="w-5 h-5" />
                Get Started
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                onClick={() => (window.location.href = "/bookings")}
                className="gap-2 min-h-[56px] text-lg px-10 border-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300"
              >
                <MapPin className="w-5 h-5" />
                Find Parking Now
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 max-w-5xl mx-auto">
            {[
              { icon: MapPin, title: "Multiple", desc: "Parking centres across the city", delay: 0.6 },
              { icon: Clock, title: "Real-Time", desc: "Live availability updates", delay: 0.7 },
              { icon: IndianRupee, title: "Fair Pricing", desc: "Transparent hourly rates", delay: 0.8 },
            ].map((stat, index) => (
              <AnimatedSection key={index} delay={stat.delay} direction="up">
                <motion.div
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ duration: 0.25 }}
                  className="group bg-gradient-card border-2 border-border/50 rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/10 text-center space-y-3 cursor-pointer transition-all duration-300"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.55, ease: "linear" }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300"
                  >
                    <stat.icon className="w-9 h-9 text-primary" />
                  </motion.div>

                  <div className="text-3xl font-bold tracking-tight gradient-text">
                    {stat.title}
                  </div>

                  <p className="text-base text-muted-foreground leading-relaxed">
                    {stat.desc}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
