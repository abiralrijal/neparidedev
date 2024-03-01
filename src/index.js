import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { firebaseConfig } from "./firebaseconfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage();

const imageID = "yk1wgfgns";

// This is for the sign up page -----------------------------------------------------------------------------------------------
function signup() {
  const uname = document.querySelector("#first");
  const email = document.querySelector("#email");
  const pword = document.querySelector("#password");
  const sbtn = document.querySelector("#sbtn");

  async function addData(col, docID, username) {
    console.log(username);
    await setDoc(doc(db, col, docID), {
      displayname: username,
    });
    window.location.replace("./app.html");
  }

  document.getElementById("rentersignup").addEventListener("submit", e => {
    e.preventDefault();
    sbtn.textContent = "Creating ...";

    createUserWithEmailAndPassword(auth, email.value, pword.value)
      .then(credentials => {
        console.log(credentials);
        addData("users", auth.currentUser.uid, uname.value);
        credentials.user.displayName = uname.value;
        console.log(credentials.user.displayName);
      })
      .catch(err => {
        console.log(err.code);
        alert(err.message);
      });
  });
}

// This is for the login page ------------------------------------------------------------------------------------------------
function login() {
  const email = document.querySelector("#email");
  const pword = document.querySelector("#password");

  document.getElementById("renterlogin").addEventListener("submit", e => {
    e.preventDefault();

    signInWithEmailAndPassword(auth, email.value, pword.value)
      .then(credentials => {
        console.log(credentials);
        window.location.replace("./app.html");
      })
      .catch(err => {
        console.log(err.code);
        console.log(err.message);
      });
  });
}

// This is for the app.html page --------------------------------------------------------------------------------------------
function application() {
  const loggeduser = document.querySelector("#user");

  async function getDisplayName(usr) {
    const docRef = doc(db, "users", usr.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      loggeduser.textContent = `Hello, ${docSnap.data().displayname}`;
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }

  // Check if user is signed in
  auth.onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      console.log("User is signed in:", user);
      getDisplayName(user);

      getCars();
      document.querySelector("#logoutbtn").style.opacity = "100%";
      document.querySelector("#logoutbtn").addEventListener("click", () => {
        signOut(auth)
          .then(() => {
            console.log("User signed out successfully");
            window.location.href = "/loginrenter.html";
          })
          .catch(error => {
            console.error("Error signing out:", error.message);
          });
      });
    } else {
      // User is signed out
      alert("User is signed out");
    }
  });

  async function getCars() {
    try {
      // Fetch cars collection from Firestore
      const carsSnapshot = await getDocs(collection(db, "cars"));

      // Iterate over documents and create cards
      carsSnapshot.forEach(doc => {
        const carData = doc.data();
        console.log(doc.id);

        const funurl = carData.imageUrl.split("/");
        createCarArticle(
          carData.ratePerHour,
          carData.carName,
          carData.carType,
          carData.passengerSeats,
          `https://ik.imagekit.io/${imageID}/o/${funurl[7]}&tr=w-300,h-300`,
          doc.id
        );

        document
          .querySelector(`[data-url="${doc.id}"]`)
          .addEventListener("click", () => {
            window.location.href = `/carsdetail.html?docid=${doc.id}`;
          });
      });
    } catch (error) {
      console.error("Error fetching cars:", error);
      alert(error.message);
    }
  }

  function createCarArticle(
    rateText,
    carNameText,
    carTypeText,
    carSeatsText,
    carImageSrc,
    documenturl
  ) {
    // Create article element
    var article = document.createElement("article");
    article.classList.add("plan", "card");

    // Create inner div
    var innerDiv = document.createElement("div");
    innerDiv.classList.add("inner");

    // Create pricing span
    var pricingSpan = document.createElement("span");
    pricingSpan.classList.add("pricing");

    var pricingContent = document.createElement("span");
    pricingContent.innerHTML =
      '&#8377;<span id="rate">' + rateText + "</span> <small>/ hr</small>";

    pricingSpan.appendChild(pricingContent);

    // Create car image
    var carImage = document.createElement("img");
    carImage.src = carImageSrc;
    carImage.classList.add("carimg");
    carImage.id = "carimage";
    carImage.alt = "Car image";

    // Create car name heading
    var carNameHeading = document.createElement("h2");
    carNameHeading.classList.add("title");
    carNameHeading.id = "carname";
    carNameHeading.innerHTML = carNameText;

    // Create details list
    var detailsList = document.createElement("dl");
    detailsList.classList.add("details");

    // Create Type details
    var typeDetails = document.createElement("div");
    var typeDt = document.createElement("dt");
    typeDt.innerHTML = "Type";
    var typeDd = document.createElement("dd");
    typeDd.id = "cartype";
    typeDd.innerHTML = carTypeText;
    typeDetails.appendChild(typeDt);
    typeDetails.appendChild(typeDd);

    // Create Seats details
    var seatsDetails = document.createElement("div");
    var seatsDt = document.createElement("dt");
    seatsDt.innerHTML = "Seats";
    var seatsDd = document.createElement("dd");
    seatsDd.id = "carseats";
    seatsDd.innerHTML = carSeatsText;
    seatsDetails.appendChild(seatsDt);
    seatsDetails.appendChild(seatsDd);

    detailsList.appendChild(typeDetails);
    detailsList.appendChild(seatsDetails);

    // Create book button
    var bookButton = document.createElement("button");
    bookButton.classList.add("button");
    bookButton.id = "bookbtn";
    bookButton.dataset.url = documenturl;
    bookButton.innerHTML = "BOOK NOW";

    // Append all created elements to the inner div
    innerDiv.appendChild(pricingSpan);
    innerDiv.appendChild(carImage);
    innerDiv.appendChild(carNameHeading);
    innerDiv.appendChild(detailsList);
    innerDiv.appendChild(bookButton);

    // Append inner div to the article
    article.appendChild(innerDiv);

    // Append the element to the documents
    document.querySelector(".cards").appendChild(article);

    // document.querySelector(`.${documenturl}`).addEventListener("click", () => {
    //   window.location.href = `/dist/carsdetail.html?docid=${documenturl}`;
    // });
  }
}

