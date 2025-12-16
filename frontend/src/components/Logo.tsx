import { Link } from "react-router-dom";
import logoImage from "../assets/logo.png";

interface LogoProps {
  className?: string;
  linkTo?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", linkTo = "/", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-14 w-auto"
  };

  const logoContent = (
    <img 
      src={logoImage} 
      alt="AlClean" 
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
