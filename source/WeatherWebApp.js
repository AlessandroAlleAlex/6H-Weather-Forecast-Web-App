"strict mode";

let imageArray = []; // global variable to hold stack of images for animation  (will hold 10 images)
let count = 0; // global var
let animationCountTablet = 0; // 0-9
let animationCountWeb = 0; // 0-9
// ask longitude question (how to limit the range and how to print the 'not found message')
// ask image not coverage question (san jose tab example)

function mySlideDown(slider) {
  let slideDown = document.getElementById(slider);
  document.getElementById("downArrow").style.display = "none";
  document.getElementById("upArrow").style.display = "inline";
  slideDown.style.transition = "all 2s";
  slideDown.style.height = "815px";
}
function mySlideUp(slider) {
  let slideUp = document.getElementById(slider);
  document.getElementById("downArrow").style.display = "inline";
  document.getElementById("upArrow").style.display = "none";
  slideUp.style.transition = "all 2s";
  slideUp.style.height = "0px";
}

// start: (Animation)-----------------------------------------------------------------------------------------
function myAnimationWeb() {
  if (animationCountWeb >= 9) {
    animationCountWeb = 0;
  }
  document
    .getElementById("animationWeb")
    .appendChild(imageArray[animationCountWeb]);
  document.getElementById("doppler_" + animationCountWeb).style.display =
    "inline";
  document.getElementById("doppler_" + animationCountWeb).style.width = "80%";
  animationCountWeb++;
  // animationCountTablet++;
}
function myAnimationTablet() {
  if (animationCountWeb >= 9) {
    animationCountWeb = 0;
  }
  document
    .getElementById("animationTablet")
    .appendChild(imageArray[animationCountWeb]);
  document.getElementById("doppler_" + animationCountWeb).style.display =
    "inline";
  document.getElementById("doppler_" + animationCountWeb).style.width = "80%";
  animationCountWeb++;
}
//end : (Animation)-----------------------------------------------

// start: (get image fromt the server)-------------------------------------------------------------------------
function addToArray(newImage) {
  if (count < 10) {
    newImage.id = "doppler_" + count;
    newImage.style.display = "none";
    imageArray.push(newImage);
    count = count + 1;
    if (count >= 10) {
      console.log("Got 10 doppler images");
    }
  }
}

function tryToGetImage(dateObj) {
  // tries to get one image from the server
  let dateStr = dateObj.getUTCFullYear();
  dateStr += String(dateObj.getUTCMonth() + 1).padStart(2, "0"); //January is 0!
  dateStr += String(dateObj.getUTCDate()).padStart(2, "0");

  let timeStr = String(dateObj.getUTCHours()).padStart(2, "0");
  timeStr += String(dateObj.getUTCMinutes()).padStart(2, "0");

  let filename = "DAX_" + dateStr + "_" + timeStr + "_N0R.gif";
  let newImage = new Image();
  newImage.onload = function() {
    // get the new image the puts it into the global array
    addToArray(newImage);
  };
  newImage.onerror = function() {};
  newImage.src = "http://radar.weather.gov/ridge/RadarImg/N0R/DAX/" + filename;
}

function getTenImages() {
  // try to get 10 images
  let dateObj = new Date(); // defaults to current date and time
  // if we try 150 images, and get one out of every 10, we should get enough
  for (let i = 0; i < 150; i++) {
    newImage = tryToGetImage(dateObj);
    dateObj.setMinutes(dateObj.getMinutes() - 1); // back in time one minute
  }
}
// end: (get image fromt the server)-------------------------------------------------------------------------

function time24h(object) {
  let strTime = object.dt_txt.slice(11, 13);
  let intTime = parseInt(strTime, 10);
  intTime = intTime - 8; // UTC to PST
  if (intTime < 0) {
    intTime = intTime + 24;
  }
  return intTime;
}

function timeConversion(object) {
  let strTime = object.dt_txt.slice(11, 13);
  let intTime = parseInt(strTime, 10);
  if (intTime === 0) {
    intTime = 12;
  }
  if (intTime < 12) {
    // strTime = intTime.toString() + " AM";
    intTime = intTime - 8; // UTC to PST
    if (intTime < 0) {
      intTime = intTime + 12;
      strTime = intTime.toString() + " PM";
    } else {
      if (intTime === 0) {
        intTime = 12;
      }
      strTime = intTime.toString() + " AM";
    }
  } else {
    intTime = intTime - 12; //12h conversion
    if (intTime === 0) {
      intTime = 12;
    }
    // strTime = intTime.toString() + " PM";
    intTime = intTime - 8; // UTC to PST
    if (intTime < 0) {
      intTime = intTime + 12;
      strTime = intTime.toString() + " AM";
    } else {
      if (intTime === 0) {
        intTime = 12;
      }
      strTime = intTime.toString() + " PM";
    }
  }
  return strTime;
}

function parseTemp(object) {
  let temp = object.main.temp;
  return Math.round(temp);
}

