import logo from "./assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, LogOut, Shield, LayoutDashboard, Headphones } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Header() {
  const navigate = useNavigate();
  const { hasRole, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const navLinks = [
    { label: "Features", path: "/#features" },
    ...(!hasRole('manager') ? [{ label: "Find Parking", path: "/find-parking" }] : []),
    ...(!hasRole('attendant') && !hasRole('manager') ? [{ label: "Support", path: "/support" }] : []),
  ];


  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate("/")}
          >
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => navigate("/")}
            >
              <img 
                src={logo} 
                alt="ParkWise Logo" 
                className="h-10 w-10 rounded-xl object-cover group-hover:scale-110 transition-transform"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ParkWise
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <>
                {hasRole('admin') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                )}
                
                {hasRole('manager') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/manager")}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Manager
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                
                {!hasRole('attendant') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/support")}
                    className="gap-2"
                  >
                    <Headphones className="h-4 w-4" />
                    Support
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4 animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              
              <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                <ThemeToggle />
                
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2 w-full">
                    {hasRole('admin') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigate("/admin");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full gap-2 justify-start"
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                      </Button>
                    )}
                    
                    {hasRole('manager') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigate("/manager");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full gap-2 justify-start"
                      >
                        <Shield className="h-4 w-4" />
                        Manager
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate("/dashboard");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full gap-2 justify-start"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                    
                    {!hasRole('attendant') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate("/support");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full gap-2 justify-start"
                      >
                        <Headphones className="h-4 w-4" />
                        Support
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full gap-2 justify-start text-muted-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate("/auth");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Sign in
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigate("/auth");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
