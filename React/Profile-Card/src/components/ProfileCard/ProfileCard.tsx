import React, { forwardRef } from 'react';
import { cardStyles } from './styles';
import { cn } from '../../utils/cn'; // We'll create this utility

interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'minimal' | 'glass' | 'dark';
  size?: 'sm' | 'lg';
  children: React.ReactNode;
}

const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <article
        ref={ref}
        className={cn(cardStyles({ intent: variant, size }), className)}
        role="article"
        aria-labelledby="profile-card-title"
        {...props}
      >
        {children}
      </article>
    );
  }
);

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;
