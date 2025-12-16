import { Link } from "react-router-dom";
import logoImage from "figma:asset/8f03d5c7f7a5ad0420573e04e40e094b85ac1357.png";

interface LogoProps {
  className?: string;
  linkTo?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", linkTo = "/", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-12 w-auto"
  };

  const logoContent = (
    <img 
      src={logoImage} 
      alt="AlClean Logo" 
      className={`${sizeClasses[size]} object-contain ${className}`}
    />
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-block">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}