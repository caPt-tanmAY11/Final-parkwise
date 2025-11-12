import { Button } from "@/components/ui/button";
import { Smartphone, QrCode, Shield, Clock, Zap } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { motion } from "framer-motion";

const Features = () => {
  return (
    <section id="features" className="section-container bg-gradient-to-b from-background to-accent/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-5xl font-bold tracking-tight">
            Experience <span className="gradient-text">Smart Parking</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Modern features designed to make parking hassle-free
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <AnimatedSection direction="left" className="space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 hover:scale-110 transition-transform duration-300">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-4xl font-bold tracking-tight">
                Quick & Easy <span className="gradient-text">Booking</span>
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Book your parking spot in seconds with our intuitive mobile-first interface. Search, select, and secure your space with just a few taps.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-6">
              {[
                { icon: QrCode, title: "QR Code Entry", desc: "Instant access with digital codes" },
                { icon: Shield, title: "Secure Payment", desc: "Safe & encrypted transactions" },
                { icon: Clock, title: "24/7 Support", desc: "Always here to help" },
                { icon: Zap, title: "Instant Updates", desc: "Real-time notifications" },
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group flex items-start gap-4 p-5 rounded-xl bg-gradient-card border-2 border-border/50 hover:border-primary/40 card-hover cursor-pointer"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300"
                  >
                    <feature.icon className="h-6 w-6 text-primary" />
                  </motion.div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right" className="order-1 lg:order-2">
            <div className="relative aspect-[9/16] max-w-sm mx-auto">
              <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-3xl"></div>
              <div className="relative h-full bg-gradient-card border-4 border-border/50 rounded-[3rem] shadow-glow-lg overflow-hidden p-4">
                <div className="h-full bg-gradient-to-b from-background to-accent/10 rounded-[2.5rem] overflow-hidden">
                  {/* Phone mockup content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full bg-primary/40" />
                        <div className="w-4 h-4 rounded-full bg-primary/60" />
                        <div className="w-4 h-4 rounded-full bg-primary" />
                      </div>
                    </div>

                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-border/50 space-y-3">
                      <div className="text-sm text-muted-foreground font-medium">My Vehicle</div>
                      <div className="text-2xl font-bold gradient-text">Porsche 917T</div>
                      <div className="text-xs text-muted-foreground">MH 01 AB 1234</div>
                    </div>

                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-border/50 space-y-4">
                      <div className="text-base font-semibold">Last Parking</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-lg font-bold">Phoenix Mall</div>
                          <div className="text-sm text-muted-foreground">Lower Parel, Mumbai</div>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-3 border-t border-border/50">
                          <span className="font-semibold">1.5 km</span>
                          <span className="font-semibold">2/7h</span>
                          <span className="text-primary font-bold">₹60/h</span>
                        </div>
                      </div>
                      <Button size="sm" className="w-full">Book Again</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Features;
