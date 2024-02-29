import React, { useState, useEffect } from 'react';

interface Car {
  id: string;
  carId: string;
  brand: string;
  model: string;
  releaseYear: number;
  usableBatterySize: number;
}

interface CarData {
  brand: string;
  model: string;
  year: string;
  batterySize: string;
}

interface AddCarProps {
  onUpdateCar: () => void;
}

const AddCar: React.FC<AddCarProps> = ({ onUpdateCar }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [carData, setCarData] = useState<CarData>({ brand: '', model: '', year: '', batterySize: '' });
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [batterySizes, setBatterySizes] = useState<string[]>([]);

  // Fetch cars from the API
  useEffect(() => {
    fetch('https://s24-final-back.azurewebsites.net/api/GetCars')
      .then((response) => response.json())
      .then((data: Car[]) => {
        setCars(data);
        const uniqueBrands = Array.from(new Set(data.map(car => car.brand)));
        uniqueBrands.sort();
        setBrands(uniqueBrands);
      });
  }, []);

  useEffect(() => {
    if (carData.brand) {
      const filteredModels = cars.filter(car => car.brand === carData.brand).map(car => car.model);
      setModels(Array.from(new Set(filteredModels)));
      setCarData(prev => ({ ...prev, model: '', year: '', batterySize: '' }));
    }
  }, [carData.brand, cars]);

  useEffect(() => {
    if (carData.model) {
      const filteredYears = cars.filter(car => car.model === carData.model).map(car => car.releaseYear.toString());
      setYears(Array.from(new Set(filteredYears)));
      setCarData(prev => ({ ...prev, year: '', batterySize: '' }));
    }
  }, [carData.model, cars]);

  useEffect(() => {
    if (carData.year && carData.model && carData.brand) {
      // Filter cars based on the selected brand, model, and year
      const filteredCars = cars.filter(car =>
        car.brand === carData.brand &&
        car.model === carData.model &&
        car.releaseYear.toString() === carData.year
      );
      // Extract usable battery sizes from filtered cars
      const filteredBatterySizes = filteredCars.map(car => `${car.usableBatterySize} kWh`);
  
      // Set unique battery sizes
      setBatterySizes(Array.from(new Set(filteredBatterySizes)));
      setCarData(prev => ({ ...prev, batterySize: '' })); // Reset battery size selection
    }
  }, [carData.year, carData.model, carData.brand, cars]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedCar = cars.find(car =>
      car.brand === carData.brand &&
      car.model === carData.model &&
      car.releaseYear.toString() === carData.year &&
      `${car.usableBatterySize} kWh` === carData.batterySize
    );
  
    if (selectedCar) {
      const userEmail = sessionStorage.getItem("userEmail");
  
      if (userEmail) {
        const payload = {
          email: userEmail,
          car: selectedCar.carId
        };
  
        try {
          const response = await fetch('https://s24-final-back.azurewebsites.net/api/updatecar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
  
          if (response.ok) {
            console.log('Car updated successfully!');
            onUpdateCar(); // Update the car information displayed in the account
            window.location.reload(); // Trigger page refresh
          } else {
            console.error('Failed to update car:', response.statusText);
          }
        } catch (error) {
          console.error('An error occurred while updating car:', error);
        }
      } else {
        console.error('User email not found in sessionStorage!');
      }
    } else {
      console.error('Selected car not found!');
    }
  };
  
  

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCarData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Brand</label>
        <select name="brand" value={carData.brand} onChange={handleChange}>
          <option value="">Select Brand</option>
          {brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Model</label>
        <select name="model" value={carData.model} onChange={handleChange} disabled={!carData.brand}>
          <option value="">Select Model</option>
          {models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Year</label>
        <select name="year" value={carData.year} onChange={handleChange} disabled={!carData.model}>
          <option value="">Select Year</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Battery Size</label>
        <select name="batterySize" value={carData.batterySize} onChange={handleChange} disabled={!carData.year}>
          <option value="">Select Battery Size</option>
          {batterySizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
      <button type="submit">Add Car</button>
    </form>
  );
};

export default AddCar;
