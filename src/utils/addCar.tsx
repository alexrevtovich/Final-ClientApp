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

const AddCar: React.FC = () => {
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
    if (carData.year) {
      // Filter cars based on the selected year and then map to their usableBatterySize
      const filteredBatterySizes = cars
        .filter(car => car.releaseYear.toString() === carData.year)
        .map(car => `${car.usableBatterySize} kWh`); // Format for display
  
      // Convert array to Set to unique values, then back to array to remove duplicates
      setBatterySizes(Array.from(new Set(filteredBatterySizes)));
      setCarData(prev => ({ ...prev, batterySize: '' })); // Reset battery size selection
    }
  }, [carData.year, cars]);
  

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitting Car Data:', carData);
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
