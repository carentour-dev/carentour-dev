import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    
    // Announce theme change for screen readers
    const announcement = `Theme changed to ${newTheme} mode`;
    const ariaLiveRegion = document.createElement("div");
    ariaLiveRegion.setAttribute("aria-live", "polite");
    ariaLiveRegion.setAttribute("aria-atomic", "true");
    ariaLiveRegion.className = "sr-only";
    ariaLiveRegion.textContent = announcement;
    document.body.appendChild(ariaLiveRegion);
    
    setTimeout(() => {
      document.body.removeChild(ariaLiveRegion);
    }, 1000);
  };

  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="icon"
        className="bg-background border-border animate-pulse"
        disabled
        aria-label="Loading theme toggle"
      >
        <div className="h-[1.2rem] w-[1.2rem] bg-muted rounded" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="bg-background border-border hover:bg-muted/50 transition-colors"
          aria-label="Toggle theme"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-popover border-border shadow-lg min-w-[140px] z-50"
      >
        <DropdownMenuItem 
          onClick={() => handleThemeChange("light")}
          className={`flex items-center gap-2 cursor-pointer hover:bg-muted/50 focus:bg-muted/50 ${
            theme === "light" ? "bg-muted text-primary font-medium" : ""
          }`}
          role="menuitem"
          aria-label="Switch to light theme"
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === "light" && <span className="sr-only">(current)</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("dark")}
          className={`flex items-center gap-2 cursor-pointer hover:bg-muted/50 focus:bg-muted/50 ${
            theme === "dark" ? "bg-muted text-primary font-medium" : ""
          }`}
          role="menuitem"
          aria-label="Switch to dark theme"
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && <span className="sr-only">(current)</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("system")}
          className={`flex items-center gap-2 cursor-pointer hover:bg-muted/50 focus:bg-muted/50 ${
            theme === "system" ? "bg-muted text-primary font-medium" : ""
          }`}
          role="menuitem"
          aria-label="Use system theme preference"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === "system" && <span className="sr-only">(current)</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}