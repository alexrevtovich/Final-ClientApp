import React, { useState, useEffect } from 'react';


// Define an interface for the component props
interface ReviewProps {
  stationId: number; // stationId is of type number
  userEmail: string; // userEmail is of type string
}
//for reviews
interface ReviewData {
  email: string;
  reviewText: string;
  rating: number;
}

const Review: React.FC<ReviewProps> = ({ stationId, userEmail }) => {
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewMessage, setReviewMessage] = useState<string>('');

  useEffect(() => {
    if (showModal) {
      fetchReviews();
    }
  }, [showModal, stationId]); 

  const fetchReviews = async () => {
    try {
      const response = await fetch('https://s24-final-back.azurewebsites.net/api/getreviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stationId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
          setReviewMessage('');
        } else {
          setReviewMessage("No reviews found for this station.");
        }
      } else {
        setReviewMessage(data.message || "Failed to fetch reviews.");
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviewMessage("Error fetching reviews.");
    }
  };


  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      stationId,
      email: userEmail,
      rating,
      reviewText,
    };
  
    try {
      const response = await fetch('https://s24-final-back.azurewebsites.net/api/addrating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        alert('Review submitted successfully!');
        // Reset rating and reviewText
        setRating(0);
        setReviewText('');
        setShowModal(false); // Close the modal on successful submission
      } else {
        alert('Failed to submit the review.');
      }
    } catch (error) {
      console.error('Error submitting the review:', error);
      alert('Error submitting the review.');
    }
  };

  // Toggle the showModal state
  const toggleModal = () => setShowModal(!showModal);

  return (
    <>
      <button onClick={toggleModal}>Reviews</button>
      {showModal && (
        <div className="modal">
          <button className="close-modal" onClick={toggleModal}>X</button> {/* Add a button to close the modal */}
          <form onSubmit={handleSubmit}>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((num) => (
                <label key={num} className={`rating-label ${rating >= num ? 'selected' : ''}`}>
                  {num}
                  <input
                    type="radio"
                    name="rating"
                    value={num}
                    checked={rating === num}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="rating-radio"
                  />
                </label>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review here..."
              className="review-textarea"
            />
            <button type="submit" className="submit-review">Submit</button>
          </form>
          {/* Review Message and Reviews Display */}
          {reviewMessage && <div className="review-message">{reviewMessage}</div>}
          <div className="reviews-list">
            {reviews.map((review, index) => (
              <div key={index} className="review-item">
                <p>Rating: {review.rating}</p>
                <p>Email: {review.email}</p>
                <p>Review: {review.reviewText || "No review text provided."}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
            };

export default Review;
