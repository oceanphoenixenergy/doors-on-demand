import { SiWhatsapp } from "react-icons/si";
import logoImage from "@assets/Doors_On_Demand_(1)_1770320734409.png";

export function Footer() {
  return (
    <footer className="w-full py-4 px-4 border-t border-border bg-card mt-auto" data-testid="footer">
      <div className="max-w-md mx-auto flex flex-col items-center gap-3">
        <a
          href="https://wa.me/447854015863"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="link-whatsapp"
        >
          <SiWhatsapp className="w-4 h-4 text-green-600" />
          Chat on WhatsApp
        </a>
        <img 
          src={logoImage} 
          alt="Doors On Demand" 
          className="h-8 w-auto opacity-60" 
        />
      </div>
    </footer>
  );
}
