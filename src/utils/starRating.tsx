import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faStar as farStar } from '@fortawesome/free-solid-svg-icons';

// Define an interface for the component's props
interface StarRatingProps {
  rating: number; // Specify that rating should be a number
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  const totalStars = 5;
  let stars = [];

  for (let i = 1; i <= totalStars; i++) {
    if (i <= rating) {
      // Full star
      stars.push(<FontAwesomeIcon key={i} icon={faStar} />);
    } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
      // Half star
      stars.push(<FontAwesomeIcon key={i} icon={faStarHalfAlt} />);
    } else {
      // Empty star
      stars.push(<FontAwesomeIcon key={i} icon={farStar} />);
    }
  }

  return <div>{stars}</div>;
};

export default StarRating;
