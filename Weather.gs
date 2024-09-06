// Replace with your actual API keys
const OPENWEATHERMAP_API_KEY = 'xxxxxxxx';
const GOOGLE_MAPS_API_KEY = 'xxxxxxx';
// const CITY = 'Kuala Lumpur';
// const USER_LOCATION = 'Jalan Teknologi 5, Taman Teknologi Malaysia, 57000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur'; // Replace with actual user's location

function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  return data;
}

function suggestRestaurant(city,address) {

  const weatherData = getWeather(city);
  const weatherDescription = weatherData.weather[0].description.toLowerCase();
  const temperature = weatherData.main.temp;
  const weatherEmoji = getWeatherEmoji(weatherDescription);
  const weaterTXT = `Weather in ${city}: ${weatherDescription} ${weatherEmoji}, ${temperature}°C`
  Logger.log(weaterTXT);

  const sheet = SpreadsheetApp.openById('19IMUVGxQUFI7iJyVP0AE72JjAe_Tu46E9PIuML90k_8').getSheetByName('Restaurants');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Remove headers from data

  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  cuisine = ['WESTERN']; // Default cuisine

  function appendCuisine(newCuisine) {
    if (!cuisine.includes(newCuisine)) {
      if (cuisine.length >= 3) {
        cuisine.shift(); // Remove the first element if list has more than 3 items
      }
      cuisine.push(newCuisine);
    }
  }

  function getRandomCuisine() {
    const cuisines = [
      'CHINESE', 'KOREAN', 'JAPANESE','ASIAN', 
    ];
    return cuisines[Math.floor(Math.random() * cuisines.length)];
  }

  if (weatherDescription.includes('rain') && temperature < 20) {
    appendCuisine('CHINESE, HOTPOT');
  } 
  if (temperature > 30 && weatherDescription.includes('sunny')) {
    appendCuisine('DESSERT');
  } 
  if (currentHour >= 12 && currentHour <= 13) {
    appendCuisine('AMERICAN, FAST FOOD');
  } 
  if (currentHour >= 18 && currentHour <= 21) {
    appendCuisine('ITALIAN');
  } 
  if (currentHour >= 7 && currentHour <= 9) {
    appendCuisine('WESTERN, PASTRIES');
  } 
  if (weatherDescription.includes('rain')) {
    appendCuisine('PORTUGUESE');
  } 
  appendCuisine(getRandomCuisine());

  const nearestRestaurant = getNearestRestaurantByCuisine(data, cuisine,address);
  Logger.log(`Suggested Restaurant: ${nearestRestaurant.name}`);
  Logger.log(`Address: ${nearestRestaurant.address}`);
  Logger.log(`Cuisine: ${nearestRestaurant.cuisine}`);
  Logger.log(`Image: ${nearestRestaurant.image}`);
  Logger.log(`Driving Time: ${nearestRestaurant.drivingTime}`);

  const recommendSheet = SpreadsheetApp.openById('19IMUVGxQUFI7iJyVP0AE72JjAe_Tu46E9PIuML90k_8').getSheetByName('RecommendRestaurant');
  const lastRow = recommendSheet.getLastRow();

  recommendSheet.getRange(lastRow, 4).setValue(nearestRestaurant.name); // Restaurant Name
  recommendSheet.getRange(lastRow, 5).setValue(nearestRestaurant.address); // Restaurant Address
  recommendSheet.getRange(lastRow, 6).setValue(nearestRestaurant.cuisine); // Cuisine Type
  recommendSheet.getRange(lastRow, 7).setValue(nearestRestaurant.drivingTime); // Distance
  recommendSheet.getRange(lastRow, 8).setValue(nearestRestaurant.image); // Image
  recommendSheet.getRange(lastRow, 9).setValue(weaterTXT); // weather txt
  recommendSheet.getRange(lastRow, 10).setValue(nearestRestaurant.rating+" ⭐"); // weather txt
  Logger.log('Recommendation saved successfully.');
}

function getWeatherEmoji(description) {
  if (description.includes('clear')) {
    return '☀️'; // Clear sky
  } else if (description.includes('clouds')) {
    return '☁️'; // Cloudy
  } else if (description.includes('rain')) {
    return '🌧️'; // Rainy
  } else if (description.includes('thunderstorm')) {
    return '⛈️'; // Thunderstorm
  } else if (description.includes('snow')) {
    return '❄️'; // Snowy
  } else if (description.includes('mist') || description.includes('fog')) {
    return '🌫️'; // Mist/Fog
  } else {
    return '🌈'; // Default for other weather conditions
  }
}

function getNearestRestaurantByCuisine(data, cuisine,user_location) {
  let nearestRestaurant = {
    name: 'No suitable restaurant found',
    address: '',
    image:'',
    rating:'',
    cuisine: '',
    drivingTime: '',
  };

  let minTime = Number.MAX_VALUE;

  for (let i = 0; i < data.length; i++) {
    if (cuisine.includes(data[i][4])) {
      const address = data[i][2]; // Assuming the address is in the third column
      const drivingDetail = getDrivingDetail(user_location, address);
      const drivingTime = drivingDetail.drivingTime;
      const drivingDistance = drivingDetail.distance;

      if (drivingTime < minTime) {
        minTime = drivingTime;
        nearestRestaurant = {
          name: data[i][1], // Restaurant name
          address: data[i][2], // Restaurant address
          cuisine: data[i][4], // Cuisine type
          image: data[i][7],
          rating: data[i][5],
          drivingTime: `${drivingDistance}KM (ETA: ${drivingTime} minutes)`,
        };
      }
    }
  }
  return nearestRestaurant;
}

function getDrivingDetail(origin, destination) {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  if (data.rows[0].elements[0].status === 'OK') {
    const duration = data.rows[0].elements[0].duration.value; // Duration in seconds
    const distance = data.rows[0].elements[0].distance.value;

    return {
      drivingTime: Math.ceil(duration / 60), // Convert to minutes and round up
      distance: Math.ceil(distance / 1000) // Convert to kilometers and round up
    };
  } else {
    return {
      drivingTime: Number.MAX_VALUE, // If no result, return a very large number
      distance: Number.MAX_VALUE // If no result, return a very large number
    };
  }
}

////////////////////////// testing

function testSuggestRestaurant(){
  suggestRestaurant("Kuala Lumpur","Jalan Teknologi 5, Taman Teknologi Malaysia, 57000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur");
}