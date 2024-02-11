import React, { useState } from 'react';

// Define an interface for the component props
interface ReviewProps {
  stationId: number; // Assuming stationId is of type number
  userEmail: string; // userEmail is of type string
}

const Review: React.FC<ReviewProps> = ({ stationId, userEmail }) => {
    const [rating, setRating] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>('');
    const [showModal, setShowModal] = useState<boolean>(false);
  
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
          <form onSubmit={handleSubmit}>
            <div>
              {[1, 2, 3, 4, 5].map((num: number) => ( // Specify the type of num
                <label key={num}>
                  {num}
                  <input
                    type="radio"
                    value={num}
                    checked={rating === num}
                    onChange={(e) => setRating(Number(e.target.value))} // Convert value to number
                  />
                </label>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review here..."
            />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
    </>
  );
};

export default Review;
