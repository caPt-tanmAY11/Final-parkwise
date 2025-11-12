import { Button } from "@/components/ui/button";
import { MapPin, Clock, IndianRupee, Car } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-b from-background via-background to-accent/20 pt-32 pb-24 overflow-hidden" role="banner">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-balance"
          >
            <span className="gradient-text">Smart Parking</span>
            <br />
            Management System
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Find, book, and manage parking spots across multiple locations with real-time availability and transparent pricing.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-6"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/auth'}
                className="gap-2 min-h-[56px] text-lg px-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                aria-label="Get started with ParkWise"
              >
                <Car className="w-5 h-5" aria-hidden="true" />
                Get Started
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = '/bookings'}
                className="gap-2 min-h-[56px] text-lg px-10 border-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300"
                aria-label="Find parking now"
              >
                <MapPin className="w-5 h-5" aria-hidden="true" />
                Find Parking Now
              </Button>
            </motion.div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-20 max-w-5xl mx-auto">
            {[
              { icon: MapPin, title: "Multiple", desc: "Parking centres across the city", delay: 0.6 },
              { icon: Clock, title: "Real-Time", desc: "Live availability updates", delay: 0.7 },
              { icon: IndianRupee, title: "Fair Pricing", desc: "Transparent hourly rates", delay: 0.8 }
            ].map((stat, index) => (
              <AnimatedSection key={index} delay={stat.delay} direction="up">
                <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-gradient-card border-2 border-border/50 rounded-2xl p-8 hover-glow text-center space-y-4 cursor-pointer"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300"
                  >
                    <stat.icon className="w-10 h-10 text-primary" aria-hidden="true" />
                  </motion.div>
                  <div className="text-4xl font-bold tracking-tight gradient-text">{stat.title}</div>
                  <p className="text-base text-muted-foreground leading-relaxed">{stat.desc}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
