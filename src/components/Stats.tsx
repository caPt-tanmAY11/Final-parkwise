import { Building2, MapPin, Users } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { motion } from "framer-motion";

const Stats = () => {
  return (
    <section className="section-container bg-gradient-to-b from-accent/5 to-background relative overflow-hidden" id="stats">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Trusted by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join the growing community of smart parkers who save time and money every day
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Users, value: "50,000+", label: "Active Users", color: "text-primary", delay: 0 },
            { icon: MapPin, value: "100,000+", label: "Vehicles Parked", color: "text-primary", delay: 0.1 },
            { icon: Building2, value: "200+", label: "Parking Locations", color: "text-primary", delay: 0.2 },
          ].map((stat, index) => (
            <AnimatedSection key={index} delay={stat.delay} direction="up">
              <motion.div 
                whileHover={{ y: -10, scale: 1.03 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-gradient-card backdrop-blur-sm border-2 border-border/50 rounded-2xl p-10 hover:border-primary/50 hover-glow transition-all duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="p-5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300"
                  >
                    <stat.icon className={`h-12 w-12 ${stat.color}`} aria-hidden="true" />
                  </motion.div>
                  <div className="space-y-2">
                    <motion.div 
                      initial={{ scale: 1 }}
                      whileInView={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, delay: stat.delay + 0.3 }}
                      className="text-5xl font-bold tracking-tight gradient-text"
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-lg text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
