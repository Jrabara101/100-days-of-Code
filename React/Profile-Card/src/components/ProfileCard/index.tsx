import ProfileCard from './ProfileCard';
import CardHeader from './CardHeader';

// Compound component pattern
const CompoundProfileCard = ProfileCard as typeof ProfileCard & {
  Header: typeof CardHeader;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Actions: React.FC<{ children: React.ReactNode; className?: string }>;
};

CompoundProfileCard.Header = CardHeader;

// Body component
CompoundProfileCard.Body = ({ children, className }) => (
  <div className={`space-y-2 ${className || ''}`}>
    {children}
  </div>
);

// Actions component
CompoundProfileCard.Actions = ({ children, className }) => (
  <div className={`flex space-x-2 mt-4 ${className || ''}`}>
    {children}
  </div>
);

export default CompoundProfileCard;