function selectWeather(object) {
  let weather = object.weather[0].icon;
  switch (weather) {
    case "01n":
    case "01d":
      if (time24h(object) >= 6 && time24h(object) < 19) {
        return "../assets/clearsky.svg";
      }
      return "../assets/clear-night.svg";
    case "02n":
    case "02d":
      if (time24h(object) >= 6 && time24h(object) < 19) {
        return "../assets/fewclouds-day.svg";
      }
      return "../assets/fewclouds-night.svg";
    case "03n":
    case "03d":
      return "../assets/scatteredclouds.svg";
    case "04n":
    case "04d":
      return "../assets/brokencloud.svg";
    case "09n":
    case "09d":
      return "../assets/showerrain.svg";
    case "10n":
    case "10d":
      if (time24h(object) >= 6 && time24h(object) < 19) {
        return "../assets/rain-day.svg";
      }
      return "../assets/rain-night.svg";
    case "11n":
    case "11d":
      return "../assets/thunderstorms.svg";
    case "13n":
    case "13d":
      return "../assets/snow.svg";
    case "50n":
    case "50d":
      return "../assets/mist.svg";
    default:
      console.log("Weather Selection Error");
      break;
  }
}

// Do a CORS request to get Davis weather hourly forecast
// Create the XHR object.
function createCORSRequest(method, url) {
  let xhr = new XMLHttpRequest();
  xhr.open(method, url, true); // call its open method
  return xhr;
}

// Make the actual CORS request.
function makeCorsRequest(city = "Davis, CA, USA") {
  // default city value
  let api = "http://api.openweathermap.org/data/2.5/forecast/hourly?q=";
  let units = "&units=imperial";
  let key = "<put your own OpenWehaterMap API key here>";
  let url = api + city + units + key;

  let xhr = createCORSRequest("GET", url);

  // checking if browser does CORS
  if (!xhr) {
    alert("CORS not supported");
    return;
  }

  // Load some functions into response handlers.
  xhr.onload = function() {
    let responseStr = xhr.responseText; // get the JSON string
    let object = JSON.parse(responseStr); // turn it into an object
    let parsedLat = object.city.coord.lat;
    let parsedLon = object.city.coord.lon;
    let calcRange =
      Math.pow(parsedLat - 38.5816, 2) + Math.pow(parsedLon + 121.4944, 2);
    let milesInDegree = 150 / 69;

    if (calcRange <= Math.pow(milesInDegree, 2)) {
      // math for latitude and longitude calculation within 150 miles radius
      let setTime1 = timeConversion(object.list[0]); // current time
      let setTime2 = timeConversion(object.list[1]); // 1h time
      let setTime3 = timeConversion(object.list[2]); // 2h time
      let setTime4 = timeConversion(object.list[3]); // 3h time
      let setTime5 = timeConversion(object.list[4]); // 4h time
      let setTime6 = timeConversion(object.list[5]); // 5h time
      document.getElementById("tabletCurrentHourId").textContent = setTime1;
      document.getElementById("currentHourId").textContent = setTime1;
      document.getElementById("h2Time").textContent = setTime2;
      document.getElementById("h3Time").textContent = setTime3;
      document.getElementById("h4Time").textContent = setTime4;
      document.getElementById("h5Time").textContent = setTime5;
      document.getElementById("h6Time").textContent = setTime6;

      // let temp = object.list[0].main.temp;
      // console.log(Math.round(temp));
      let setTemp1 = parseTemp(object.list[0]);
      let setTemp2 = parseTemp(object.list[1]);
      let setTemp3 = parseTemp(object.list[2]);
      let setTemp4 = parseTemp(object.list[3]);
      let setTemp5 = parseTemp(object.list[4]);
      let setTemp6 = parseTemp(object.list[5]);
      document.getElementById("currentTempId").textContent = setTemp1 + "°";
      document.getElementById("tabletCurrentTempId").textContent =
        setTemp1 + "°";
      document.getElementById("h2Temp").textContent = setTemp2 + "°";
      document.getElementById("h3Temp").textContent = setTemp3 + "°";
      document.getElementById("h4Temp").textContent = setTemp4 + "°";
      document.getElementById("h5Temp").textContent = setTemp5 + "°";
      document.getElementById("h6Temp").textContent = setTemp6 + "°";

      // let weather = object.list[0].weather[0].description;
      // console.log(weather);
      // console.log(parseInt(timeConversion(object.list[0])));
      let setWeather1 = selectWeather(object.list[0]);
      let setWeather2 = selectWeather(object.list[1]);
      let setWeather3 = selectWeather(object.list[2]);
      let setWeather4 = selectWeather(object.list[3]);
      let setWeather5 = selectWeather(object.list[4]);
      let setWeather6 = selectWeather(object.list[5]);
      document.getElementById("img1").src = setWeather1;
      document.getElementById("img2").src = setWeather2;
      document.getElementById("img3").src = setWeather3;
      document.getElementById("img4").src = setWeather4;
      document.getElementById("img5").src = setWeather5;
      document.getElementById("img6").src = setWeather6;
    } else {
      // not in range
      console.log(" NOT WITHIN THE 150 MILES RADIUS FROM SACRAMENTO");
      alert(
        "THE CITY SELECTED IS NOT WITHIN A 150 MILES RADIUS FROM SACRAMENTO. PLEASE TRY AGAIN (WEATHER ICONS AND TEMPERAURES ARE THAT OF THE LAST SEARCH)"
      );
    }

    console.log(JSON.stringify(object, undefined, 2)); // print it out as a string, nicely formatted
  };

  xhr.onerror = function() {
    alert("Woops, there was an error making the request.");
  };

  // Actually send request to server
  xhr.send();
}
// run this code to make request when this script file gets executed
makeCorsRequest();
getTenImages();

setInterval(function() {
  myAnimationWeb();
  myAnimationTablet();
}, 250); // call myAnimation() every 250 milliseconds.

function myFunction() {
  let inputCity = document.getElementById("textBar").value;
  // console.log(inputCity);
  makeCorsRequest(inputCity);
}

// Pacific Standard Time | subtract 8 hours from UTC
