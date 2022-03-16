// constans
const side_length = 250;
const radius = side_length / 2;
const inner_clock_radius = side_length / 3.5;

// setting up canvas
const canvas = document.querySelector('#clock');
const ctx = canvas.getContext('2d');
canvas.width = side_length;
canvas.height = side_length;

// canvas background
ctx.fillStyle = '#EDEDED';
ctx.fillRect(0, 0, side_length, side_length);


// inner clock functionality

function drawInnerClock() {
   // get the current time
   let date = new Date;
   let seconds = date.getSeconds();
   let minutes = date.getMinutes();
   let hours = date.getHours();

   drawInnerClockFace();
   drawSecondsHand(seconds);
   drawMinutesHand(minutes);
   drawHoursHand(hours);
}

function drawInnerClockFace() {
   ctx.beginPath();
   ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
   ctx.shadowBlur = 10;
   ctx.arc(radius, radius, inner_clock_radius, 0, Math.PI * 2, false);
   ctx.fillStyle = 'rgba(255, 255, 255, 0.67)';
   ctx.fill();
   ctx.shadowColor = 'rgba(0,0,0,0)';;
}

function drawSecondsHand(seconds){
   ctx.save();
   // Calculate rotation angle
   let seconds_angle = (360 / 60) * seconds;
   let seconds_hand_length = inner_clock_radius * 0.9
   // Rotating canvas
   ctx.translate(radius, radius);
   ctx.rotate(seconds_angle * Math.PI / 180);
   // Drawing seconds hand path
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.lineTo(0, -seconds_hand_length);
   ctx.lineWidth = 2;
   ctx.lineCap = 'round';
   ctx.strokeStyle = 'black';
   ctx.stroke();
   // Reverting canvas rotation
   ctx.restore();
}

function drawMinutesHand(minutes) {
   ctx.save()
   // Calculate rotation angle
   let minutes_angle = (360 / 60) * minutes;
   let minutes_hand_length = inner_clock_radius * 0.8;
   // Rotating canvas
   ctx.translate(radius, radius);
   ctx.rotate(minutes_angle * Math.PI / 180);
   // Drawing minutes hand path
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.lineTo(0, -minutes_hand_length);
   ctx.lineWidth = 4;
   ctx.lineCap = 'round';
   ctx.strokeStyle = 'black';
   ctx.stroke();
   ctx.restore();
}

function drawHoursHand(hours) {
   ctx.save();
   // Calculate rotation angle
   let hours_angle = (360 / 12) * hours;
   let hours_hand_length = inner_clock_radius * 0.5;
   // Rotating canvas
   ctx.translate(radius, radius);
   ctx.rotate(hours_angle * Math.PI / 180);
   // Drawing minutes hand path
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.lineTo(0, -hours_hand_length);
   ctx.lineWidth = 6;
   ctx.lineCap = 'round';
   ctx.strokeStyle = 'black';
   ctx.stroke();
   ctx.restore();
}

function draw24hClockHand () {
   // get time
   let date = new Date;
   let h = date.getHours();
   let min = date.getMinutes();
   let time_in_min = h * 60 + min;

   ctx.save();
   // Calculate rotation angle
   let angle = ((360 / (24 * 60)) * time_in_min) - 180;
   let hand_length = radius - 10;
   // Rotating canvas
   ctx.translate(radius, radius);
   ctx.rotate(angle * Math.PI / 180);
   ctx.beginPath();
   ctx.moveTo(0, 0);
   ctx.lineTo(0, -hand_length);
   ctx.lineWidth = 4;
   ctx.lineCap = 'round';
   ctx.strokeStyle = 'white';
   ctx.stroke();
   ctx.restore();
}


// Animated inner clock until outer clock in loaded
let innerClockInvervalID = setInterval(() => {
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   drawInnerClock();
   setDigitalClock();
}, 1000);

// Fetching sun dial API data

// Getting laditude and longitude
if('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
            fetchSolarTime(position.coords.latitude, position.coords.longitude);
            fetchWeather(position.coords.latitude, position.coords.longitude);
         }
      )
} else {
      console.log("geolocation available")
}