// This is for the carsdetail.html page -------------------------------------------------------------------------------------
function carBook() {
  const loggeduser = document.querySelector("#user");
  let userIdentification = "";
  let totalCost = 0;

  const urlParams = new URLSearchParams(window.location.search);
  const docid = urlParams.get("docid");

  async function getDisplayName(usr) {
    const docRef = doc(db, "users", usr.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      loggeduser.textContent = `Hello, ${docSnap.data().displayname}`;
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }

  // Check if user is signed in
  auth.onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      console.log("User is signed in:", user);
      getDisplayName(user);
      getCars();
      userIdentification = user.uid;

      document.querySelector("#logoutbtn").style.opacity = "100%";
      document.querySelector("#logoutbtn").addEventListener("click", () => {
        signOut(auth)
          .then(() => {
            console.log("User signed out successfully");
            window.location.href = "/loginrenter.html";
          })
          .catch(error => {
            console.error("Error signing out:", error.message);
          });
      });
    } else {
      // User is signed out
      alert("User is signed out");
    }
  });

  async function getCars() {
    try {
      // Fetch cars collection from Firestore
      const carsSnapshot = await getDoc(doc(db, "cars", docid));
      const carData = carsSnapshot.data();
      const funurl = carData.imageUrl.split("/");

      createCarDetailsElement(
        carData.carName,
        carData.manufacturedDate,
        carData.carType,
        carData.passengerSeats,
        carData.ratePerHour,
        carData.vehicleNumber,
        `https://ik.imagekit.io/${imageID}/o/${funurl[7]}&tr=w-500,h-400`
      );
      console.log(carData);
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  }

  function createCarDetailsElement(
    carName,
    manufacturedDate,
    fuelType,
    passengerSeats,
    ratePerHour,
    vehicleNumber,
    imageUrl
  ) {
    // Create the div element with class 'full-page-card'
    const fullPageCardDiv = document.createElement("div");
    fullPageCardDiv.classList.add("full-page-card");

    // Create the inner div element with class 'card'
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    // HTML content for the car details
    const carDetailsHTML = `
    <form name="booking" id="bookingform">
    <h2>Car Details</h2>
    <img
        src="${imageUrl}"
        alt="Car Image"
        style="width: 100%; max-width: 300px; border-radius: 5px; margin-left: auto; margin-right: auto; display: block; object-fit: contain"
    />
    <p class="detailelements" >Car Name: ${carName}</p>
    <p class="detailelements" >Manufactured Date: ${manufacturedDate}</p>
    <p class="detailelements" >Fuel Type: ${fuelType}</p>
    <p class="detailelements" >Passenger Seats: ${passengerSeats}</p>
    <p class="detailelements" >Rate per Hour: ${ratePerHour} ₹</p>
    <p class="detailelements" >Vehicle Number: ${vehicleNumber}</p>
    <div class="booking-details">
        <label for="pickup-location">Pickup Location:</label>
        <input type="text" id="pickup-location" name="pickup-location" required /><br />
        <label for="pickup-date">Pickup Date:</label>
        <input type="datetime-local" id="pickup-date" name="pickup-date" required/><br />
        <label for="drop-off-date">Drop-off Date:</label>
        <input type="datetime-local" id="drop-off-date" name="drop-off-date" required/>
        <p>Total Cost: <span id="total-cost">0</span> ₹</p>
    </div>
    <button type="submit" class="book-now-button" id="booknowbutton" style="margin-top: 20px;">Book Now</button>
    </form>
    `;

    // Set the HTML content to the inner div
    cardDiv.innerHTML = carDetailsHTML;

    // Append the inner div to the outer div
    fullPageCardDiv.appendChild(cardDiv);

    // Append the full card to the body
    document.body.appendChild(fullPageCardDiv);

    document.querySelector("#bookingform").addEventListener("submit", e => {
      e.preventDefault();
      bookNow(userIdentification, getBookingDetails());
    });

    function getBookingDetails() {
      const carID = docid; // Replace with the actual document ID
      const dropDate = document.getElementById("drop-off-date").value;
      const pickDate = document.getElementById("pickup-date").value;
      const pickLocation = document.getElementById("pickup-location").value;

      // You can retrieve other values similarly based on your HTML structure

      return {
        carID: carID,
        dropDate: dropDate,
        pickDate: pickDate,
        pickLocation: pickLocation,
        totalcost: totalCost,
      };
    }

    // Add an event listener to the drop-off date input to trigger the calculation
    document
      .getElementById("drop-off-date")
      .addEventListener("change", calculateDaysDifference);
  }

  function bookNow(documentId, newValue) {
    // Function to add a new map element to an array field in a document
    async function addToArrayField(
      collectionName,
      documentId,
      fieldName,
      newBooking
    ) {
      // Reference to the document
      const docRef = doc(db, collectionName, documentId);

      try {
        // Update the array field by adding the new map element
        await updateDoc(docRef, {
          [fieldName]: arrayUnion(newBooking),
        });
        alert(
          "Booking added to your profile. Please get to the pickup location at selected time"
        );
        console.log("Document successfully updated!");
      } catch (error) {
        console.error("Error updating document:", error.message);
      }
    }

    addToArrayField("users", documentId, "mybookings", newValue);
  }

  function calculateDaysDifference() {
    // Get the pickup and drop-off date values from the input fields
    const pickupDate = new Date(document.getElementById("pickup-date").value);
    const dropOffDate = new Date(
      document.getElementById("drop-off-date").value
    );

    // Calculate the time difference in milliseconds
    const timeDifference = dropOffDate - pickupDate;

    // Convert the time difference to days
    const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

    // Update the total cost based on the hourly rate and days difference
    const hourlyRate = 200; // Replace with your actual hourly rate
    totalCost = hourlyRate * daysDifference;

    // Display the days difference and total cost
    document.getElementById("total-cost").textContent =
      totalCost > 0 ? totalCost : alert("Please enter a valid duration");
    console.log(
      `Number of days: ${daysDifference}, Total Cost: ${Math.abs(totalCost)} ₹`
    );
  }
}

