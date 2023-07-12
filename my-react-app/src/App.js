import Coldbg from './assets/cold.jpg';
import Hotbg from './assets/hot.jpg';
import Descriptions from './components/Descriptions';
import { useEffect, useState } from 'react';
import { getFormattedWeatherData } from './weatherService';

function App () {
  const [ city, setCity] = useState('Taguig');
  const [weather, setWeather] = useState(null);
  const [units, setUnits] = useState('metric');
  const [bg, setBg] = useState(Hotbg);


  useEffect (() => {
    const fetchWeatherData = async () => {
    const data = await getFormattedWeatherData(city, units);
    setWeather(data);
      // for background dependent on weather
      const threshold = units === 'metric'? 20 : 60;
      if (data.temp <= threshold) setBg(Coldbg);
      else setBg(Hotbg);
    }
    fetchWeatherData();
  }, [city, units]);

  const handleUnitsClick = (e) => {
    
     setUnits (function ( units ) {
      return units === 'metric'? 'imperial' : 'metric';
     });
  };

  const enterKeyPressed = (e) => {
    if (e.keyCode === 13) {
      setCity(e.currentTarget.value)
      e.currentTarget.blur();
    }

  }

  return ( 
    <div className='app' style={{backgroundImage: `url(${bg})`}}>
      <div className="overlay">
        { weather && (
          <div className="container">
          <div className="section section__inputs">
            <input onKeyDown={enterKeyPressed} type="text" name='city' placeholder='Enter City...' />
            <button onClick={(e) => handleUnitsClick(e)}>°F</button>
          </div>
          <div className="section section__temperature">
            <div className="icon">
              <h3> {`${weather.name}, ${weather.country}`} </h3>
              <img src= {weather.iconURL} alt="weatherIcon"
               />
               <h3>{weather.description}</h3>
            </div>
            <div className="temperature">
              <h1>{`${weather.temp.toFixed()} °${units === 'metric' ? 'C' : 'F'}`}</h1>
            </div>
            {/* bottom description */}
          </div>
          <Descriptions weather = {weather} units={units} />
        </div>
        )}
      </div>
    </div>
  );
}

export default App;

