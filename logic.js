//TODO: if there are gallons or quarts, there must be an odometer reading
//TODO: format cards
//TODO: reject bad data from user
//TODO: display latest mileage in intervals
//TODO: automate updating interval "last done" mileage

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
    var userIntervalsPath;
    var userUsersPath;
    var userWhichVehicle;
    var theLastOdometerEntry;

    function displayApplicationOrAuthentication() {
        if (userSignedIn === true) {
            //displayApplication
            $("#application").css("visibility", "visible");
            $("#authentication").css("display", "none");
            $("#sign-out").css("display", "inline");
            $("#vehicle-settings").css("display", "none");
        } else {
            //displayAuthentication
            $("#application").css("visibility", "hidden");
            $("#authentication").css("display", "inline-block");
            $("#sign-out").css("display", "none");
            $("#vehicle-settings").css("display", "none");
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
        writeStatistics();
        emptyInputFields();
    });

    function writeStatistics() {
        database.ref(userStatisticsPath).set({
            previousGasFillupOdometer: thePreviousGasFillupOdometer || 0,
            lastGasFillupOdometer: theLastGasFillupOdometer || 0,
            lastGasFillupGallons: theLastGasFillupGallons || 0,
            previousOilFillupOdometer: thePreviousOilFillupOdometer || 0,
            lastOilFillupOdometer: theLastOilFillupOdometer || 0,
            lastOilFillupQuarts: theLastOilFillupQuarts || 0,
        });
    };

    function writeIntervals() {
        database.ref(userIntervalsPath).set({
            vehicleName: $("#vehicle-settings-name").val(),
            intervalOneName: $("#interval-1-name").val(),
            intervalOneLastDone: $("#interval-1-last-done").val(),
            intervalOneInterval: $("#interval-1-interval").val(),
            intervalTwoName: $("#interval-2-name").val(),
            intervalTwoLastDone: $("#interval-2-last-done").val(),
            intervalTwoInterval: $("#interval-2-interval").val(),
            intervalThreeName: $("#interval-3-name").val(),
            intervalThreeLastDone: $("#interval-3-last-done").val(),
            intervalThreeInterval: $("#interval-3-interval").val(),
            intervalFourName: $("#interval-4-name").val(),
            intervalFourLastDone: $("#interval-4-last-done").val(),
            intervalFourInterval: $("#interval-4-interval").val(),
            intervalFiveName: $("#interval-5-name").val(),
            intervalFiveLastDone: $("#interval-5-last-done").val(),
            intervalFiveInterval: $("#interval-5-interval").val(),
            intervalNotes: $("#interval-notes").val(),
        });
    };


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

    $("#btn-vehicle-settings").click(function () {
        displayApplicationOrVehicleSettings("settings");
    });

    $("#cancel-table-update").click(function () {
        displayApplicationOrVehicleSettings("application");
    });

    $("#update-table").click(function () {
        writeIntervals();
        displayApplicationOrVehicleSettings("application");
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

    function displayApplicationOrVehicleSettings(applicationOrSettings) {
        if (applicationOrSettings === "application") {
            //displayApplication
            $("#application").css("display", "block");
            $("#sign-out").css("display", "inline");
            $("#vehicle-settings").css("display", "none");
        } else {
            //displayVehicleSettings
            $("#application").css("display", "none");
            $("#sign-out").css("display", "none");
            $("#vehicle-settings").css("display", "inline");
        }
    };

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
        $("#vehicle-data").text("");
        $("#vehicle-settings-name").val("");
        $("#interval-1-name").val("");
        $("#interval-1-last-done").val("");
        $("#interval-1-interval").val("");
        $("#interval-2-name").val("");
        $("#interval-2-last-done").val("");
        $("#interval-2-interval").val("");
        $("#interval-3-name").val("");
        $("#interval-3-last-done").val("");
        $("#interval-3-interval").val("");
        $("#interval-4-name").val("");
        $("#interval-4-last-done").val("");
        $("#interval-4-interval").val("");
        $("#interval-5-name").val("");
        $("#interval-5-last-done").val("");
        $("#interval-5-interval").val("");
        $("#interval-notes").val("");
        thePreviousGasFillupOdometer = 0;
        theLastGasFillupOdometer = 0;
        theLastGasFillupGallons = 0;
        thePreviousOilFillupOdometer = 0;
        theLastOilFillupOdometer = 0;
        theLastOilFillupQuarts = 0;
        theMPG = 0;
        theMPQ = 0;
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
                    localStorage.whichVehicle = "one";
                };
                userWhichVehicle = localStorage.whichVehicle;
                switchToVehicle(userWhichVehicle)
                userEmail = user.email;
                userID = user.uid;
                userSignedIn = true;
                userEntriesPath = "users/" + userID + "/" + userWhichVehicle + "/entries";
                userStatisticsPath = "users/" + userID + "/" + userWhichVehicle + "/statistics";
                userIntervalsPath = "users/" + userID + "/" + userWhichVehicle + "/intervals";
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
                        theLastOdometerEntry = child.val().entryOdometer; //the last child processed gives us the last odometer entry
                    });
                    writeStatistics();
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
                        theString = theString + "<div data-id='" + theKey + "' class='line-item'><span id='date" + theKey + "' class='date'>" + theDate + "</span><span id='btn-edit' data-id='" + theKey + "'>Edit</span><br>Odometer: <div id='odometer" + theKey + "' class='line-item-element'>" + theOdometer + "</div><br>Gallons of Gas: <div id='gallons" + theKey + "' class='line-item-element'>" + theGallons + "</div><br>Quarts of Oil: <div id='quarts" + theKey + "' class='line-item-element'>" + theQuarts + "</div><div id='notes" + theKey + "' class='notes'>" + theNotes + "</div><div id='mpg" + theKey + "'class='line-item-element'>" + theMPG + "</div>, <div id='mpq" + theKey + "'class='line-item-element'>" + theMPQ + "</div></div><br>";
                    });
                    $("#display-entries").html(theString);
                    displayApplicationOrVehicleSettings("application");
                }, function (errorObject) {
                    console.log("entries-error: " + errorObject.code);
                });

                database.ref(userStatisticsPath).on("value", function (snapshot) {
                    if (snapshot.exists()) {
                        thePreviousGasFillupOdometer = snapshot.val().previousGasFillupOdometer;
                        theLastGasFillupOdometer = snapshot.val().lastGasFillupOdometer;
                        theLastGasFillupGallons = snapshot.val().lastGasFillupGallons;
                        thePreviousOilFillupOdometer = snapshot.val().previousOilFillupOdometer;
                        theLastOilFillupOdometer = snapshot.val().lastOilFillupOdometer;
                        theLastOilFillupQuarts = snapshot.val().lastOilFillupQuarts;
                        theMPG = ((theLastGasFillupOdometer - thePreviousGasFillupOdometer) / theLastGasFillupGallons).toFixed(2) + " mpg gas";
                        theMPQ = ((theLastOilFillupOdometer - thePreviousOilFillupOdometer) / theLastOilFillupQuarts).toFixed(2) + " mpq oil";
                    };
                }, function (errorObject) {
                    console.log("statistics-error: " + errorObject.code);
                });

                database.ref(userIntervalsPath).on("value", function (snapshot) {
                    if (snapshot.exists()) {
                        intervalOneDue = parseInt(snapshot.val().intervalOneLastDone) + parseInt(snapshot.val().intervalOneInterval);
                        intervalTwoDue = parseInt(snapshot.val().intervalTwoLastDone) + parseInt(snapshot.val().intervalTwoInterval);
                        intervalThreeDue = parseInt(snapshot.val().intervalThreeLastDone) + parseInt(snapshot.val().intervalThreeInterval);
                        intervalFourDue = parseInt(snapshot.val().intervalFourLastDone) + parseInt(snapshot.val().intervalFourInterval);
                        intervalFiveDue = parseInt(snapshot.val().intervalFiveLastDone) + parseInt(snapshot.val().intervalFiveInterval);
                        $("#vehicle-settings-name").val(snapshot.val().vehicleName);
                        $("#interval-1-name").val(snapshot.val().intervalOneName);
                        $("#interval-1-last-done").val(snapshot.val().intervalOneLastDone);
                        $("#interval-1-interval").val(snapshot.val().intervalOneInterval);
                        $("#interval-2-name").val(snapshot.val().intervalTwoName);
                        $("#interval-2-last-done").val(snapshot.val().intervalTwoLastDone);
                        $("#interval-2-interval").val(snapshot.val().intervalTwoInterval);
                        $("#interval-3-name").val(snapshot.val().intervalThreeName);
                        $("#interval-3-last-done").val(snapshot.val().intervalThreeLastDone);
                        $("#interval-3-interval").val(snapshot.val().intervalThreeInterval);
                        $("#interval-4-name").val(snapshot.val().intervalFourName);
                        $("#interval-4-last-done").val(snapshot.val().intervalFourLastDone);
                        $("#interval-4-interval").val(snapshot.val().intervalFourInterval);
                        $("#interval-5-name").val(snapshot.val().intervalFiveName);
                        $("#interval-5-last-done").val(snapshot.val().intervalFiveLastDone);
                        $("#interval-5-interval").val(snapshot.val().intervalFiveInterval);
                        $("#interval-notes").val(snapshot.val().intervalNotes);
                    };
                    if (theMPG === "NaN mpg gas") {
                        theMPG = "no mpg data yet"
                    }
                    if (theMPQ === "NaN mpq oil") {
                        theMPQ = "no mpq data yet"
                    }
                    theVehicleName = $("#vehicle-settings-name").val();
                    let theIntervalNotices = "";
                    if (intervalOneDue < parseInt(theLastOdometerEntry)) {
                        theIntervalNotices += snapshot.val().intervalOneName + " is due. "
                    }
                    if (intervalTwoDue < parseInt(theLastOdometerEntry)) {
                        theIntervalNotices += snapshot.val().intervalTwoName + " is due. "
                    }
                    if (intervalThreeDue < parseInt(theLastOdometerEntry)) {
                        theIntervalNotices += snapshot.val().intervalThreeName + " is due. "
                    }
                    if (intervalFourDue < parseInt(theLastOdometerEntry)) {
                        theIntervalNotices += snapshot.val().intervalFourName + " is due. "
                    }
                    if (intervalFiveDue < parseInt(theLastOdometerEntry)) {
                        theIntervalNotices += snapshot.val().intervalFiveName + " is due. "
                    }
                    if (theIntervalNotices == "") {
                        $("#vehicle-data").html("<strong>" + theVehicleName + ":</strong> " + theMPG + ", " + theMPQ + ".");
                    } else {
                        $("#vehicle-data").html("<strong>" + theVehicleName + ":</strong> " + theMPG + ", " + theMPQ + ".<br><span id='interval-notices'>" + theIntervalNotices + "</span>");
                    }


                }, function (errorObject) {
                    console.log("intervals-error: " + errorObject.code);
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
            // preventDefault();
            toggleSignIn();
        });
        $(document.body).on("click", "#create-account", function () {
            preventDefault();
            handleSignUp();
        });
        $(document.body).on("click", "#password-reset", function () {
            preventDefault();
            sendPasswordReset();
        });
    }
    initializeDatabaseReferences();
    console.log("Vehicle Data Tracker v3.175");
});