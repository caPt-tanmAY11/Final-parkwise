import { Button } from "@/components/ui/button";
import { Smartphone, QrCode, Shield, Clock, Zap } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { motion } from "framer-motion";

const Features = () => {
  const featureList = [
    { icon: QrCode, title: "QR Code Entry", desc: "Instant access with digital codes" },
    { icon: Shield, title: "Secure Payment", desc: "Safe & encrypted transactions" },
    { icon: Clock, title: "24/7 Support", desc: "Always here to help" },
    { icon: Zap, title: "Instant Updates", desc: "Real-time notifications" },
  ];

  return (
    <section id="features" className="section-container bg-gradient-to-b from-background to-accent/5">
      <div className="max-w-7xl mx-auto">

        {/* TITLE */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 space-y-4"
        >
          <h2 className="text-5xl font-bold tracking-tight">
            Experience <span className="gradient-text">Smart Parking</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Modern features designed to make parking hassle-free
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">

          {/* LEFT CONTENT */}
          <AnimatedSection direction="left" className="space-y-8 order-2 lg:order-1">

            {/* Heading Block */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 hover:scale-110 transition-transform duration-300">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>

              <h3 className="text-4xl font-bold tracking-tight">
                Quick & Easy <span className="gradient-text">Booking</span>
              </h3>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Book your parking spot in seconds with our intuitive mobile-first interface.
                Search, select, and secure your space with just a few taps.
              </p>
            </motion.div>

            {/* Feature Grid */}
            <motion.div
              className="grid grid-cols-2 gap-6 pt-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.15 },
                },
              }}
            >
              {featureList.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 25 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ scale: 1.05, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="group flex items-start gap-4 p-5 rounded-xl bg-gradient-card border-2 border-border/50 
                  hover:border-primary/40 hover:shadow-primary/10 hover:shadow-lg 
                  cursor-pointer transition-all duration-300"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6, ease: "linear" }}
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
            </motion.div>
          </AnimatedSection>

          {/* RIGHT: PHONE MOCKUP */}
          <AnimatedSection direction="right" className="order-1 lg:order-2">
            <motion.div
              className="relative aspect-[9/16] max-w-sm mx-auto"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-3xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                whileHover={{ rotateX: 8, rotateY: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 120, damping: 10 }}
                className="relative h-full bg-gradient-card border-4 border-border/50 rounded-[3rem] shadow-glow-lg overflow-hidden p-4"
              >
                <div className="h-full bg-gradient-to-b from-background to-accent/10 rounded-[2.5rem] overflow-hidden">

                  {/* CONTENT */}
                  <div className="p-6 space-y-4">

                    {/* Status Bar */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full bg-primary/40" />
                        <div className="w-4 h-4 rounded-full bg-primary/60" />
                        <div className="w-4 h-4 rounded-full bg-primary" />
                      </div>
                    </div>

                    {/* Vehicle Card */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-border/50 space-y-3">
                      <div className="text-sm text-muted-foreground font-medium">My Vehicle</div>
                      <div className="text-2xl font-bold gradient-text">Porsche 917T</div>
                      <div className="text-xs text-muted-foreground">MH 01 AB 1234</div>
                    </div>

                    {/* Parking Card */}
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
              </motion.div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default Features;
