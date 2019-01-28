//TODO: if there are gallons or quarts, there must be an odometer reading
//TODO: format cards
//TODO: reject bad data from user
//TODO: add multiple cars feature
//TODO: add tracking for oil changes and major service

$(document).ready(function () {
    var config = {
        apiKey: "AIzaSyDKQWsJyXa1feKOaTucpMssvIbYQvqdj8s",
        authDomain: "vintage-car-data.firebaseapp.com",
        databaseURL: "https://vintage-car-data.firebaseio.com",
        projectId: "vintage-car-data",
        storageBucket: "vintage-car-data.appspot.com",
        messagingSenderId: "875988524272"
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

    //----------------------
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");
    connectedRef.on("value", function (connectedSnapshot) {
        if (connectedSnapshot.val()) {
            var theConnection = connectionsRef.push(true);
            theConnection.onDisconnect().remove();
        };
    });
    connectionsRef.on("value", function (connectionsSnapshot) {
        // $("#connected-viewers").text(connectionsSnapshot.numChildren());
    });
    // Number of online users is the number of objects in the presence list.
    //----------------------
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
        location = location //reloads page to get newlt selected vehicle's data
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

    //Handles the sign in button press.
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
                userUsersPath = "users/" + userID;
                displayApplicationOrAuthentication();
                document.getElementById("sign-in").textContent = "Sign out";
                firebase.database().ref("users/" + userID + "/userID").set({
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
                // setInitialData();
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
    console.log("v2.5");

    //-----------------------------------
    function setInitialData() {
        theData = [{ entrySort: '190124', entryDate: '1/24/19', entryOdometer: '123780', entryGallons: '8.34', entryQuarts: '', entryNotes: 'oil is right on. Replaced brake master cylinder reservoir bottom seals.' }, { entrySort: '190115', entryDate: '1/15/19', entryOdometer: '123647', entryGallons: '', entryQuarts: '1', entryNotes: 'topped-up tires to 36' }, { entrySort: '190112', entryDate: '1/12/19', entryOdometer: '123587', entryGallons: '7.71', entryQuarts: '', entryNotes: '' }, { entrySort: '190103', entryDate: '1/3/19', entryOdometer: '123412', entryGallons: '7.72', entryQuarts: '', entryNotes: '' }, { entrySort: '181218', entryDate: '12/18/18', entryOdometer: '123228', entryGallons: '6.14', entryQuarts: '1', entryNotes: '' }, { entrySort: '181212', entryDate: '12/12/18', entryOdometer: '123079', entryGallons: '6.6', entryQuarts: '', entryNotes: 'mpg may reflect some winter hubs-locked driving' }, { entrySort: '181206', entryDate: '12/6/18', entryOdometer: '122926', entryGallons: '8.1', entryQuarts: '', entryNotes: 'prior to this I realigned the front driveshaft and added an engine-to-frame ground cable' }, { entrySort: '181128', entryDate: '11/28/18', entryOdometer: '122724', entryGallons: '8.99', entryQuarts: '0.5', entryNotes: '' }, { entrySort: '181113', entryDate: '11/13/18', entryOdometer: '122502', entryGallons: '8.55', entryQuarts: '', entryNotes: '' }, { entrySort: '181106', entryDate: '11/6/18', entryOdometer: '122474', entryGallons: '', entryQuarts: '1', entryNotes: 'changed fan belt, removed AC belt' }, { entrySort: '181026', entryDate: '10/26/18', entryOdometer: '122281', entryGallons: '8.25', entryQuarts: '', entryNotes: '' }, { entrySort: '181015', entryDate: '10/15/18', entryOdometer: '122063', entryGallons: '7.05', entryQuarts: '', entryNotes: '' }, { entrySort: '180911', entryDate: '9/11/18', entryOdometer: '121894', entryGallons: '6', entryQuarts: '0.5', entryNotes: '' }, { entrySort: '180821', entryDate: '8/21/18', entryOdometer: '121729', entryGallons: '5.71', entryQuarts: '', entryNotes: '' }, { entrySort: '180817', entryDate: '8/17/18', entryOdometer: '121576', entryGallons: '6.39', entryQuarts: '', entryNotes: '' }, { entrySort: '180814', entryDate: '8/14/18', entryOdometer: '', entryGallons: '', entryQuarts: '', entryNotes: 'checked timing (right on). Warm idle is slightly high, couldn’t adjust it down. Changed plugs.' }, { entrySort: '180813', entryDate: '8/13/18', entryOdometer: '121455', entryGallons: '', entryQuarts: '', entryNotes: 'adjusted valves, tightened down rocker structure.' }, { entrySort: '180811', entryDate: '8/11/18', entryOdometer: '121406', entryGallons: '6.05', entryQuarts: '1', entryNotes: 'made new door panels!' }, { entrySort: '180808', entryDate: '8/8/18', entryOdometer: '121233', entryGallons: '6.61', entryQuarts: '', entryNotes: '' }, { entrySort: '180801', entryDate: '8/1/18', entryOdometer: '121057', entryGallons: '7.65', entryQuarts: '', entryNotes: 'installed float bowl venturi (seems to make a big difference).' }, { entrySort: '180730', entryDate: '7/30/18', entryOdometer: '120936', entryGallons: '', entryQuarts: '', entryNotes: 'replaced transmission rear main seal. Replaced gear oil in transmission, transfer case, and rear differential. Tried another JB Weld fix on the radiator.' }, { entrySort: '180726', entryDate: '7/26/18', entryOdometer: '120849', entryGallons: '5.99', entryQuarts: '', entryNotes: '' }, { entrySort: '180725', entryDate: '7/25/18', entryOdometer: '', entryGallons: '', entryQuarts: '', entryNotes: 'tail of transmission is leaking. Ordered new seal for that. Installed new temperature sensor by thermostat. Adjusted clutch travel. Installed gas pedal limit bolt (was missing).' }, { entrySort: '180724', entryDate: '7/24/18', entryOdometer: '', entryGallons: '', entryQuarts: '', entryNotes: 'replaced coolant hose at back of intake manifold, replaced air filter.' }, { entrySort: '180723', entryDate: '7/23/18', entryOdometer: '', entryGallons: '', entryQuarts: '', entryNotes: 'realized I installed one pad the wrong way before the brake bleed. Ended up gouging up a rotor. Replaced both rotors with new. All is well now!' }, { entrySort: '180722', entryDate: '7/22/18', entryOdometer: '120684', entryGallons: '6.5', entryQuarts: '', entryNotes: '' }, { entrySort: '180721', entryDate: '7/21/18', entryOdometer: '', entryGallons: '', entryQuarts: '', entryNotes: 'cleaned and polished pad pins on left front brake. Still grabbing there. Tried bleeding brakes (half-heartedly). Had brakes flushed and bled. Now they’re great!' }, { entrySort: '180719', entryDate: '7/19/18', entryOdometer: '120525', entryGallons: '7.11', entryQuarts: '', entryNotes: 'changed oil & filter (old stuff was nasty!). Used Castrol GTX High Mileage synthetic blend 10W-40.' }, { entrySort: '180717', entryDate: '7/17/18', entryOdometer: '120420', entryGallons: '', entryQuarts: '', entryNotes: 'removed carpet and seats, power-washed interior, cleaned seats. Cleaned air filter housing (tons of seed shells) and air filter. Cleaned inside carb with carb cleaner. Later did Seafoam spray-in treatment. Got new dome light bulb, new screws for fuel fill cover, thumbscrew for air filter, radio antenna, cleaned seats and parts of exterior with pink spray can cleaner. Temporarily fixed power amp fuse holder. Radio has electrical interference but otherwise good. New radiator cap.' }, { entrySort: '180716', entryDate: '7/16/18', entryOdometer: '120337', entryGallons: '4.89', entryQuarts: '', entryNotes: '' }, { entrySort: '180712', entryDate: '7/12/18', entryOdometer: '120212', entryGallons: '', entryQuarts: '', entryNotes: 'rear driveshaft put back in phase, front hubs unlocked (doh! Had been locked since I bought at end of June.' }, { entrySort: '180701', entryDate: '7/1/18', entryOdometer: '', entryGallons: '', entryQuarts: '', entryNotes: 'Lug bolts seized. Replaced drums with good used, replaced front hubs with good used and outer bearings with new. All lug nuts are new. New pads, shoes, and shoe springs. Did not adjust handbrake (works well). Mounted new tires.' }];

        theData.forEach(function (theLineObject) {
            let entrySort = theLineObject.entrySort;
            let entryDate = theLineObject.entryDate;
            let entryOdometer = theLineObject.entryOdometer;
            let entryGallons = theLineObject.entryGallons;
            let entryQuarts = theLineObject.entryQuarts;
            let entryNotes = theLineObject.entryNotes;
            database.ref(userEntriesPath).push({
                entrySort: entrySort,
                entryDate: entryDate,
                entryOdometer: entryOdometer,
                entryGallons: entryGallons,
                entryQuarts: entryQuarts,
                entryNotes: entryNotes,
            });
        });
    };
});