const fetchSolarTime = async (lat, long) => {
   try{
      // Fetch sunrise and sunset time
      const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${long}`);
      const data = await response.json();

      // Fetch location name
      const location_name_response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`);
      const location_name_data = await location_name_response.json();

      // Display Users Location
      let location = document.querySelector(".location-text");
      location.innerText = `${location_name_data.address.city}, ${location_name_data.address.country}`;
      
      // Calc utc offset
      let utc_offset = new Date;
      utc_offset = utc_offset.getTimezoneOffset() / 60 * -1;
      
      // Extract relevant time data from API response
      let sunriseArr = extractTimeData(data.results.sunrise, utc_offset),
          sunsetArr = extractTimeData(data.results.sunset, utc_offset),
          first_lightArr = extractTimeData(data.results.civil_twilight_begin, utc_offset),
          last_lightArr = extractTimeData(data.results.civil_twilight_end, utc_offset);

      // Convert time array into angle for 24h face clock
      let sunrise_angle = -((720 - calcTimeInMin(sunriseArr)) * 0.25),
          sunset_angle = calcTimeInMin(sunsetArr) * 0.25,
          first_light_angle = -((720 - calcTimeInMin(first_lightArr)) * 0.25),
          last_light_angle = calcTimeInMin(last_lightArr) * 0.25;
      
      // Drawing slices on 24h clock
      setInterval(() => {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         //dark blue - sun down
         drawSlice('#12276F', 1, -1);
         //blue - sun getting up and down
         drawSlice('#14AAFF', first_light_angle, last_light_angle);
         //light blue - sun up
         drawSlice('#89C6FF', sunrise_angle, sunset_angle);
         draw24hClockHand();
         ctx.beginPath();
         ctx.arc(radius, radius, radius, 0, Math.PI * 2, false)
         ctx.strokeStyle = '#EDEDED';
         ctx.stroke();
         drawInnerClock();
         setDigitalClock();
      },1000);

      // Stop initial inner clock that works until API data is loaded
      clearInterval(innerClockInvervalID);

      // Enter sunrise, sunset etc. data into html document
      let   sunrise = document.querySelector("#sunrise"),
            sunset = document.querySelector("#sunset"),
            first_light = document.querySelector("#first-light"),
            last_light = document.querySelector("#last-light");

      sunrise.innerHTML = addZeroPrefix(sunriseArr[0]) + ":" + addZeroPrefix(sunriseArr[1]);
      first_light.innerHTML = addZeroPrefix(first_lightArr[0]) + ":" + addZeroPrefix(first_lightArr[1]);
      sunset.innerHTML = (sunsetArr[0] + 12) + ":" + addZeroPrefix(sunsetArr[1]);
      last_light.innerHTML = (last_lightArr[0] + 12) + ":" + addZeroPrefix(last_lightArr[1]);
   }
   catch(e) {
      console.log("Error!", e);
   }
}

const fetchWeather = async (lat, long) => {
   try {
      // You have to paste your openweathermap api key in the next line at YOUR_API_KEY
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=YOUR_API_KEY`);
      const data = await response.json();
      let temp = Math.floor(data.main.temp - 273.15);
      let temp_display = document.querySelector(".temperature");
      temp_display.innerText = temp + "°";
      let weather_icon = data.weather[0].icon.replace(/\s/g, "_");
      document.querySelector(".weather-icon").src = `images/${weather_icon}.png`
   } catch(e) {
      console.log("Error!", e);
   }
}

// extract time data from solar time API response
function extractTimeData (timeString, utc_offset) {
   let numFilter = new RegExp(/(\d+)/, 'g');
   let timeData = [];
   timeData.push(parseInt(timeString.match(numFilter)[0]) + utc_offset);
   timeData.push(parseInt(timeString.match(numFilter)[1]));
   
   return timeData;
}

function calcTimeInMin (timeArr) {
   return timeArr[0] * 60 + timeArr[1];
}

function drawSlice(color, start, end) {
   $('canvas').drawSlice({
      fillStyle: color,
      x: radius, y: radius,
      radius: radius,
      start: start, end: end
   });
}

function setDigitalClock() {
   let digital_clock = document.querySelector(".digital-clock")
   let date = new Date;
   digital_clock.textContent = addZeroPrefix(date.getHours()) + ":" + addZeroPrefix(date.getMinutes());
}

function addZeroPrefix(num){
   let s = num + "";
   while(s.length < 2){
      s = "0" + s;
   }
   return s;
}