// This is for the bookings.html page ---------------------------------------------------------------------------------------
function mybookings() {
  const loggeduser = document.querySelector("#user");
  let myBookingsArray = [];

  async function getDisplayName(usr) {
    const docRef = doc(db, "users", usr.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      loggeduser.textContent = `Hello, ${docSnap.data().displayname}`;
      myBookingsArray = docSnap.data().mybookings || [];
      console.log(myBookingsArray);
      getBookingCars();
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }

  // Check if user is signed in
  auth.onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      console.log("User is signed in:", user);
      getDisplayName(user);

      document.querySelector("#logoutbtn").style.opacity = "100%";
      document.querySelector("#logoutbtn").addEventListener("click", () => {
        signOut(auth)
          .then(() => {
            console.log("User signed out successfully");
            window.location.href = "/loginrenter.html";
          })
          .catch(error => {
            console.error("Error signing out:", error.message);
          });
      });
    } else {
      // User is signed out
      alert("User is signed out");
    }
  });

  async function getCars(booking) {
    try {
      // Fetch cars collection from Firestore
      const carsSnapshot = await getDoc(doc(db, "cars", booking.carID));
      const carData = carsSnapshot.data();
      const funurl = carData.imageUrl.split("/");

      createCarArticle(
        carData.ratePerHour,
        carData.carName,
        carData.carType,
        carData.passengerSeats,
        `https://ik.imagekit.io/${imageID}/o/${funurl[7]}&tr=w-300,h-300`,
        booking.pickLocation,
        booking.dropDate,
        booking.pickDate,
        booking.totalcost
      );
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  }

  function getBookingCars() {
    myBookingsArray.forEach(booking => {
      getCars(booking);
    });
  }

  function createCarArticle(
    rateText,
    carNameText,
    carTypeText,
    carSeatsText,
    carImageSrc,
    pickupLocation,
    dropOffLocation,
    pickupDate,
    totalCost
  ) {
    // Create article element
    var article = document.createElement("article");
    article.classList.add("plan", "card");

    // Create inner div
    var innerDiv = document.createElement("div");
    innerDiv.classList.add("inner");

    // Create pricing span
    var pricingSpan = document.createElement("span");
    pricingSpan.classList.add("pricing");

    var pricingContent = document.createElement("span");
    pricingContent.innerHTML =
      '&#8377;<span id="rate">' + rateText + "</span> <small>/ hr</small>";

    pricingSpan.appendChild(pricingContent);

    // Create car image
    var carImage = document.createElement("img");
    carImage.src = carImageSrc;
    carImage.classList.add("carimg");
    carImage.id = "carimage";
    carImage.alt = "Car image";

    // Create car name heading
    var carNameHeading = document.createElement("h2");
    carNameHeading.classList.add("title");
    carNameHeading.id = "carname";
    carNameHeading.innerHTML = carNameText;

    // Create details list
    var detailsList = document.createElement("dl");
    detailsList.classList.add("details");

    // Create Type details
    var typeDetails = document.createElement("div");
    var typeDt = document.createElement("dt");
    typeDt.innerHTML = "Type";
    var typeDd = document.createElement("dd");
    typeDd.id = "cartype";
    typeDd.innerHTML = carTypeText;
    typeDetails.appendChild(typeDt);
    typeDetails.appendChild(typeDd);

    // Create Seats details
    var seatsDetails = document.createElement("div");
    var seatsDt = document.createElement("dt");
    seatsDt.innerHTML = "Seats";
    var seatsDd = document.createElement("dd");
    seatsDd.id = "carseats";
    seatsDd.innerHTML = carSeatsText;
    seatsDetails.appendChild(seatsDt);
    seatsDetails.appendChild(seatsDd);

    // Create Pickup Location details
    var pickupLocationDetails = document.createElement("div");
    var pickupLocationDt = document.createElement("dt");
    pickupLocationDt.innerHTML = "Pickup Location";
    var pickupLocationDd = document.createElement("dd");
    pickupLocationDd.id = "pickup-location";
    pickupLocationDd.innerHTML = pickupLocation;
    pickupLocationDetails.appendChild(pickupLocationDt);
    pickupLocationDetails.appendChild(pickupLocationDd);

    // Create Drop-off Location details
    var dropOffLocationDetails = document.createElement("div");
    var dropOffLocationDt = document.createElement("dt");
    dropOffLocationDt.innerHTML = "Drop-off Location";
    var dropOffLocationDd = document.createElement("dd");
    dropOffLocationDd.id = "drop-off-location";
    dropOffLocationDd.innerHTML = dropOffLocation;
    dropOffLocationDetails.appendChild(dropOffLocationDt);
    dropOffLocationDetails.appendChild(dropOffLocationDd);

    // Create Pickup Date details
    var pickupDateDetails = document.createElement("div");
    var pickupDateDt = document.createElement("dt");
    pickupDateDt.innerHTML = "Pickup Date";
    var pickupDateDd = document.createElement("dd");
    pickupDateDd.id = "pickup-date";
    pickupDateDd.innerHTML = pickupDate;
    pickupDateDetails.appendChild(pickupDateDt);
    pickupDateDetails.appendChild(pickupDateDd);

    // Create Total Cost details
    var totalCostDetails = document.createElement("div");
    var totalCostDt = document.createElement("dt");
    totalCostDt.innerHTML = "Total Cost";
    var totalCostDd = document.createElement("dd");
    totalCostDd.id = "total-cost";
    totalCostDd.innerHTML = totalCost;
    totalCostDetails.appendChild(totalCostDt);
    totalCostDetails.appendChild(totalCostDd);

    detailsList.appendChild(typeDetails);
    detailsList.appendChild(seatsDetails);
    detailsList.appendChild(pickupLocationDetails);
    detailsList.appendChild(dropOffLocationDetails);
    detailsList.appendChild(pickupDateDetails);
    detailsList.appendChild(totalCostDetails);

    // Append all created elements to the inner div
    innerDiv.appendChild(pricingSpan);
    innerDiv.appendChild(carImage);
    innerDiv.appendChild(carNameHeading);
    innerDiv.appendChild(detailsList);

    // Append inner div to the article
    article.appendChild(innerDiv);

    // Append the element to the documents
    document.querySelector(".cards").appendChild(article);
  }

  function convertToHumanReadableFormat(dateTimeString) {
    const dateTime = new Date(dateTimeString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };

    return dateTime.toLocaleString("en-US", options);
  }

  const originalDateTimeString = "2024-02-16T20:17";
  const humanReadableDateTime = convertToHumanReadableFormat(
    originalDateTimeString
  );

  console.log(humanReadableDateTime);
}

