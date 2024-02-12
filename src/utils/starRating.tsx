import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'; // Importing regular (empty) star icon

interface StarRatingProps {
  rating: number; // Specify that rating should be a number
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  const totalStars = 5;
  let stars = [];

  for (let i = 1; i <= totalStars; i++) {
    if (i <= Math.floor(rating)) {
      // Full star
      stars.push(<FontAwesomeIcon key={i} icon={faStar} />);
    } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
      // Half star, only added if the rating has a fractional part
      stars.push(<FontAwesomeIcon key={i} icon={faStarHalfAlt} />);
    } else {
      // Empty star
      stars.push(<FontAwesomeIcon key={i} icon={farStar} />);
    }
  }

  return <div>{stars}</div>;
};

export default StarRating;
