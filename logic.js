//TODO: if there are gallons or quarts, there must be an odometer reading
//TODO: format cards
//TODO: reject bad data from user
//TODO: add tracking for oil changes and major service

$(document).ready(function () {
    var config = {
        apiKey: "AIzaSyDMeRaMbSsXtljkmrDtCgS7M4Gc6s8kpd4",
        authDomain: "vehicle-data-tracker.firebaseapp.com",
        databaseURL: "https://vehicle-data-tracker.firebaseio.com",
        projectId: "vehicle-data-tracker",
        storageBucket: "vehicle-data-tracker.appspot.com",
        messagingSenderId: "1039700451229"
    };
    firebase.initializeApp(config);
    var database = firebase.database();
    var userID;
    var userSignedIn;
    var userEmail;
    var userEntriesPath;
    var userStatisticsPath;
    var userUsersPath;
    var userWhichVehicle;

    function displayApplicationOrAuthentication() {
        if (userSignedIn === true) {
            //displayApplication
            $("#application").css("visibility", "visible");
            $("#authentication").css("display", "none");
            $("#sign-out").css("display", "inline");
        } else {
            //displayAuthentication
            $("#application").css("visibility", "hidden");
            $("#authentication").css("display", "inline-block");
            $("#sign-out").css("display", "none");
        }
    };
    displayApplicationOrAuthentication()
    var todaysDate = new Date().toLocaleDateString("en-US");
    var thePreviousGasFillupOdometer = 0;
    var theLastGasFillupOdometer = 0;
    var theLastGasFillupGallons = 0;
    var thePreviousOilFillupOdometer = 0;
    var theLastOilFillupOdometer = 0;
    var theLastOilFillupQuarts = 0;
    var theMPG = 0;
    var theMPQ = 0;

    $(document.body).on("click", "#btn-edit", function () {
        let theIDToEdit = $(this).attr("data-id");
        startLineItemEdit(theIDToEdit)
    });

    $(document).on("touchstart", "#btn-edit", function (event) {
        let theIDToEdit = $(this).attr("data-id");
        startLineItemEdit(theIDToEdit)
    });

    function startLineItemEdit(theIDToEdit) {
        window.scrollTo(0, 0);
        let entryDate = $("#date" + theIDToEdit).text();
        let entryOdometer = $("#odometer" + theIDToEdit).text();
        let entryGallons = $("#gallons" + theIDToEdit).text();
        let entryQuarts = $("#quarts" + theIDToEdit).text();
        let entryNotes = $("#notes" + theIDToEdit).text();
        $("#input-date").val(entryDate);
        $("#input-odometer").val(entryOdometer);
        $("#input-gallons").val(entryGallons);
        $("#input-quarts").val(entryQuarts);
        $("#input-notes").val(entryNotes);
        $("#editing-id").text(theIDToEdit);
        hideAddEntryButton()
    };

    $(".add-entry").on("click", function (event) {
        event.preventDefault();
        let entryDate = $("#input-date").val().trim();
        let entryOdometer = $("#input-odometer").val().trim();
        let entryGallons = $("#input-gallons").val().trim();
        let entryQuarts = $("#input-quarts").val().trim();
        let entryNotes = $("#input-notes").val().trim();
        let entrySort = entryDate.split("/");
        for (let n = 0; n < entrySort.length; n++) {
            if (entrySort[n].length === 1) {
                entrySort[n] = "0" + entrySort[n];
            }
        };
        entrySortYear = entrySort.splice(2, 1);
        entrySort.unshift(entrySortYear.toString());
        entrySort = entrySort.join("");
        if ($("#editing-id").text().trim() != "") {
            let theIDToEdit = $("#editing-id").text().trim();
            database.ref(userEntriesPath + "/" + theIDToEdit).set({
                entrySort: entrySort,
                entryDate: entryDate,
                entryOdometer: entryOdometer,
                entryGallons: entryGallons,
                entryQuarts: entryQuarts,
                entryNotes: entryNotes,
            });
        } else {
            database.ref(userEntriesPath).push({
                entrySort: entrySort,
                entryDate: entryDate,
                entryOdometer: entryOdometer,
                entryGallons: entryGallons,
                entryQuarts: entryQuarts,
                entryNotes: entryNotes,
            });
        };
        database.ref(userStatisticsPath).set({
            vehicleName: $("#vehicle-name").val(),
            previousGasFillupOdometer: thePreviousGasFillupOdometer,
            lastGasFillupOdometer: theLastGasFillupOdometer,
            lastGasFillupGallons: theLastGasFillupGallons,
            previousOilFillupOdometer: thePreviousOilFillupOdometer,
            lastOilFillupOdometer: theLastOilFillupOdometer,
            lastOilFillupQuarts: theLastOilFillupQuarts,
        });
        emptyInputFields();
    });

    function emptyInputFields() {
        $("#input-date").val(todaysDate);
        $("#input-odometer").val("");
        $("#input-gallons").val("");
        $("#input-quarts").val("");
        $("#input-notes").val("");
        $("#editing-id").val("");
        showAddEntryButton();
    };

    function hideAddEntryButton() {
        $("#add-entry").css("display", "none");
        $("#editing-display").css("display", "inline-block");
        $("#editing-id").css("display", "inline");
    };

    function showAddEntryButton() {
        $("#add-entry").css("display", "inline");
        $("#editing-display").css("display", "none");
    };

    $("#cancel-update").click(function () {
        emptyInputFields();
    });

    $("#delete-entry").click(function () {
        let theIDToEdit = $("#editing-id").text().trim();
        if (confirm("Are you sure you want to delete this entry?")) {
            database.ref(userEntriesPath + "/" + theIDToEdit).remove();
        };
        emptyInputFields();
    });

    $(".which-vehicle-radio-button").click(function () {
        let theVehicleToGoTo = $("input[name='which-vehicle']:checked").val();
        switchToVehicle(theVehicleToGoTo);
        location = location //reloads page to get newly selected vehicle's data
    });

    function switchToVehicle(theVehicleToGoTo) {
        localStorage.whichVehicle = theVehicleToGoTo;
        let theString = "#btn-" + theVehicleToGoTo;
        $(theString).prop("checked", true);
    }

    $("#sign-out").click(function () {
        doSignOut();
    });

    emptyInputFields();

    //---------------------------------------------
    function toggleSignIn() {
        if (firebase.auth().currentUser) {
            //do signout
            doSignOut();
        } else {
            var email = document.getElementById("email").value;
            var password = document.getElementById("password").value;
            if (email.length < 4) {
                alert("Please enter an email address.");
                return;
            }
            if (password.length < 4) {
                alert("Please enter a password.");
                return;
            }
            firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                if (errorCode === "auth/wrong-password") {
                    alert("Password is incorrect.");
                } else {
                    alert(errorMessage);
                }
                console.log(error);
                document.getElementById("sign-in").disabled = false;
            });
        }
        document.getElementById("sign-in").disabled = true;
    }

    function doSignOut() {
        firebase.auth().signOut();
        firebase.database().ref(userUsersPath).set({
            email: userEmail,
            signedIn: false
        });
        $("#vehicle-name").val("");
        $("#vehicle-data").val("");
    };

    //Handles the sign up button press.
    function handleSignUp() {
        var email = document.getElementById("email").value;
        var password = document.getElementById("password").value;
        if (email.length < 4) {
            alert("Please enter an email address.");
            return;
        }
        if (password.length < 4) {
            alert("Please enter a password.");
            return;
        }
        firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode == "auth/weak-password") {
                alert("The password must be at least 6 characters.");
            } else {
                alert(errorMessage);
            }
            console.log(error);
        });
    }

    function sendPasswordReset() {
        var email = document.getElementById("email").value;
        firebase.auth().sendPasswordResetEmail(email).then(function () {
            alert("If there is an account with the address '" + email + "', a password reset link will be sent to that address.");
        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            if (errorCode == "auth/invalid-email") {
                alert(errorMessage);
            } else if (errorCode == "auth/user-not-found") {
                alert(errorMessage);
            }
            console.log(error);
        });
    }

    //initializeDatabaseReferences handles setting up UI event listeners and registering Firebase auth listeners:
    function initializeDatabaseReferences() {
        firebase.auth().onAuthStateChanged(function (user) {
            //exclude silent
            if (user) {
                // User is signed in.
                if (!localStorage.whichVehicle) {
                    localStorage.whichVehicle = 1;
                };
                userWhichVehicle = localStorage.whichVehicle;
                switchToVehicle(userWhichVehicle)
                userEmail = user.email;
                userID = user.uid;
                userSignedIn = true;
                userEntriesPath = "users/" + userID + "/" + userWhichVehicle + "/entries";
                userStatisticsPath = "users/" + userID + "/" + userWhichVehicle + "/statistics";
                userUsersPath = "users/" + userID + "/info";
                displayApplicationOrAuthentication();
                document.getElementById("sign-in").textContent = "Sign out";
                firebase.database().ref(userUsersPath).set({
                    email: userEmail,
                    signedIn: true
                });

                database.ref(userEntriesPath).orderByChild("entrySort").on("value", function (snapshot) {
                    //this first part gets the data into descending date order but extracts a few things on the way
                    let tempArrayOfObjects = [];
                    snapshot.forEach((child) => {
                        let theKey = child.key;
                        let theValue = child.val();
                        theValue.entryKey = theKey;
                        if (child.val().entryGallons > 0) {
                            thePreviousGasFillupOdometer = theLastGasFillupOdometer;
                            theLastGasFillupOdometer = child.val().entryOdometer;
                            theLastGasFillupGallons = child.val().entryGallons;
                            theMPG = ((theLastGasFillupOdometer - thePreviousGasFillupOdometer) / theLastGasFillupGallons).toFixed(2) + " mpg gas";
                        }
                        if (child.val().entryQuarts > 0) {
                            thePreviousOilFillupOdometer = theLastOilFillupOdometer;
                            theLastOilFillupOdometer = child.val().entryOdometer;
                            theLastOilFillupQuarts = child.val().entryQuarts;
                            theMPQ = ((theLastOilFillupOdometer - thePreviousOilFillupOdometer) / theLastOilFillupQuarts).toFixed(2) + " mpq oil";
                        }
                        theValue.entryMPG = theMPG;
                        theValue.entryMPQ = theMPQ;
                        tempArrayOfObjects.push(theValue);
                    });
                    theEntries = tempArrayOfObjects.reverse();
                    let theString = "";
                    theEntries.forEach(function (child) {
                        let theKey = child.entryKey;
                        let theDate = child.entryDate;
                        let theOdometer = child.entryOdometer || "&nbsp;";
                        let theGallons = child.entryGallons || "0";
                        let theQuarts = child.entryQuarts || "0";
                        let theNotes = child.entryNotes || "&nbsp;";
                        let theMPG = child.entryMPG || "no mpg data yet";
                        let theMPQ = child.entryMPQ || "no mpq data yet";
                        theString = theString + "<div data-id='" + theKey + "' class='line-item'><span id='date" + theKey + "' class='date'>" + theDate + "</span><span id='btn-edit' data-id='" + theKey + "'>Edit</span><div id='odometer" + theKey + "'>" + theOdometer + "</div><div id='gallons" + theKey + "'>" + theGallons + "</div><div id='quarts" + theKey + "'>" + theQuarts + "</div><div id='notes" + theKey + "' class='notes'>" + theNotes + "</div><div id='mpg" + theKey + "'>" + theMPG + "</div><div id='mpq" + theKey + "'>" + theMPQ + "</div></div><br>";
                    });
                    $("#display-entries").html(theString);
                }, function (errorObject) {
                    console.log("entries-error: " + errorObject.code);
                });

                database.ref(userStatisticsPath).on("value", function (snapshot) {
                    if (snapshot.exists()) {
                        theVehicleName = snapshot.val().vehicleName;
                        thePreviousGasFillupOdometer = snapshot.val().previousGasFillupOdometer;
                        theLastGasFillupOdometer = snapshot.val().lastGasFillupOdometer;
                        theLastGasFillupGallons = snapshot.val().lastGasFillupGallons;
                        thePreviousOilFillupOdometer = snapshot.val().previousOilFillupOdometer;
                        theLastOilFillupOdometer = snapshot.val().lastOilFillupOdometer;
                        theLastOilFillupQuarts = snapshot.val().lastOilFillupQuarts;
                        $("#vehicle-name").val(theVehicleName);
                        let theMPGInfo = ((theLastGasFillupOdometer - thePreviousGasFillupOdometer) / theLastGasFillupGallons).toFixed(2) + " mpg gas. "
                        if (theMPGInfo === "NaN mpg gas. ") {
                            theMPGInfo = "no mpg data yet. "
                        }
                        let theMPQInfo = ((theLastOilFillupOdometer - thePreviousOilFillupOdometer) / theLastOilFillupQuarts).toFixed(2) + " mpq oil."
                        if (theMPQInfo === "NaN mpq oil.") {
                            theMPQInfo = "no mpg data yet. "
                        }
                        $("#vehicle-data").html(theMPGInfo + theMPQInfo);
                    };
                }, function (errorObject) {
                    console.log("statistics-error: " + errorObject.code);
                });
            } else {
                // User is signed out.
                userSignedIn = false;
                displayApplicationOrAuthentication();
                document.getElementById("sign-in").textContent = "Sign in";
            }
            // document.getElementById("sign-in").disabled = true;
            document.getElementById("sign-in").disabled = false;
        });

        $(document.body).on("click", "#sign-in", function () {
            toggleSignIn();
        });
        $(document.body).on("click", "#create-account", function () {
            handleSignUp();
        });
        $(document.body).on("click", "#password-reset", function () {
            sendPasswordReset();
        });
    }
    initializeDatabaseReferences();
    console.log("v2.517");
});