// This is for the admin.html page ------------------------------------------------------------------------------------------
function adminpanel() {
  document.addEventListener("DOMContentLoaded", function () {
    displayCars();

    // Get default date in manufactured date
    document.getElementById("manufacturedDate").value =
      new Date().toLocaleDateString("en-CA");

    // Get the form element
    document
      .getElementById("carRentalForm")
      .addEventListener("submit", async event => {
        event.preventDefault();
        document.querySelector(".submitbtn").textContent = "Uploading";

        // Get form data
        const formData = {
          carName: document.getElementById("carName").value,
          carType: document.getElementById("carType").value,
          ratePerHour: parseFloat(document.getElementById("ratePerHour").value),
          passengerSeats: parseFloat(
            document.getElementById("passengerSeats").value
          ),
          manufacturedDate: document.getElementById("manufacturedDate").value,
          vehicleNumber: document.getElementById("vehicleNumber").value,
          timestamp: serverTimestamp(), // Add a timestamp field
        };

        // Get the selected image file
        const carImageFile = document.getElementById("carImage").files[0];

        try {
          // Upload the image file to Firebase Storage with progress tracking
          const imageRef = ref(storage, "car_images/" + carImageFile.name);
          const uploadTask = uploadBytesResumable(imageRef, carImageFile);

          uploadTask.on(
            "state_changed",
            snapshot => {
              // Track upload progress
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload is ${progress}% done`);
            },
            error => {
              // Handle errors during upload
              console.error("Error during upload: ", error);
            },
            async () => {
              // Get the download URL of the uploaded image
              const downloadURL = await getDownloadURL(imageRef);

              // Add the image URL to the form data
              formData.imageUrl = downloadURL;

              // Upload data to Firebase "cars" collection
              const docRef = await addDoc(collection(db, "cars"), formData);

              console.log("Document written with ID: ", docRef.id);

              // Reset the form after successful upload
              // alert("Uploaded to the server");
              document.getElementById("carRentalForm").reset();
              document.querySelector(".submitbtn").textContent = "Submit";
              document.getElementById("galleryContainer").innerHTML = "";
              displayCars();
            }
          );
        } catch (error) {
          console.error("Error adding document: ", error);
        }
      });
  });

  // Gallery code
  const galleryContainer = document.getElementById("galleryContainer");

  // Function to fetch and display cars from Firebase
  async function displayCars() {
    try {
      // Fetch cars collection from Firestore
      const carsSnapshot = await getDocs(collection(db, "cars"));

      // Iterate over documents and create cards
      carsSnapshot.forEach(doc => {
        const carData = doc.data();

        // Create a card element
        const carCard = document.createElement("div");
        carCard.classList.add("car-card");

        const funurl = carData.imageUrl.split("/");

        // Display car information
        carCard.innerHTML = `
        <h3>${carData.carName}</h3>
        <p>Car Type: ${carData.carType}</p>
        <p>Rate per Hour: ${carData.ratePerHour} &#8377;</p>
        <p>Passenger Seats: ${carData.passengerSeats}</p>
        <p>Manufactured Date: ${carData.manufacturedDate}</p>
        <p>Vehicle Number: ${carData.vehicleNumber}</p>
        <img src="https://ik.imagekit.io/${imageID}/o/${funurl[7]}&tr=w-300,h-300" alt="${carData.carName}" class="car-image">
        <button class="delbtn" id=${doc.id}>Delete</button> 
      `;

        // Append the card to the gallery container
        galleryContainer.appendChild(carCard);
      });
    } catch (error) {
      console.error("Error fetching cars:", error);
    }

    async function deleteCar(carId) {
      try {
        await deleteDoc(doc(db, "cars", carId));
        console.log("Car deleted successfully!");
        // Optional: Refresh the displayed cars after deletion
        document.getElementById("galleryContainer").innerHTML = "";
        await displayCars();
      } catch (error) {
        console.error("Error deleting car:", error);
      }
    }

    const delbtns = document.querySelectorAll(".delbtn");
    console.log(delbtns);
    delbtns.forEach(el => {
      el.addEventListener("click", e => {
        deleteCar(el.getAttribute("id"));
        console.log("deleting");
      });
    });
  }
}

const title = document.getElementsByTagName("title")[0].textContent;

if (title == "Signup") {
  console.log(title);
  signup();
} else if (title == "Login") {
  console.log(title);
  login();
} else if (title == "NepaRide App") {
  application();
} else if (title == "Admin") {
  console.log(title);
  adminpanel();
} else if (title == "Book your car") {
  console.log(title);
  carBook();
} else if (title == "My Bookings") {
  console.log(title);
  mybookings();
} else {
  console.log("error");
}
