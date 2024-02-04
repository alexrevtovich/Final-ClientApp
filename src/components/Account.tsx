import React from 'react';

const Account: React.FC = () => {
  const userEmail = sessionStorage.getItem("userEmail") || "No Email Found";

  return (
    <div>
      <h2>Account Page</h2>
      <p>User Email: {userEmail}</p>
    </div>
  );
};

export default Account;
