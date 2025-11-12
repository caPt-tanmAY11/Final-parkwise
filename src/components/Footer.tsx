import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-background to-accent/5 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
            <h3 className="text-xl font-bold mb-4 gradient-text">ParkWise</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Smart parking solutions for modern cities. Follow us for updates.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">ACCESS</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  iOS App Store
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Android Play Store
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">CONTACT US</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>+91 22 4567 8901</li>
              <li>+91 22 4567 8902</li>
              <li>hello@parkwise.in</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">OUR PAGES</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ADDRESS</span>
              <span className="text-xs">•</span>
              <span>3rd Floor, Nariman Point, Mumbai, Maharashtra 400021, India</span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
