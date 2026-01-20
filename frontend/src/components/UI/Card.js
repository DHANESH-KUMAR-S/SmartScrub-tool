import React from 'react';
import styles from './Card.module.css';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = false,
  ...props 
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    hover ? styles.hover : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;