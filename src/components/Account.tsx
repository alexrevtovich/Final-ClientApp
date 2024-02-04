import React from 'react';

const Account: React.FC = () => {
  const userEmail = sessionStorage.getItem("userEmail");
  console.log("Retrieved user email from sessionStorage:", userEmail); // Debugging

  return (
    <div>
      <h2>Account Page</h2>
      <p>User Email: {userEmail || "No Email Found"}</p>
    </div>
  );
};

export default Account;
