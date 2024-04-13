import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import fetchAccountInfo from '../utils/accountinfo';
import getMyLocation from '../utils/mylocation';
import reverseGeocode from '../utils/reverse';
import AddCar from '../utils/addCar';
import fetchCarInfo from '../utils/carInfo';
import deleteCar from '../utils/deleteCar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faStar as solidStar } from '@fortawesome/free-solid-svg-icons'; // Solid star for the main car
import { faStar as regularStar } from '@fortawesome/free-regular-svg-icons'; // Regular star for other cars






interface CarDetail {
  uniqueId: string;
  brand: string;
  model: string;
  releaseYear: number;
  charge?: number;
}

const Account: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");
  const [userInfo, setUserInfo] = useState({ username: '', email: '', mainCar: '', cars: [], isDC: false });
  const [carInfo, setCarInfo] = useState<CarDetail | null>(null);
  const [carsInfo, setCarsInfo] = useState<CarDetail[]>([]);
  const [myLocation, setMyLocation] = useState<[number, number]>([0, 0]);
  const [address, setAddress] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCarsList, setShowCarsList] = useState(false);
  const [showUpdateNameModal, setShowUpdateNameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [latestCharge, setLatestCharge] = useState({ uniqueId: "", charge: 0 });




  // SignalR within a React component or effect
  useEffect(() => {
    const connection = new HubConnectionBuilder()
        .withUrl("https://s24-final-back.azurewebsites.net/api")
        .configureLogging(LogLevel.Information)
        .build();
  
    // Listen for the usernameUpdated event and update the state accordingly
    connection.on("usernameUpdated", (data) => {
      
      if (data.Email === userEmail) {
        setUserInfo(prevUserInfo => ({
          ...prevUserInfo,
          username: data.Username // Correctly accessing the properties as sent by the backend
        }));
      }
    });

    //charge update
    connection.on("chargeLevelUpdated", async (data) => {
      if (data.userEmail === userEmail) {
        setLatestCharge({ uniqueId: data.uniqueId, charge: data.Charge });
        // Optionally, update carInfo or carsInfo if this charge update is for one of them
      }
    });
    
    
    // Listen for mainCarUpdated messages
    connection.on("mainCarUpdated", async (data) => {
      // Check if the update is relevant to the current user
      if (data.Email === userEmail) {
          try {
              const mainCarInfo = await fetchCarInfo(data.MainCarId);
              setCarInfo(mainCarInfo);
          } catch (error) {
              console.error('Error fetching updated main car info:', error);
          }
      }
  });
  
    connection.start()
    .then(() => console.log("Connected to SignalR hub"))
    .catch(err => console.error("SignalR Connection Error: ", err));
    
    return () => {
      connection.stop();
    };
  }, [userEmail]); 
  

  useEffect(() => {
    if (!userEmail) {
      console.log('No user email found, redirecting to login...');
      navigate('/');
    } else {
      (async () => {
        try {
          const accountInfo = await fetchAccountInfo(userEmail);
          setUserInfo(accountInfo);
  
          if (accountInfo.mainCar && accountInfo.mainCar !== "None") {
            const mainCarInfo = await fetchCarInfo(accountInfo.mainCar);
            setCarInfo(mainCarInfo);
            // Fetch the initial charge level for the main car
            getChargeLevel(userEmail, accountInfo.mainCar);
          }
        } catch (error) {
          console.error('Failed to fetch account info:', error);
        }
      })();
    }
    getMyLocation(setMyLocation);
  }, [navigate, userEmail]);
  
  
  useEffect(() => {
    (async () => {
      if (myLocation[0] !== 0 || myLocation[1] !== 0) {
        const fetchedAddress = await reverseGeocode(myLocation);
        setAddress(fetchedAddress);
      }
    })();
  }, [myLocation]);

  useEffect(() => {
    const fetchCarsInfo = async () => {
      const carsDetailsPromises = userInfo.cars.map(carId => fetchCarInfo(carId));
      try {
        const carsDetails = await Promise.all(carsDetailsPromises);
        
        setCarsInfo(carsDetails.filter(car => car !== null));
      } catch (error) {
        console.error('Error fetching cars details:', error);
      }
    };

    if (userInfo.cars.length > 0) {
      fetchCarsInfo();
    }
  }, [userInfo.cars]);

  const toggleModal = () => setShowModal(!showModal);

  const handleUpdateCar = () => {
    setShowModal(false);
    // Logic to handle updating car information
  };

  const toggleCarsList = () => setShowCarsList(!showCarsList);

  const handleDeleteCar = async (uniqueId: string) => {
    if (!uniqueId) {
      console.error('Unique ID is undefined, cannot delete.');
      return;
    }
    try {
      await deleteCar(uniqueId);
      // Update carsInfo state to remove the deleted car
      const updatedCarsInfo = carsInfo.filter(car => car.uniqueId !== uniqueId);
      setCarsInfo(updatedCarsInfo);
  
      // Check if the deleted car was the main car
      if (userInfo.mainCar === uniqueId) {
        // Update userInfo with a new main car or set to '' if no cars left
        const newMainCar = updatedCarsInfo.length > 0 ? updatedCarsInfo[0].uniqueId : '';
        setUserInfo({
          ...userInfo,
          mainCar: newMainCar
        });
  
        // Update carInfo with details of the new main car or set to null if no cars left
        if (newMainCar) {
          const newMainCarInfo = await fetchCarInfo(newMainCar);
          setCarInfo(newMainCarInfo);
        } else {
          setCarInfo(null); // Set carInfo to null to indicate "No car info"
        }
      }
    } catch (error) {
      console.error('Failed to delete car:', error);
    }
  };
  
  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      console.error('New username cannot be empty.');
      // If you have an alternative error feedback mechanism, invoke it here
    } else {
      const payload = { email: userEmail, newUsername: newUsername.trim() };
      try {
        const response = await fetch('https://s24-final-back.azurewebsites.net/api/updateusername', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update username');
        // Close the modal on successful update
        setShowUpdateNameModal(false);
        setNewUsername(''); // Reset newUsername for next use
      } catch (error) {
        console.error('Error updating username:', error);
        // If you have an alternative error feedback mechanism, invoke it here
      }
    }
  };
  

  const setMainCar = async (email: string, mainCarId: string) => {
  try {
    const response = await fetch('https://s24-final-back.azurewebsites.net/api/SetMainCar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, mainCarId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Assume success and optimistically update the local state to reflect the new main car
    setUserInfo(prevUserInfo => ({
      ...prevUserInfo,
      mainCar: mainCarId,
    }));

    // Fetch the charge level for the new main car
    getChargeLevel(email, mainCarId);
  } catch (error) {
    console.error('Error setting main car:', error);
  }
};


const getChargeLevel = async (email: string, mainCarId: string) => {
  try {
    const response = await fetch('https://s24-final-back.azurewebsites.net/api/GetChargeLevel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ useremail: email, unique_id: mainCarId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    //console.log("Charge level response:", data);
    
    setLatestCharge({ uniqueId: mainCarId, charge: data.charge });
  } catch (error) {
    console.error('Error fetching charge level:', error);
  }
};

const handleEMPulse = async () => {
  try {
    const response = await fetch('https://s24-final-back.azurewebsites.net/api/EMpulse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ useremail: userEmail, unique_id: userInfo.mainCar }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    //const data = await response.json();
    //console.log("EM Pulse response:", data); // Debugging line

    // Assuming the function returns the updated charge level, update the state. Adjust according to the actual response.
    setLatestCharge({ uniqueId: userInfo.mainCar, charge: 0 });

    // Optionally, refresh the charge level display if necessary
    // getChargeLevel(userEmail, userInfo.mainCar); - no needs since I have it updated using SignalR
  } catch (error) {
    console.error('Error triggering EM pulse:', error);
  }
};

const handlePlus1to15 = async () => {
  try {
    const response = await fetch('https://s24-final-back.azurewebsites.net/api/plus1to15', { // Ensure the URL is correct
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ useremail: userEmail, unique_id: userInfo.mainCar }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  //const data = await response.json();
  //console.log("Plus 1-15 Percent response:", data); // Check if this logs a consistent, correct charge value


} catch (error) {
  console.error('Error triggering Plus 10 Percent:', error);
}
};


  
    
    
  

  return (
    <div className="account-container">
      <h2>Account Page</h2>
      <div className="account-info">
        Hello {userInfo.username}
        <FontAwesomeIcon icon={faPencilAlt} onClick={() => setShowUpdateNameModal(true)} className="edit-icon" />
      </div>
      <div className="account-info">Your email is: {userInfo.email}</div>
      <div className="account-info">
        You are here: {address || 'Fetching your address...'}
      </div>
      <div className="account-info">
        Your car is: {carInfo ? `${carInfo.brand} ${carInfo.model} (${carInfo.releaseYear})` : 'No car info'} 
      </div>
      <div className="charge-info">
        Current Main Car Charge: {latestCharge.charge}% 
      </div>
      
      <button className="base-button" onClick={toggleCarsList}>{showCarsList ? 'Hide' : 'Show'} My Garage</button>
      {showCarsList && (
        <div className="cars-list">
          <ul>
          {carsInfo.map((car, index) => (
          <li key={index}>
              <FontAwesomeIcon
                  icon={userInfo.mainCar === car.uniqueId ? solidStar : regularStar}
                  style={{ color: userInfo.mainCar === car.uniqueId ? '3c77bb' : '3c77bb', cursor: 'pointer' }}
                  onClick={() => setMainCar(userInfo.email, car.uniqueId)}
              />
              {` ${car.brand} ${car.model} (${car.releaseYear})`}
              
              <FontAwesomeIcon
                  icon={faTrashAlt}
                  className="delete-icon"
                  style={{ marginLeft: '10px', cursor: 'pointer' }} 
                  onClick={() => handleDeleteCar(car.uniqueId)}
              />
          </li>
      ))}




          </ul>
          <button className="base-button" onClick={toggleModal}>Add Car</button>
        </div>
      )}
      {showModal && (
        <div className="modal">
          <button className="close-modal" onClick={toggleModal}>X</button>
          <AddCar onUpdateCar={handleUpdateCar} />
        </div>
      )}
      {showUpdateNameModal && (
  <div className="modal">
    <input
      type="text"
      placeholder="New name"
      value={newUsername}
      onChange={(e) => setNewUsername(e.target.value)}
    />
    {/* Use FontAwesome icons instead of buttons */}
    <FontAwesomeIcon
      icon={faCheck}
      className="icon-button"
      style={{ color: 'blue' }}
      onClick={handleUpdateUsername}
      title="Update Username"
    />
    <FontAwesomeIcon
      icon={faTimes}
      className="icon-button"
      onClick={() => setShowUpdateNameModal(false)}
      title="Close"
    />
  </div>
  
)}

        <div className="bottom-buttons">
            <button onClick={handleEMPulse} className="bottom-button">EM Pulse</button>
            <button onClick={handlePlus1to15} className="bottom-button">Charge</button>
        </div>
    </div>
    
  );
};

export default Account;
