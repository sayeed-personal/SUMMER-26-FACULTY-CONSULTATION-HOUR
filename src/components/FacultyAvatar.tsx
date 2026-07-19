import React from 'react';
import { 
  GraduationCap, Award, BookOpen, User, Sparkles, Terminal, 
  Shield, Star, Heart, Trophy, Brain, Compass, Briefcase, Lightbulb 
} from 'lucide-react';
import { Faculty } from '../data/schedule';

export const AVATAR_ICONS: Record<string, React.ComponentType<any>> = {
  GraduationCap,
  Award,
  BookOpen,
  User,
  Sparkles,
  Terminal,
  Shield,
  Star,
  Heart,
  Trophy,
  Brain,
  Compass,
  Briefcase,
  Lightbulb
};

interface FacultyAvatarProps {
  faculty: Faculty;
  className?: string;
  isLive?: boolean;
}

export const FacultyAvatar: React.FC<FacultyAvatarProps> = ({ 
  faculty, 
  className = '', 
  isLive = false 
}) => {
  const IconComponent = faculty.icon ? AVATAR_ICONS[faculty.icon] : null;
  const colorClass = faculty.profileColor || 'bg-blue-600';

  // Base styled wrapper
  return (
    <div 
      className={`rounded-xl flex items-center justify-center text-white font-display font-black shadow-md select-none transition-all duration-300 ${colorClass} ${
        faculty.disabled ? 'opacity-40 grayscale' : ''
      } ${className}`}
    >
      {IconComponent ? (
        <IconComponent className="w-1/2 h-1/2 stroke-[2.5]" />
      ) : (
        <span>{faculty.initial || '?'}</span>
      )}
    </div>
  );
};
