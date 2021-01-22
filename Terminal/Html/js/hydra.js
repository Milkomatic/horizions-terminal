// Globals
var swversion = "";
var jsversion = 1.56;
var screenUrl = "";
var screenName = "";
var screenLevel = "Advanced";
var screenLocation = "";
var isTouch = false;
var pageHidden = false;
var showCursor = true;
var inTesting = false;
var isLeftHanded = false;
var online = false;
var screen_on = false;
var currentScene = "Unknown";
var soundEnabled = true;
var allowScroll = false;
var allowContentMenu = false;
var debuglog = false;
var consoleLocked = false;
var headerLocked = false;
var second = 1000;
var minute = 60000;
var orientation = 1;    //1= Portrait, 2=Landscape
var comms = 1;          //1= WebSockets, 2=Traditional
var socket;
var socketstatus = 0;   //0=Closed, 1=Open
var socketRetry;
var socketUrl = "";
var batchmode = false;  //true; false
var data_entry = false;
var warningCount = 0;
var scale = 1;

var packetsAccepted = [];

// Enums
var PacketType = {
    None: 0,
    Mission: 1,
    Vessel: 2,
    VesselAlert: 3,
    VesselRadar: 4,
    VesselShields: 5,
    VesselSpacial: 6,
    VesselTarget: 7
};

// Local Static World Data
var currentMap;
var currentLocation = "";
var currentPlanet = "";   

var shSettings;
var vesselClasses = Object.create(null);
var factions = Object.create(null);  //TODO
var races = Object.create(null);     //TODO
// World Data
var galacticinfo;
var starSystem;
var planetarySystem;
// Vessel 
var thisvessel;
var currenttarget;
var currenttargetid = 0;
var flighttarget;
var flighttargetid = 0;
var sciencetarget;
var sciencetargetid = 0;
var gmtarget;
var gmtargetid = 0;
var focusedObject;
var scanningid = 0;
var scandelay = 4000;
var vautopilot = false;
var valert = 1;
var lastintegrity = 1;
// Player(s)
var officer;
// Screen
var subscreen = false;
// Audio
var snd_click;
var snd_disabled;
var snd_switch;
var snd_activate;
// Window Size
var w_height = 0;
var w_width = 0;
var w_scale = 1;
var w_scaleoffset = 1;
var w_scaleenabled = false;
// Game Objects / Collections
var urlVariables; 
var gameSession = Object.create(null);
var modules = Object.create(null); 
var mission = null;
var missionbriefing = "";
var contacts = Object.create(null);
var longRangeContacts = Object.create(null);
var ActiveConsoles = Object.create(null);
var commChannels = Object.create(null);
var logEntries = Object.create(null);
var gameEvents = Object.create(null);
var availableMissions = Object.create(null);
var rolesInUse = Object.create(null);
var missionVariables = Object.create(null);
var vesselClassData;
var spacialData;
var shieldData;
var crewData;
var componentData = Object.create(null);
var weaponGroups;
var weaponData = Object.create(null);
var ordinanceData = Object.create(null);
var droneData = Object.create(null);
var droneTargetData = Object.create(null);
var ammoData; //This needs to move inside of the WeaponData
var cargoData;
var cameraData = Object.create(null);
var deckData;
var damageData;
var damageTeams = Object.create(null);
var messageData;
var scanData;
var scanResults;
var systemScanResults;

var tags = Object.create(null); 
var encounters = Object.create(null);

var userFiles = Object.create(null);
var htmlMedia = Object.create(null);

// New Collections
var missionWaypoints;
var vesselWaypoints;
var keyMap = Object.create(null);
// Other
var selectedobj;
var selectedid = 0;
var selecteduid = 0;
var lastftl = 0;
var activecamera = "Forward";
var radarZoom = 1;
var mapZoom = 1;
var vesseldatareceived = false;
// Html Fragments
var hf_RadarListing = "";
var hf_DeckListing = "";
var hf_Objectives = "";
var hf_CommListing = "";
var hf_StellarInfo = "";
var hf_StarSystemDetail = "";
var hf_PlanetarySystemInfo = "";
var hf_WeaponListing = "";
var hf_WeaponGroupListing = "";
// Socket Variables
var heartBeatID;
var targetheartBeats = 100;
var idleheartBeats = 1500;
var minHeartBeats = 100;        // Minimum Heartbeats Allowed
var heartBeats = 100;           // Active Heartbeat Rate 
var startBeat;
var lastBeat = 100;
var parsingCMDs = false;
var parseLoops = 0;
var runasAdmin = false;
// MATH!
var oneRadian = (Math.PI / 180);
var fullCircle = oneRadian * 360;

function preventBehavior(event) {
    // Prevent Dragging?
    //if (!allowScroll) event.preventDefault();
}
document.addEventListener("touchmove", preventBehavior, false);

window.addEventListener('beforeunload', function (event) {
    //
});
window.addEventListener('unload', function (event) {
    CloseSocket();
});

$(document).ready(function () {
    SetStationLogo();
    Initialize();
    Resize();
    comms = window.WebSocket ? 1 : 2;
    //comms = 2;

    $.ajaxSetup({ cache: false });

    if (inTesting) {
        SetTestData();
    } else {
        if (comms === 1) {
            SetSocket();
        } else {
            SetHeartBeat();
        }
    }

    isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

    if (isTouch && !showCursor) 
        ToggleMouse(false, false);

    if ($("#js-version").length !== 0) $("#js-version").text(jsversion);
    $("#data-mode").addClass(comms === 1 ? "info-socket" : "info-web");
    $("#input-mode").addClass(isTouch === true ? "info-touch" : "info-mouse");

    //$(window).keypress(function (event) {
    //    if (typeof keyMap === 'undefined')
    //        return;
    //    if (event.which in keyMap) {
    //        SendCMD("KMC", keyMap[event.which]);
    //    }
    //});

    $(window).on('keydown', function (e) {
        if (typeof keyMap === "undefined")
            return;

        if (typeof keyMap[e.key] === "undefined")
            return;

        if (!keyMap[e.key].Single)
            SendCMD("KMD", keyMap[e.key].Command);
        else
            SendCMD("KMC", keyMap[e.key].Command);
    });

    $(window).on('keyup', function (e) {
        if (typeof keyMap === "undefined")
            return;

        if (typeof keyMap[e.key] === "undefined")
            return;

        if (!keyMap[e.key].Single)
            SendCMD("KMU", keyMap[e.key].Command);
    });

    $(window).resize(function (event) {
        Resize();
    });

    // Controls Online/Offline Elements
    $(document).on("onSession", function (event) {
        try {
            if (screen_on) {
                ShowOnline();
            } else if (gameSession.State === "Loaded") {
                ShowMissionState();
            } else if (gameSession.State === "Playing" || gameSession.State === "Paused") {
                ShowOnline();
                if (thisvessel !== null) { vesselInit(); }
            } else {
                ShowOffline();
            }
        } catch (err) {
            console.log("onSession: " + err);
        }
    });

    $(document).on("onMission", function (event) {
        ShowMissionState();
    });

    if (isTouch) {
        $(document).on("touchstart", ".btn", function (event) {
            if ($(this).hasClass("dim")) {
                PlayDisabledSound();
            } else {
                PlayClickSound();
            }
        });
    } else {
        $(document).on("mousedown", ".btn", function (event) {
            if ($(this).hasClass("dim")) {
                PlayDisabledSound();
            } else {
                PlayClickSound();
            }
        });
    }

    // Context Menu?
    $(document).on("contextmenu", function (event) {
        if (isTouch || !allowContentMenu) 
            return false;
    });

    // Page Visibility
    $(document).on("visibilitychange", function (event) {
        //CheckVisibility();
    });

    $(document).on("onRolesInUse", function (event) {
        var html = "";
        try {
            for (var r in rolesInUse) {
                var role = rolesInUse[r];

                if (!role.Visible)
                    continue;

                if (role.InUse) {
                    html += "<div class=\"role inuse\" title=\"" + role.Name + "\">" + role.Abbr + "</div>";
                    //html += "<div class=\"role inuse\" title=\"" + role.Name + "\" onclick=\"Jump('" + role.Screen + ".msp')\">" + role.Abbr + "</div>";
                } else {
                    html += "<div class=\"role\" title=\"" + role.Name + "\" onclick=\"Jump('" + role.Screen + ".msp')\">" + role.Abbr + "</div>";
                }
            }
        } catch (err) {
            console.log("RolesInUse: " + err.message);
        }
        SetHtml("#roles-status", html);
    });

    // Handiness
    SetHandiness(isLeftHanded ? "L" : "R");

    // Other
    ManageUrlVariables();
    mapKeys();

});

// PAGE
function Initialize() {
    // Load HTML Fragments
    $.get("hf-objectives.htm", {}, function (data) { hf_Objectives = data; });
    $.get("hf-radarlisting.htm", {}, function (data) { hf_RadarListing = data; });
    $.get("hf-decklisting.htm", {}, function (data) { hf_DeckListing = data; });
    $.get("hf-comm-channel.htm", {}, function (data) { hf_CommListing = data; });
    $.get("hf-weaponlisting.htm", {}, function (data) { hf_WeaponListing = data; });
    $.get("hf-weapongrouplisting.htm", {}, function (data) { hf_WeaponGroupListing = data; });
    $.get("hf-stellarinfo.htm", {}, function (data) { hf_StellarInfo = data; });
    $.get("hf-star-system-detail.htm", {}, function (data) { hf_StarSystemDetail = data; });
    $.get("hf-planetary-system-info.htm", {}, function (data) { hf_PlanetarySystemInfo = data; });

    // Audio
    try {
        // Base UI Sounds
        snd_click = new SoundQue("/sound/click.mp3");
        snd_switch = new SoundQue("/sound/switch.mp3");
        snd_disabled = new SoundQue("/sound/disabled.mp3");
        snd_activate = new SoundQue("/sound/click.mp3");
        snd_break = new SoundQue("/sound/break.mp3");
    } catch (err) {
        console.log("Initialize: " + err);
    }

    SetScreenLevel("Advanced");

}
function Reload(full) {
    if (typeof full === 'undefined') full = true;
    location.reload(full);
}
function QueryString(key) {
    var re = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi');
    var r = [], m;
    while ((m = re.exec(document.location.search)) !== null)
        r.push(decodeURIComponent(m[1]));
    return r;
}
function ToggleFullScreen(elem) {
    elem = elem || document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement &&
      !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}
function CheckVisibility() {
    var vs = document.visibilityState === "visible";

    if (pageHidden !== vs) {
        if (pageHidden) 
            $(document).trigger("onFocus");

        pageHidden = vs;
    } 

    //console.log("CheckVisibility: " + pageHidden);

}
function Resize() {
    w_width = $(window).width();
    w_height = $(window).height();
    $("#content").width = w_width;
    $("#content").height = w_height;
    if (w_height > w_width) { orientation = 1; } else { orientation = 2; }

    try {
        $("#panel-size").html(w_width + " x " + w_height + " (" + (w_width > w_height ? "Landscape" : "Portrait") + ")");
    } catch (err) {
        console.log("Resize: " + err);
    }

    //panelResize();
    $(document).trigger("onResize");
}
function ManageUrlVariables() {
    urlVariables = GetUrlVariables();

    // Disable Sounds?
    if (typeof urlVariables["snd"] !== "undefined") {
        if (urlVariables["snd"] === "0") {
            ToggleSound();
        }
    }

}
function GetUrlVariables() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function ScaleToWidth(min) {
    if (!w_scaleenabled) return;
    if (typeof min === "undefined") min = 1024;
    if (w_width < min) {
        w_scale = w_width / min; //.toFixed(2);
        if (w_scale > 1) {
            w_scale = 1;
            w_scaleoffset = 1;
        } else {
            w_scaleoffset = 2 - w_scale;
        }
        $("body").css("zoom", w_scale);
        $("body").css("-moz-transform: scale", w_scale);
        w_scaleoffset = 2 - w_scale;
    } else {
        w_scale = 1;
        w_scaleoffset = 1;
    }
    $("#panel-scale").text(w_scale + " - " + w_scaleoffset);
}
function ScaleToHeight(min) {
    if (!w_scaleenabled) return;
    if (typeof min === "undefined") min = 768;
    if (w_scaleenabled && w_height < min) {
        w_scale = w_height / min; //.toFixed(2);
        if (w_scale > 1) {
            w_scale = 1;
            w_scaleoffset = 1;
        } else {
            w_scaleoffset = 2 - w_scale;
        }
        $("body").css("zoom", w_scale);
        $("body").css("-moz-transform: scale", w_scale);
        
    } else {
        w_scale = 1;
        w_scaleoffset = 1;

        $("body").css("zoom", 1);
        $("body").css("-moz-transform: scale", 1);
    }
    $("#panel-scale").text(w_scale.toFixed(1) + " - " + w_scaleoffset.toFixed(1));
}
function Jump(url) {
    window.location.href = url;
}
function Open(url) {
    try {
        window.open(url, url);
    } catch (err) {
        console.log("Open: " + err.message);
    }
}

// SOCKETS
//0	CONNECTING	Socket has been created.The connection is not yet open.
//1	OPEN	    The connection is open and ready to communicate.
//2	CLOSING	    The connection is in the process of closing.
//3	CLOSED	    The connection is closed or couldn't be opened.
function SetSocket() {
    var url = window.location.href;
    var arr = url.split("/");
    var thishost = arr[2].split(":")[0];

    try {
        if (typeof socket !== "undefined") 
            CloseSocket();
    } catch (err) {
        console.log("SetSocket.CloseSocket: " + err.message);
    }

    try {
        socket = new WebSocket('ws://' + thishost + ':' + port + '/');
        socket.onopen = function (event) {
            try {
                SetPING();
                clearInterval(socketRetry);
                socketRetry = null;
                socketstatus = 1;
                UpdateSocketStatus();
                SendPacketTypes();
                //Identify();
                setTimeout("Identify()", 250);
            } catch (err) {
                console.log("Socket.OnOpen: " + err.message);
            }
        };
        socket.onclose = function (event) {
            ClearPING();
            ResetSocket();
        };
        socket.onerror = function (event) {
            CloseSocket();
        };
        socket.onmessage = function (event) {
            try {
                ParseCMD(event.data);
            } catch (err) {
                console.log("Socket.OnMessge: " + err.message);
            }
            
        };
    } catch (err) {
        console.log("SetSocket: " + err.message);
        socketstatus = 0;
    }

}
function ResetSocket() {
    try {
        CloseSocket();
        UpdateSocketStatus();
        SocketReconnect();
    } catch (err) {
        console.log("ResetSocket: " + err.message);
    }
}
function CloseSocket() {
    try {
        socketstatus = 0;
        if (typeof socket !== "undefined")
            socket.close();
    } catch (err) {
        console.log("CloseSocket: " + err.message);
        //ResetSocket();
    }
}
function UpdateSocketStatus() {
    try {
        $("#socket-status").removeClass();
        $("#socket-status").addClass('socket-status' + socketstatus);
        $("#socket-status").attr("title", socketstatus === 1 ? "M3 Online" : "M3 Offline");
        $(document).trigger('onSocketStatus');
    } catch (err) {
        console.log("UpdateSocketStatus: " + err.message);
    }
}
function SocketReconnect() {
    if (socketstatus === 1) {
        return false;
    } else {
        if (!socketRetry)
            socketRetry = setInterval(SetSocket, 5000);
    }
}
function SendAllClear() {
    SendCMD("AC", heartBeats);
}

// PACKET TYPES
function AddPacketType(id) {
    if (typeof id === "undefined")
        return;

    packetsAccepted.push(id);
    SendCMD("ACCEPT-PACKET", id);
}
function SendPacketTypes() {
    for (var key in packetsAccepted) 
        SendCMD("ACCEPT-PACKET", packetsAccepted[key]);
}

// PING FUNCTIONS
var pingTimer;
function SetPING() {
    pingTimer = setInterval("PING()", 10 * second);
}
function ClearPING() {
    clearInterval(pingTimer);
}
function PING() {
    try {
        socket.send('PING|' + screenName + '|');
    } catch (err) {
        console.log("PING: " + err);
    }
}

// HTTP
function SetHeartBeat() {
    heartBeatID = setTimeout(HeartBeat, heartBeats);
    LoadBaseData();
    Identify();
}
function HeartBeat() {
    if (parsingCMDs) return;

    startBeat = new Date().getTime();
    $.get('gc.msp', function (data) {
        ParseCMDs(data);
    });
    heartBeatID = setTimeout(HeartBeat, heartBeats);
}

// TIME
function SecondsToTime(duration) {
    var seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    //minutes += hours * 60;
    //hours = (hours < 10) ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    //if (hours > 0) {
    //    return hours + ":" + minutes; // + ":" + seconds + "." + milliseconds;
    //} else {
    return minutes + ":" + seconds; // + "." + milliseconds;
    //}

}
function MillisecondsToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100)
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    minutes += hours * 60;
    //hours = (hours < 10) ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    //if (hours > 0) {
    //    return hours + ":" + minutes; // + ":" + seconds + "." + milliseconds;
    //} else {
    return minutes + ":" + seconds; // + "." + milliseconds;
    //}

}
function MillisecondsToShortTime(duration) {
    if (typeof duration === "undefined") duration = 0;

    if (duration >= minute) {
        // Minutes +
        return parseInt(duration / minute) + " Minute(s)";
    } else if (duration >= 1000) {
        // Seconds + 
        return (duration / 1000) + " Second(s)";
    } else {
        return duration + " Millisecond(s)";
    }
}
function TimeDifference(date1, date2) {
    if (date2 < date1) {
        date2.setDate(date2.getDate() + 1);
    }

    return date2 - date1;
}
function ElapsedMilliseconds(startTime) {
    var endTime;

    endTime = new Date();
    return endTime - startTime;
}
function ElapsedSeconds(startTime) {
    var endTime;

    endTime = new Date();
    var timeDiff = endTime - startTime; 
    timeDiff /= 1000;  // Strip MS

    // Get Seconds
    return Math.round(timeDiff % 60);
}

// Skeleton Functions for ON DEMAND Actions
function contactTopics(topics) { }
function mapKeys() { }
function vesselInit() { }       // When vessel data has been received for the first time
function UseCMD(cmd, data) { }  // When a raw command has been received TODO: REMOVE
function SetOfficer() { }       // When Officer data has been received
function onReset() { }          // When the Game Is Reseting/New Mission
function onHandiness() { }

// SCREEN MODES
function CheckConsoleSize(width, height) {
    var fits = true;
    if (w_height < height) {
        fits = false;
    } else if (w_width < width) {
        fits = false;
    }

    if (fits) {
        $("#console-size").hide();
    } else {
        $("#console-size").show();
    }
}
function Identify() {
    var ids = JSON.stringify({ ScreenName: screenName, Location: screenLocation });
    SendCMD("IDS", ids);
    console.log("Identifying as " + screenName);
    SendAllClear();
    //GetLocation();
}
function ShowOnline() {
    CloseInfo();
    CloseSettings();
    ClearBreakConsole();
    if ($("#online").length === 0) return;
    $(".screen-panel").hide();
    $("#online").show();
    //StartupEffect();
    Resize();
    online = true;
}
function ShowOffline() {
    if (runasAdmin) return;
    CloseInfo();
    CloseSettings();
    if ($("#offline").length === 0) return;
    $(".screen-panel").hide();
    $("#offline").show();
    //ShutdownEffect();
    missionbriefing = "";
    online = false;
}
function ShowMissionState() {
    try {
        if (mission === null) {
            ShowOffline();
            return;
        }

        if (mission.State === "Ended") {
            ShowMissionSummary();
        } else if (mission.State === "Prologue") {
            ShowMissionBriefing();
        } else if (mission.State === "Running") {
            ShowOnline();
        }

        if (thisvessel !== null) { vesselInit(); }
    } catch (err) {
        console.log("onMission: " + err);
    }
}
function ShowMissionBriefing() {
    if (runasAdmin) return;
    CloseInfo();
    CloseSettings();
    $("#briefing-title").html(mission.Name);
    $(".screen-panel").hide();
    $("#mission-briefing").show();
}
function ShowMissionSummary() {
    if (runasAdmin) return;
    CloseInfo();
    CloseSettings();
    $(".screen-panel").hide();
    $("#mission-summary").show();
    if (typeof mission !== "undefined") {
        var ms = "";
        if (mission.Success) {
            ms = "<span style='color: green;'>MISSION SUCCESSFUL</span>";
        } else {
            ms = "<span style='color: red;'>MISSION FAILED</span>";
        }
        $("#mission-complete").html(ms);
        var grade = parseInt(mission.Grade * 100);
        $("#mission-score").text(grade + " / 100");
    }
}
function ShowSettings() {
    $("#settings").show();
}
function CloseSettings() {
    $("#settings").hide();
}
function ToggleSettings() {
    $("#settings").toggle();
}
function ToggleSection(id) {
    if ($(id).is(":visible")) {
        $(id).slideUp("fast");
    } else {
        $(id).slideDown("fast");
    }
}
function ToggleMouse(value, store) {
    try {
        if (typeof value === "undefined")
            value = !showCursor;

        if (typeof store === "undefined")
            store = true;

        showCursor = value;

        if (showCursor) {
            $("body").css("cursor", "default");
            SetText("#mouse-enabled", "HIDE");
            AddClass("#mouse-enabled", "main-red");
            RemoveClass("#mouse-enabled", "main-green");
        } else {
            $("body").css("cursor", "none");
            SetText("#mouse-enabled", "SHOW");
            AddClass("#mouse-enabled", "main-green");
            RemoveClass("#mouse-enabled", "main-red");
        }

        if (store)
            SetCookie("Console-ShowCursor", showCursor);

    } catch (err) {
        console.log("ToggleMouse: " + err.message);
    }
}
function ToggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        AddClass("#sound-enabled", "main-green");
        RemoveClass("#sound-enabled", "main-red");
        SetText("#sound-enabled", "ENABLED");
    } else {
        RemoveClass("#sound-enabled", "main-green");
        AddClass("#sound-enabled", "main-red");
        SetText("#sound-enabled", "DISABLED");
    }
}
function ToggleContextMenu() {
    allowContentMenu = !allowContentMenu;
}
function SetStationLogo() {
    var pathname = window.location.pathname;

    switch (pathname) {
        case "/helm.msp":
        case "/flight.msp":
            $(".wait-logo").css("background-image", "url('/images/badge-flight.png')");
            break;
        case "/tactical.msp":
            $(".wait-logo").css("background-image", "url('/images/badge-tactical.png')");
            break;
        case "/science.msp":
        case "/sciences.msp":
            $(".wait-logo").css("background-image", "url('/images/badge-sciences.png')");
            break;
        case "/communications.msp":
            $(".wait-logo").css("background-image", "url('/images/badge-comms.png')");
            break;
        case "/engineer.msp":
            $(".wait-logo").css("background-image", "url('/images/badge-engineer.png')");
            break;
        default:
            $(".wait-logo").css("background-image", "url('/images/badge-burst.png')");
            break;
    }
}
function SetHandiness(lh) {
    isLeftHanded = lh === "L" ? true : false;
    onHandiness();

    if (isLeftHanded) {
        $("#left-handed").removeClass("dimmed");
        $("#right-handed").addClass("dimmed");
    } else {
        $("#left-handed").addClass("dimmed");
        $("#right-handed").removeClass("dimmed");
    }
}
function ShowTitlebar(show) {
    if (show) {
        $("#title").show();
        $("#online").css("top", "30px");
    } else {
        $("#title").hide();
        $("#online").css("top", "0");
    }
}
function ShowScreen(url) {
    window.location.href = url;
}
function LockScreen(lock) {
    if (typeof lock === 'undefined') lock = true;
    consoleLocked = lock;
    if (consoleLocked) {
        $("#console-lock").show();
    } else {
        $("#console-lock").hide();
    }
    $(document).trigger('onConsoleLock', consoleLocked);
}
function LockHeader(lock) {
    if (typeof lock === 'undefined') lock = true;
    headerLocked = lock;
    if (headerLocked) {
        $("#title-lock").show();
    } else {
        $("#title-lock").hide();
    }
    $(document).trigger('onTitleLock', headerLocked);
}
function SetScreenLevel(mode) {
    try {
        switch (mode) {
            case "Novice":
                // Hide Advanced Sections.
                $(".mode-novice").show();
                $(".mode-advanced").hide();
                break;
            case "Advanced":
                // Hide Basic Sections.
                $(".mode-novice").hide();
                $(".mode-advanced").show();
                break;
            default:
                // Hide Basic and Advanced Section.
                $(".mode-novice").hide();
                $(".mode-advanced").hide();
                break;
        }
        Resize();
    } catch (err) {
        console.log("SetScreenLevel: " + err.message);
    }
}

// DATA
function ResetData() {
    try {
        lastintegrity = 1;
        weaponData = Object.create(null);
        deckData = undefined;
        messageData = undefined;
        scanData = undefined;
        scanResults = undefined;
        missionWaypoints = undefined;
        vesselWaypoints = undefined;
        droneData = Object.create(null);
        droneTargetData = Object.create(null);
        ordinanceData = Object.create(null);
        componentData = Object.create(null);
        contacts = Object.create(null);
        commChannels = Object.create(null);
        onReset();
        $(document).trigger('onReset');
    } catch (err) {
        console.log("ResetData: " + err);
    }
}
function SendCMD(cmd, value) {
    if (typeof cmd === "undefined") return;
    if (typeof value === "undefined") value = "";
    
    try {
        if (comms === 1) {
            if (socketstatus === 1) socket.send(cmd + '|' + value);
        } else {
            var params = "c=" + cmd + "&v=" + value + "";
            $.post('sc.msp', params, function (data) {

            });
        }
    } catch (err) {
        console.log("SendCMD: " + err);
    }
    value = typeof value !== 'undefined' ? value : '';


}
function PostCMD(cmd, value, postCallback) {
    try {
        if (typeof cmd === 'undefined') return;
        if (typeof value === 'undefined') value = "";
        var params = "c=" + cmd + "&v=" + CleanURLValues(value);
        $.post('sc.msp', params, function (data) {
            if (typeof postCallback !== 'undefined') 
                postCallback(data);
        });
    } catch (err) {
        console.log("PostCMD: " + err);
    }
}
function PostData(cmd, value, id, postCallback) {
    try {
        if (typeof cmd === "undefined") return;
        if (typeof value === "undefined") value = "";
        if (typeof sid === "undefined") sid = "";
        var info = { c: cmd, v: value, s: id };
        $.post('post.msp', info, function (data) {
            if (typeof postCallback !== "undefined")
                postCallback(data);
        });
    } catch (err) {
        console.log("PostData: " + err);
    }
}
function CallAPI(cmd, value, postCallback) {
    try {
        if (typeof cmd === 'undefined') return;
        if (typeof value === 'undefined') value = "";
        var params = ""; 
        $.post('api/' + cmd  + "/" + value, params, function (data) {
            postCallback(data);
        });
    } catch (err) {
        console.log("CallAPI: " + err);
    }
}
function GetAPI(mid, cmd, value, postCallback) {
    try {
        if (typeof cmd === 'undefined') return;
        if (typeof value === 'undefined') value = "";
        var params = "";
        $.post('api/' + cmd + "/" + mid + "/" + value, params, function (data) {
            postCallback(data);
        });
    } catch (err) {
        console.log("CallAPI: " + err);
    }
}
function CleanURLValues(value) {
    try {
        value = replaceAll(value, "&", "%26");
        value = replaceAll(value, "=", "%3D");
    } catch (err) {
        console.log("CleanURLValues: " + err);
    }
    return value;
}
function ClearGameData() {
    try {
        mission = null;
        missionbriefing = "";
        //contacts.length = 0;
        //longRangeContacts.length = 0;
        //commChannels.length = 0;
        //logEntries.length = 0;
        //gameEvents.length = 0;
    } catch (err) {
        console.log("ClearGameData: " + err);
    }
}
function AddDebugMessage(type, value) {
    $("#debug-log").prepend("<div class='padded list-row'><div class='data' style='color:lightblue'>" + type + ": </div><div class='data'>" + value + "</div></div>");
}
function ParseCMDs(data) {
    parsingCMDs = true; //Consider Removing
    try {
        var d;
        if (data && data.constructor === Object) {
            d = data;
        } else {
            d = jQuery.parseJSON(data);
        }

        for (var key in d) {
            if (d.hasOwnProperty(key)) {
                ProcessCMD(key, d[key]);
            }
        }
    } catch (err) {
        console.log("ParseCMDs: " + err.toString);
    }

    parsingCMDs = false;
    //if (batchmode) SendAllClear();

    lastBeat = new Date().getTime() - startBeat;
    if (lastBeat > heartBeats) {
        heartBeats = heartBeats + 10;
    } else if (lastBeat < heartBeats && heartBeats > targetheartBeats) {
        heartBeats = heartBeats - 10;
        if (heartBeats < minHeartBeats)
            heartBeats = minHeartBeats;
    }
}
function ParseCMD(data) {
    try {
        var flds = data.split("|");
        var cmd = flds[0];
        var value = flds[1];

        //if (batchmode) {
            //if (value != "") value = jQuery.parseJSON(value);
            //processCMD(cmd, value);
        //} else {
            ProcessCMD(cmd, value);
        //}
    } catch (err) {
        console.log("ParseCMD: " + err);
    }
}
function ProcessCMD(cmd, value) {
    try {
        if (debuglog && cmd !== "BC") {
            AddDebugMessage(cmd,  value);
        }

        switch (cmd) {
            case "BC":
                // Batch Commands
                if (batchmode)
                    ParseCMDs(value);
                break;
            case "RLD":
                // Reload Console (Not Full);
                Reload(false);
                break;
            case "SVRS":
                // Server Start Time
                try {
                    var sd = new Date(value);
                    $(document).trigger('onServerInfo', sd);
                } catch (err) {
                    console.log("ProcessCMD.SVRS: " + err);
                }
                break;
            case "SETTINGS":
                shSettings = jQuery.parseJSON(value);
                $(document).trigger('onSettings', shSettings);
                break;
            case "MODULES":
                modules = jQuery.parseJSON(value);
                $(document).trigger('onModules');
                break;
            case "SESSION":
                gameSession = jQuery.parseJSON(value);
                $(document).trigger('onSession');
                break;
            case "SESSIONCLR":
                ClearGameData();
                break;
            case "SCEEENLEVEL":
                SetScreenLevel(value);
                break;
            case "CNS":
                ShowOnline();
                break;
            case "CNH":
                ShowOffline();
                break;
            case "CONSOLEMSG":
                if (value.indexOf(";") > -1) {
                    // Show Only If It's For This Console
                    var items = value.split(";");
                    if (items[0].toLowerCase() === screenName.toLowerCase()) {
                        ShowWarning(items[1]);
                    }
                } else {
                    // Show To All
                    ShowWarning(value);
                }
                break;
            case "ASC":
                ActiveConsoles = jQuery.parseJSON(value);
                $(document).trigger('onActiveConsoles');
                break;
            case "VDT":
                var vjson = jQuery.parseJSON(value);
                //thisvessel = jQuery.parseJSON(value);

                if (typeof thisvessel === "undefined")
                    thisvessel = vjson;

                if (thisvessel.ID !== vjson.ID)
                    thisvessel.ID = vjson.ID;

                var newManeuver = false;
                if (thisvessel.Maneuver !== vjson.Maneuver) {
                    thisvessel.Maneuver = vjson.Maneuver;
                    $(document).trigger('onManeuver');
                }

                thisvessel.Name = vjson.Name;
                thisvessel.Planet = vjson.Planet;
                thisvessel.Faction = vjson.Faction;
                thisvessel.Class = vjson.Class;
                thisvessel.BaseType = vjson.BaseType;
                thisvessel.SubType = vjson.SubType;

                //thisvessel.Integrity = vjson.Integrity;
                thisvessel.HealIntegrity = vjson.HealIntegrity;

                thisvessel.Speed = vjson.Speed;
                thisvessel.MaxSpeed = vjson.MaxSpeed;
                //thisvessel.Maneuver = vjson.Maneuver;

                if (screenName !== "gamemaster") {
                    thisvessel.NextPosition = vjson.Position;
                    thisvessel.NextOrientation = vjson.Orientation;
                }

                if (thisvessel.Integrity !== vjson.Integrity) {
                    thisvessel.Integrity = vjson.Integrity;
                    Shake();
                }

                if (thisvessel.Energy !== vjson.Energy) 
                    thisvessel.Energy = vjson.Energy;
                if (thisvessel.EnergyRemaining !== vjson.EnergyRemaining)
                    thisvessel.EnergyRemaining = vjson.EnergyRemaining;
                if (thisvessel.MaxEnergy !== vjson.MaxEnergy)
                    thisvessel.MaxEnergy = vjson.MaxEnergy;

                if (vesseldatareceived === false) {
                    vesseldatareceived = true;
                    vesselInit();
                    //if (batchmode) SendAllClear();
                }
                $(document).trigger('onVesselInfo');
                if ($("#wait-title").length !== 0 && thisvessel.Name !== "Object" && $("#wait-title").text() !== thisvessel.Name.toUpperCase()) 
                    $("#wait-title").text(thisvessel.Name.toUpperCase());

                // Update Focued Object?
                if (typeof focusedObject !== "undefined" && focusedObject.ID === thisvessel.ID)
                    UpdateFocusedObject(thisvessel);

                break;
            case "ROLES":
                rolesInUse = jQuery.parseJSON(value); 
                $(document).trigger('onRolesInUse');
                break;
            case "VARIABLES":
                missionVariables = jQuery.parseJSON(value); 
                $(document).trigger('onVariables');
                break;
            case "GFC":
                var list = jQuery.parseJSON(value);
                for (var i in list) {
                    var f = list[i];
                    factions[f.Name] = f;

                    var standings = Object.create(null);
                    for (var s in f.Standings) {
                        var st = f.Standings[s];
                        standings[st.Name] = st.Value;
                    }
                    factions[f.Name].Standings = standings;
                }
                $(document).trigger('onFactions');
                break;
            case "GVC":
                vesselClassData = jQuery.parseJSON(value);
                $(document).trigger('onVesselClasses');
                break;
            case "MSR":
                if (value === "") {
                    mission = null;
                } else {
                    mission = jQuery.parseJSON(value);
                }
                $(document).trigger('onMission');
                break;
            case "MSRBRF":
                missionbriefing = replaceAll(value, "\n", "<br>");
                $("#briefing").html(missionbriefing);
                break;
            case "MEV":
            case "EVENTS":
                gameEvents = jQuery.parseJSON(value);
                $(document).trigger('onGameEvents');
                break;
            case "EVENTSTATE":
                var ges = jQuery.parseJSON(value);
                for (var gei in gameEvents) {
                    var geu = gameEvents[gei];
                    if (geu.ID === ges.ID) {
                        geu.State = ges.State;
                        geu.Active = ges.Active;
                        geu.Conditions = ges.Conditions;
                        gameEvents[gei] = geu;
                        $(document).trigger('onGameEventState', geu);
                    }
                }
                //if (typeof gameEvents[ges.ID] !== "undefined") {
                //    gameEvents[ges.ID].State = ges.State;
                //    gameEvents[ges.ID].Active = ges.Active;
                //    gameEvents[ges.ID].Conditions = ges.Conditions;
                //    $(document).trigger('onGameEventState', ges);
                //}
                break;
            case "ENCOUNTERS":
                encounters = jQuery.parseJSON(value);
                $(document).trigger('onEncounters');
                break;
            case "TAGS":
                tags = jQuery.parseJSON(value);
                $(document).trigger('onTags');
                break;
            case "GCS":
                //value = jQuery.parseJSON(value).Value;
                currentScene = value;
                $(document).trigger('onScene');
                break;
            case "RST":
                ResetData();    //RESET DATA
                break;
            case "MWP":
                missionWaypoints = jQuery.parseJSON(value);
                $(document).trigger('onMissionWaypoints');
                break;
            case "VWP":
                vesselWaypoints = jQuery.parseJSON(value);
                $(document).trigger('onVesselWaypoints');
                break;
            //case "KBM":
            //    keyMap = jQuery.parseJSON(value);
            //    break;
            case "TCL":
            case "GM-OBJECTS":
                // Complete Contact List
                var tclList = jQuery.parseJSON(value);
                for (var tcli in tclList) {
                    var tclc = tclList[tcli];
                    if (typeof tclc.BaseType === 'undefined') { // && contacts[c.ID] != undefined) {
                        // This Is An Update Record
                        try {
                            if (typeof contacts[tclc.ID] === "undefined") {
                                // This Is An Update Record For A Contact We Don't Have
                                //SendCMD("CONTACT-REQUEST", tclc.ID);
                                continue;
                            }

                            if (typeof tclc.Planet !== "undefined")
                                contacts[tclc.ID].Planet = tclc.Planet;

                            contacts[tclc.ID].NextPosition = tclc.Position;
                            contacts[tclc.ID].NextOrientation = tclc.Orientation;
                            contacts[tclc.ID].NextRelative = tclc.Relative;

                            if (typeof contacts[tclc.ID].Position === "undefined")
                                contacts[tclc.ID].Position = contacts[tclc.ID].NextPosition;
                            if (typeof contacts[tclc.ID].Orientation === "undefined")
                                contacts[tclc.ID].Orientation = contacts[tclc.ID].NextOrientation;
                            if (typeof contacts[tclc.ID].Relative === "undefined")
                                contacts[tclc.ID].Relative = contacts[tclc.ID].NextRelative;

                            // This Object Contains Integrity and Shield Info
                            if (typeof contacts[tclc.ID].Integrity !== "undefined") {
                                contacts[tclc.ID].Integrity = tclc.Integrity;
                                contacts[tclc.ID].Shields = tclc.Shields;
                            }                         

                        } catch (err) {
                            //console.log("Update Contact: " + err.message);
                        }
                    } else {
                        // This Is A New Object Or A Full Update
                        var contactChanged = false;

                        if (typeof contacts[tclc.ID] !== "undefined") {
                            // Update
                            if (contacts[tclc.ID].Name != tclc.Name) {
                                contacts[tclc.ID].Name = tclc.Name;
                                contactChanged = true;
                            }
                            if (contacts[tclc.ID].BaseType != tclc.BaseType) {
                                contacts[tclc.ID].BaseType = tclc.BaseType;
                                contactChanged = true;
                            }
                            if (contacts[tclc.ID].SubType != tclc.SubType) {
                                contacts[tclc.ID].SubType = tclc.SubType;
                                contactChanged = true;
                            }
                            if (contacts[tclc.ID].Class != tclc.Class) {
                                contacts[tclc.ID].Class = tclc.Class;
                                contactChanged = true;
                            }

                            if (typeof tclc.Planet !== "undefined")
                                contacts[tclc.ID].Planet = tclc.Planet;
                            if (typeof tclc.Faction !== "undefined")
                                contacts[tclc.ID].Faction = tclc.Faction;
                            if (typeof tclc.Scanned !== "undefined")
                                contacts[tclc.ID].Scanned = tclc.Scanned;
                            //if (typeof tclc.Radius !== "undefined")
                            //    contacts[tclc.ID].Radius = tclc.Radius;

                            contacts[tclc.ID].NextPosition = tclc.Position;
                            contacts[tclc.ID].NextOrientation = tclc.Orientation;
                            contacts[tclc.ID].NextRelative = tclc.Relative;

                            contacts[tclc.ID].Shields = tclc.Shields;
                            contacts[tclc.ID].Integrity = tclc.Integrity;

                            if (contactChanged) 
                                $(document).trigger("onObjectUpdated", tclc.ID);

                        } else {
                            contacts[tclc.ID] = tclc;
                        }
                    }

                    // Update Focued Object?
                    if (typeof focusedObject !== "undefined" && focusedObject.ID === tclc.ID)
                        UpdateFocusedObject(tclc);

                }
                $(document).trigger('onContacts');

                // All Clear. This WIll Always Be The LAST Batch Command
                if (!batchmode)
                    SendAllClear();

                break;
            case "TCC":
                // Clear Contacts
                if (screenName === "gamemaster")
                    return;

                contacts = Object.create(null);
                $(document).trigger('onContacts');
                break;
            case "TCN":
                // Updated Contact
                var ct = jQuery.parseJSON(value);
                contacts[ct.ID] = ct;
                $(document).trigger('onContacts');
                break;
            case "LRCL":
                // Long Range Contact List
                var lrclList = jQuery.parseJSON(value);
                for (var lrcli in lrclList) {
                    var c = lrclList[lrcli];
                    if (typeof c.BaseType === "undefined" && typeof contacts[c.ID] !== "undefined") {
                        // This Is An Update Record
                        longRangeContacts[c.ID].Position = c.Position;
                        longRangeContacts[c.ID].Orientation = c.Orientation;
                        longRangeContacts[c.ID].Relative = c.Relative;
                    } else {
                        // This Is A New Object Or A Full Update
                        longRangeContacts[c.ID] = c;
                    }
                }
                $(document).trigger('onLongRageContacts');
                break;
            case "TCD":
                // Don't Execute For GM
                if (screenName === "gamemaster")
                    break;
                // Remove Contact (Dead or No Longer Visible)
                RemoveContact(parseInt(value));
                break;
            case "OBJECT-REMOVE":
                // Remove Contact (Dead)
                RemoveContact(parseInt(value));
                break;
            case "VCT":
                // Current Target
                if (value !== "0") {
                    currenttargetid = parseInt(value);

                    if (currenttargetid === thisvessel.ID) {
                        currenttarget = thisvessel;
                    } else {
                        if (typeof contacts !== 'undefined') {
                            for (var vcti in contacts) {
                                var o = contacts[vcti];
                                if (currenttargetid === o.ID) {
                                    currenttarget = o;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    currenttargetid = 0;
                    currenttarget = undefined;
                }

                $(document).trigger('onTargetInfo', currenttargetid);
                break;
            case "VCFT":
                // Current Flight Target
                if (value !== "0") {
                    flighttargetid = parseInt(value);

                    if (flighttargetid === thisvessel.ID) {
                        flighttarget = thisvessel;
                    } else {
                        if (typeof contacts !== 'undefined') {
                            for (var vcfti in contacts) {
                                var vcfto = contacts[vcfti];
                                if (flighttargetid === vcfto.ID) {
                                    flighttarget = vcfto;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    flighttargetid = 0;
                    flighttarget = undefined;
                }

                $(document).trigger('onFlightTargetInfo', flighttargetid);
                break;
            case "VCST":
                // Current Science Target
                if (value !== "0") {
                    sciencetargetid = parseInt(value);

                    if (sciencetargetid === thisvessel.ID) {
                        sciencetarget = thisvessel;
                    } else {
                        if (typeof contacts !== 'undefined') {
                            for (var vcsti in contacts) {
                                var vcsto = contacts[vcsti];
                                if (sciencetargetid === vcsto.ID) {
                                    sciencetarget = vcsto;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    sciencetargetid = 0;
                    sciencetarget = undefined;
                }

                $(document).trigger('onScienceTargetInfo', sciencetargetid);
                break;
            case "GM-OID":
                // GameMaster Current Target
                if (value !== "0" && value !== "-1") {
                    gmtargetid = parseInt(value);

                    if (gmtargetid === thisvessel.ID) {
                        gmtarget = thisvessel;
                    } else {
                        // Planets
                        if (typeof planetarySystem !== 'undefined') {
                            for (var vcgmi in planetarySystem) {
                                var gmo = planetarySystem[vcgmi];
                                if (gmtargetid === gmo.ID) {
                                    gmtarget = gmo;
                                    break;
                                }
                            }
                        }
                        // Contacts
                        if (typeof contacts !== 'undefined') {
                            for (var vcgmi in contacts) {
                                var gmo = contacts[vcgmi];
                                if (gmtargetid === gmo.ID) {
                                    gmtarget = gmo;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    gmtargetid = 0;
                    gmtarget = undefined;
                }

                $(document).trigger('onGameMasterTargetInfo');
                break;
            case "VAS":
                SetAlertStatus(value);
                break;
            case "VAP":
                vautopilot = value === "true" ? true : false;
                $(document).trigger('onAutopilot');
                break;
            //case "VSO":
            //    spacialData = jQuery.parseJSON(value);
            //    $(document).trigger('onSpacialInfo');
            //    break;
            case "VSL":
                // Log Entries
                logEntries = jQuery.parseJSON(value);
                $(document).trigger('onLogInfo');
                break;
            case "VCM":
                var vcmList = jQuery.parseJSON(value);
                for (var vcmi in vcmList) {
                    var vcmc = vcmList[vcmi];
                    if (typeof vcmc.Name === 'undefined') {
                        // This Is An Update Record
                        try {
                            componentData[vcmc.ID].Integrity = vcmc.Integrity; 
                            componentData[vcmc.ID].IntegrityR = vcmc.IntegrityR;
                            componentData[vcmc.ID].ChargeFactor = vcmc.ChargeFactor;
                            componentData[vcmc.ID].Level = vcmc.Level;
                            componentData[vcmc.ID].LevelR = vcmc.LevelR;
                            componentData[vcmc.ID].TargetLevel = vcmc.TargetLevel;
                            componentData[vcmc.ID].Status = vcmc.Status;
                            componentData[vcmc.ID].Safety = vcmc.Safety;
                            componentData[vcmc.ID].DamagePriority = vcmc.DamagePriority;
                        } catch (err) {
                            //console.log("Update Component: " + err.message);
                        }
                    } else {
                        // This Is A New Object Or A Full Update
                        componentData[vcmc.ID] = vcmc;
                    }
                }
                $(document).trigger('onComponents');
                break;
            case "VWG":
                weaponGroups = jQuery.parseJSON(value);
                $(document).trigger('onWeaponGroupInfo');
                break;
            case "VWL":
                var wpnList = jQuery.parseJSON(value);
                for (var wi in wpnList) {
                    var wpn = wpnList[wi];
                    if (typeof wpn.Name === 'undefined') {
                        // This Is An Update Record
                        try {
                            if (typeof weaponData[wpn.ID] === "undefined")
                                continue;

                            weaponData[wpn.ID].LevelR = wpn.LevelR;
                            weaponData[wpn.ID].CurrentTargetID = wpn.CurrentTargetID;
                            weaponData[wpn.ID].AmmoType = wpn.AmmoType;
                            weaponData[wpn.ID].Ammo = wpn.Ammo;
                            weaponData[wpn.ID].Energy = wpn.Energy;
                            weaponData[wpn.ID].Ready = wpn.Ready;
                            weaponData[wpn.ID].RecycleTime = wpn.RecycleTime;
                            weaponData[wpn.ID].FireAtWill = wpn.FireAtWill;
                        } catch (err) {
                            console.log("Update Weapon: " + err.message);
                        }
                    } else {
                        // This Is A New Object Or A Full Update
                        weaponData[wpn.ID] = wpn;
                    }
                }

                //weaponData = jQuery.parseJSON(value);
                $(document).trigger('onWeaponInfo');
                $(document).trigger('onWeaponGroupInfo');
                break;
            case "VORD":
                var ords = jQuery.parseJSON(value);
                for (var ordid in ords) {
                    var ord = ords[ordid];
                    ordinanceData[ord.Name] = ord;
                }
                $(document).trigger('onOrdinanceInfo');
                break;
            case "VORDS":
                $(document).trigger('onOrdinanceSelected', value);
                break;
            case "VDRO":
                droneData = jQuery.parseJSON(value);
                $(document).trigger('onDroneInfo');
                break;
            case "VDROT":
                droneTargetData = jQuery.parseJSON(value);
                $(document).trigger("onDroneTargetInfo");
                break;
            case "VCG":
                cargoData = jQuery.parseJSON(value);
                $(document).trigger('onCargoInfo');
                break;
            case "VAL":
                ammoData = jQuery.parseJSON(value);
                $(document).trigger('onWeaponInfo');
                break;
            case "VSS":
                shieldData = jQuery.parseJSON(value);
                $(document).trigger('onShieldInfo');
                break;
            case "VPC":
                activecamera = jQuery.parseJSON(value).Value;
                $(document).trigger('onCameraInfo');
                break;
            case "CAMERAS":
                cameraData = jQuery.parseJSON(value);
                $(document).trigger('onCameras', cameraData);
                break;
            case "VDI":
                deckData = jQuery.parseJSON(value);
                $(document).trigger('onDeckInfo');
                break;
            case "VDG":
                damageData = jQuery.parseJSON(value);
                $(document).trigger('onDamageInfo');
                break;
            case "VCR":
                crewData = jQuery.parseJSON(value);
                $(document).trigger('onCrewInfo');
                break;
            case "VDCT":
                // Damage Control Teams
                var vdctList = jQuery.parseJSON(value);
                for (var vdcti in vdctList) {
                    var vdctc = vdctList[vdcti];
                    if (typeof vdctc.Name === 'undefined') {
                        // This Is An Update Record
                        try {
                            damageTeams[vdctc.ID].ComponentID = vdctc.ComponentID;
                        } catch (err) {
                            console.log("ProcessCommand." + cmd + ": " + err);
                        }
                    } else {
                        // This Is A New Object Or A Full Update
                        damageTeams[vdctc.ID] = vdctc;
                    }
                }
                $(document).trigger('onDamageControlTeams', value);
                break;
            case "VDCM":
                $(document).trigger('onDamageControlMode', value);
                break;
            case "CCL":
                // All Channels
                var channels = jQuery.parseJSON(value);
                for (var ccli in channels) {
                    var ccl = channels[ccli];
                    commChannels[ccl.ID] = ccl;
                }
                $(document).trigger('onCommChannel');
                break;
            case "CCN":
                // Single/New/Updated Comm Channel
                var channel = jQuery.parseJSON(value);
                commChannels[channel.ID] = channel;
                $(document).trigger('onCommChannel', channel);
                break;
            case "CCD":
                // Close Channel
                var channelidc = parseInt(value);
                if (typeof commChannels[channelidc] !== "undefined") {
                    delete commChannels[channelidc];
                    $(document).trigger('onCommChannelClose', channelidc);
                }
                break;
            case "CCS":
                // Select Channel
                var channelids = parseInt(value);
                $(document).trigger('onCommChannelSelect', channelids);
                break;
            case "CTL":
                var topics = jQuery.parseJSON(value);
                contactTopics(topics);
                break;
            case "CMN":
                var newmessage = jQuery.parseJSON(value);
                if (typeof commChannels === 'undefined') break;
                if (typeof commChannels[newmessage.CommChannelID] !== "undefined") {
                    if (commChannels[newmessage.CommChannelID].Visisble === false) {
                        // Show Channel
                        commChannels[newmessage.CommChannelID].Visisble = true;
                        $(document).trigger('onCommChannel');
                    }
                    commChannels[newmessage.CommChannelID].Messages[newmessage.ID] = newmessage;

                    console.log(JSON.stringify(newmessage));

                    $(document).trigger('onCommMessage', newmessage);
                }
                break;
            case "CCU":
                $(document).trigger("onCommChannelUpdate");
                break;
            case "SXM":
                // TODO: Remove Global Var and use only passed object
                try {
                    scanResults = jQuery.parseJSON(value);
                    $(document).trigger('onScanDetail', scanResults);
                } catch (err) {
                    console.log("ProcessCommand.SXM: " + err.message);
                }
                break;
            case "SXS":
                // TODO: Remove Global Var and use only passed object
                systemScanResults = jQuery.parseJSON(value);
                $(document).trigger('onSystemScanDetail', systemScanResults);
                break;
            case "IDT":
                indentify();
                break;
            case "GVP":
                // Galactic Position
                if (typeof thisvessel !== "undefined") {
                    thisvessel.NextGalacticPosition = jQuery.parseJSON(value);
                    //galacticpos = jQuery.parseJSON(value);
                    $(document).trigger('onGalacticPosition');
                }
                break;
            case "GVS":
                // Star Position
                if (typeof thisvessel !== "undefined") {
                    thisvessel.NextStarPosition = jQuery.parseJSON(value);
                    //starpos = jQuery.parseJSON(value);
                    $(document).trigger('onGalacticPosition');
                }
                break;
            case "MAP":
                currentMap = jQuery.parseJSON(value);
                $(document).trigger('onMapInfo');
                break;
            case "SSD":
                if (value === "{}")
                    starSystem = undefined;
                else
                    starSystem = jQuery.parseJSON(value);
                $(document).trigger('onStarSystemDetail');
                break;
            case "PSD":
                if (value === "[]") 
                    planetarySystem = undefined;
                else 
                    planetarySystem = jQuery.parseJSON(value);
                $(document).trigger('onPlanetarySystemDetail');
                break;
            case "GSP":
                var gi = jQuery.parseJSON(value);
                var updatePP = false;

                // Reset Focos For Maps?
                if (typeof galacticinfo === "undefined") {
                    updatePP = true;
                } else if (galacticinfo.System !== gi.System) {
                    updatePP = true;
                } else if (galacticinfo.Planet !== gi.Planet) {
                    updatePP = true;
                }

                if (updatePP) {
                    //thisvessel.Position = gi.Position;
                    //thisvessel.NextPosition = gi.Position;
                    $(document).trigger('onFocus');
                }

                galacticinfo = gi;

                $(document).trigger('onGalacticInfo');
                break;
            case "BLAST":
                var blast = jQuery.parseJSON(value);
                console.log("BLAST: " + value);
                break;
            case "OLN":
                officer = jQuery.parseJSON(value);
                SetOfficer();
                break;
            case "OLF":
                officer = undefined;
                SetOfficer();
                break;
            case "EVH":
                Shake();
                break;
            case "EVD":
                BreakConsole();
                break;
            case "SCREENLEVEL":
                SetScreenLevel(value);
                break;
            case "CONSOLELOCK":
                LockScreen(value === "true" ? true : false);
                break;
            case "CONSOLEHEADERLOCK":
                LockHeader(value === "true" ? true : false);
                break;
            case "MSG":
                var msg = jQuery.parseJSON(value);
                $(document).trigger('onMessage', msg);
                break;
            case "MISSIONS":
                availableMissions = jQuery.parseJSON(value);
                $(document).trigger('onMissions');
                break;
            case "CARGOTXL":
                // Cargo Transfer List
                $(document).trigger('onCargoTransferList', value);
                break;
            case "SCREENS":
                gameScreens = jQuery.parseJSON(value);
                $(document).trigger('onConsoles');
                break;
            case "CNTL":
                var ctllist = jQuery.parseJSON(value);
                for (var ci in ctllist) {
                    var c = ctllist[ci];
                    if (typeof controllers[c.Type] === "undefined") {
                        // NEW!
                    }
                    controllers[c.Type] = c;
                }
                $(document).trigger('onControllers');
                break;
            case "DEVICES":
                // Convert | Back
                value = replaceAll(value, "¦", "|");
                devices = jQuery.parseJSON(value);
                $(document).trigger('onDevices');
                break;
            case "DEVICE-DELETE":
                if (typeof devices["ID" + value] !== "undefined")
                    delete devices["ID" + value];
                $(document).trigger('onDevices');
                break;
            case "DEVICE-STATUS":
                var status = jQuery.parseJSON(value);
                if (typeof devices["ID" + status.ID] !== "undefined") {
                    var d = devices["ID" + status.ID];
                    d.Status = status.Status;
                    d.StatusCode = status.StatusCode;
                    d.Level = status.Level;
                    d.Settings = status.Settings;
                    d.Properties = status.Properties;
                    d.Online = status.Online;

                    devices["ID" + status.ID] = d;

                    $(document).trigger('onDevices');
                }
                break;
            case "HUEBL":
                hueBridges = jQuery.parseJSON(value);
                $(document).trigger('onHueBridges', value);
                break;
            case "MQTT":
                var mqttMsg = jQuery.parseJSON(value);
                $(document).trigger('onMqttMessage', mqttMsg);
                break;
            default:
                UseCMD(cmd, value);
                break;
        }
    } catch (err) {
        console.log("ProcessCommand." + cmd + ": " + err.message);
    }
}

// GAME Functions
function Stardate() {

    //var origin = new Date("July 15, 1987 00:00:00");
    var origin = new Date("January 1, 2000 00:00:00");
    var today = new Date();

    today.setSeconds(0);
    today.toGMTString(0);

    var stardateToday = today.getTime() - origin.getTime();
    stardateToday = stardateToday / (1000 * 60 * 60 * 24 * 0.036525);
    stardateToday = Math.floor(stardateToday + 410000);
    stardateToday = stardateToday / 10;

    return stardateToday;
}
function GetSystemDetail(id, coords) {
    SendCMD("SSD", id);
    if ($.isFunction(window.viewMode)) {
        $("#map-level-2").trigger("mousedown");
        //viewMode('system');
    }
}
function TriggerEvent(id) {
    SendCMD("EVENT", id);
}
function TriggerEncounter(id, enc) {
    if (typeof enc === "undefined")
        enc = "";
    var enc = { ID: id, Encounter: enc }
    var data = JSON.stringify(enc);
    SendCMD("ENCOUNTER", data);
}

// VESSEL Functions
function SetAlertStatus(value) {
    try {
        var st = parseInt(value);
        var so = valert;
        valert = st;
        $("#style-alert").attr("href", "/styles/alert" + valert + ".css");
        if (st !== so) {
            $(document).trigger('onAlert');
            $(document).trigger('onWeaponGroupInfo');
        }
    } catch (err) {
        console.log("SetAlertStatus: " + err);
    }

}
function SetViewerTarget(id) {
    if (typeof id === "undefined") id = 0;
    SendCMD("SCT", id);
}
function ToggleShields() {
    if (valert === null) return;
    if (valert.Enabled === true) {
        SendCMD('VSE', 'False');
    } else {
        SendCMD('VSE', 'True');
    }
}
function AddStellarWaypoint(id) {
    SendCMD('SWP', id);
}

// GAMEOBJECT Functions
function ObjectSelected(id) {
    if (typeof id === "undefined")
        return;
    $(document).trigger('onObjectSelected', id);
}
function RemoveContact(id) {
    // Remove Contact
    if (selectedid === id) {
        selectedid = 0;
        selecteduid = 0;
        selectedobj = null;
    }
    if (flighttargetid !== 0 && flighttargetid === id) {
        flighttargetid = 0;
        flighttarget = null;
        $(document).trigger('onFlightTargetInfo');
    }
    if (currenttargetid !== 0 && currenttargetid === id) {
        currenttargetid = 0;
        currenttarget = null;
        $(document).trigger('onTargetInfo');
    }
    delete contacts[id];
    $(document).trigger('onSelectionChanged');
    $(document).trigger('onContacts');
    $(document).trigger('onRemoveContact', id);
}
function GetNearestEnemy(station) {
    if (typeof contacts === "undefined") return 0;

    try {
        var nearest = 2000000;
        var nearestid = 0;

        for (var c in contacts) {
            var go = contacts[c];

            if (IsEnemyFaction(go) && go.BaseType !== "Object") {
                var dist = GetDistance(thisvessel.Position, go.Position);

                if (dist < nearest) {
                    nearest = dist;
                    nearestid = go.ID;
                }
            }
        }

        switch (station) {
            case "Flight":
                SendCMD('VCFT', nearestid);
                break;
            case "Tactical":
                SendCMD('VCT', nearestid);
                break;
            case "Science":
                SendCMD('VCST', nearestid);
                break;
        }

        return nearestid;

    } catch (err) {
        console.log("GetNearestEnemy: " + err);
    }
}
function GetNearestObject(station) {
    if (typeof contacts === 'undefined') return 0;

    try {
        var nearest = 2000000;
        var nearestid = null;

        for (var c in contacts) {
            var go = contacts[c];

            var dist = GetDistance(thisvessel.Position, go.Position);

            if (dist < nearest) {
                nearest = dist;
                nearestid = go.ID;
            }
        }

        switch (station) {
            case "Flight":
                SendCMD('VCFT', nearestid);
                break;
            case "Tactical":
                SendCMD('VCT', nearestid);
                break;
            case "Science":
                SendCMD('VCST', nearestid);
                break;
        }

        return nearestid;

    } catch (err) {
        console.log("GetNearestObject: " + err);
    }
}
function GetNearestPlanet(station) {
    if (typeof contacts === 'undefined') return 0;

    try {
        var nearest = 2000000;
        var nearestid = null;

        for (var c in contacts) {
            var go = contacts[c];

            if (go.BaseType === "Planet") {
                var dist = GetDistance(thisvessel.Position, go.Position);

                if (dist < nearest) {
                    nearest = dist;
                    nearestid = go.ID;
                }
            }
        }

        switch (station) {
            case "Flight":
                SendCMD('VCFT', nearestid);
                break;
            case "Tactical":
                SendCMD('VCT', nearestid);
                break;
            case "Science":
                SendCMD('VCST', nearestid);
                break;
        }

        return nearestid;

    } catch (err) {
        console.log("GetNearestPlanet: " + err);
    }
}
function GetNearestStation(station) {
    if (typeof contacts === 'undefined') return 0;

    try {
        var nearest = 2000000;
        var nearestid = null;

        for (var c in contacts) {
            var go = contacts[c];

            if (go.BaseType === "Station") {
                var dist = GetDistance(thisvessel.Position, go.Position);

                if (dist < nearest) {
                    nearest = dist;
                    nearestid = go.ID;
                }
            }
        }

        switch (station) {
            case "Flight":
                SendCMD('VCFT', nearestid);
                break;
            case "Tactical":
                SendCMD('VCT', nearestid);
                break;
            case "Science":
                SendCMD('VCST', nearestid);
                break;
        }

        return nearestid;

    } catch (err) {
        console.log("GetNearestStation: " + err);
    }
}
function GetNextStation(station) {
    if (typeof contacts === 'undefined') return 0;

    try {
        var firstid = null;
        var nextid = null;
        var found = false;

        for (var c in contacts) {
            var go = contacts[c];

            if (firstid === null && go.BaseType === "Station")
                firstid = go.ID;
            if (go.ID === selectedid && go.BaseType === "Station") {
                found = true;
            } else if (found && go.BaseType === "Station") {
                nextid = go.ID;
                break;
            }
        }

        if (firstid === null && nextid === null) {
            // Nothing To Select
            return;
        } else if (nextid === null) {
            // We Didn't Find A Next, So Use First
            nextid = firstid;
        }

        // Station Specific Commands To Select Object
        switch (station) {
            case "Flight":
                SendCMD('VCFT', nextid);
                break;
            case "Tactical":
                SendCMD('VCT', nextid);
                break;
            case "Science":
                SendCMD('VCST', nearestid);
                break;
        }

        return nearestid;

    } catch (err) {
        console.log("GetNextStation: " + err);
    }
}
function IsEnemyFaction(object) {
    if (typeof thisvessel === 'undefined') return false;
    if (typeof object === 'undefined') return false;

    //var vf = GetFaction(thisvessel.Faction);
    //var of = GetFaction(object.Faction);

    //if (vf.Standings[object.Faction] <= -.4) {
    //    return true;
    //} else {
    //    return false;
    //}

    if (object.BaseType !== "Planet" && object.Faction !== "" && object.Faction !== "Unknown" && object.Faction !== "Neutral" && object.Faction !== thisvessel.Faction) {
        return true;
    } else {
        return false;
    }
}
function GetFaction(id) {
    try {
        if (typeof factions[id] !== "undefined") {
            return factions[id];
        }
        // Send Blank Value
        var blank;
        blank.Name = "Unknown";
        blank.Description = "Unknown";
        blank.HomeWorld = "Unknown";
        blank.Image = "";
        blank.Color = "";
        return blank;
    } catch (err) {
        console.log("GetFaction: " + err);
    }
}
function GetPlanetDetail(id) {
    SendCMD("PSD", id);
}

// TIME
function GetTime() {
    try {
        var source = new Date();
        var hours = source.getHours();
        var minutes = source.getMinutes();
        var seconds = source.getSeconds();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        var strTime = hours + ':' + minutes + ":" + seconds + ampm;
        return strTime;
    } catch (err) {
        return "";
    }
}
function TimeToAMPM(source) {
    var hours = source.getHours();
    var minutes = source.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}
function TimeToDate(source) {
    return (source.getMonth() + 1) +
        "/" + source.getDate() +
        "/" + source.getFullYear();
}
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function TimeToDay(source) {
    try {
        return days[source.getDay()];
    } catch (err) {
        console.log("TimeToDay: " + err.message);
    }

}
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function TimeToMonth(source) {
    try {
        return months[source.getMonth()];
    } catch (err) {
        console.log("TimeToMonth: " + err.message);
    }
}

// LOCATION

function GetLocation() {
    try {
        if (screenLocation !== "")
            return;

        $.getJSON('https://ipapi.co/json/', function (data) {
            screenLocation = data.city + ", " + data.region_code;
            //console.log(data.city + ", " + data.region_code)
            //SendCMD("LOCATION", screenLocation);
        })
    } catch (err) {

    }
}

// FORMS
function ClearFields(match) {
    $("[id^='" + match + "-']").each(function (index, el) {
        var id = el.dataset["id"];
        if (typeof id === "undefined") return;

        if ($(el).is(':checkbox')) {
            $(el).prop('checked', false);
        } else if ($(el).is("input")) {
            $(el).val("");
        } else if ($(el).is("textarea")) {
            $(el).val("");
        } else if ($(el).is("select")) {
            $(el).val("");
        }
    });
}
function SetFields(match, source) {
    try {
        if (typeof source === "undefined") return;
        $("[id^='" + match + "-']").each(function (index, el) {
            var id = el.dataset["id"];
            if (typeof id === "undefined") return;

            if ($(el).is(':checkbox')) {
                $(el).prop('checked', ReadProperty(source, id));
            } else if ($(el).is("input")) {
                $(el).val(ReadProperty(source, id));
            } else if ($(el).is("textarea")) {
                $(el).val(ReadProperty(source, id));
            } else if ($(el).is("select")) {
                // Set Data Value As Backup
                $(el).data("value", ReadProperty(source, id));
                $(el).val(ReadProperty(source, id));
            }

            $(el).trigger("change");

        });
    } catch (err) {
        console.log("SetFields: " + err.message);
    }
}
function SaveFields(match, source) {
    $("[id^='" + match + "-']").each(function (index, el) {
        var id = el.dataset["id"];

        if (typeof id === "undefined")
            return;
        if (id === "")
            return;

        if ($(el).is(":checkbox")) {
            source[id] = $(el).is(":checked");
        } else if ($(el).is("input")) {
            source[id] = $(el).val();
        } else if ($(el).is("textarea")) {
            source[id] = $(el).val();
        } else if ($(el).is("select")) {
            source[id] = $(el).val();
        }
    });
}
function SetValue(source, value) {
    try {
        if ($(source).is(':checkbox')) {
            $(source).prop('checked', value);
        } else if ($(source).is("select")) {
            // Set Data Value As Backup
            if ($(source).val() !== value) {
                $(source).data("value", value);
                $(source).val(value);
            }
        } else {
            // Assume Basic Input
            if ($(source).val() !== value)
                $(source).val(value);
        }
    } catch (err) {
        console.log("SetValue: " + err.message);
    }
}
function GetValue(source) {
    try {
        if ($(source).is(":checkbox")) {
            return $(source).is(":checked");
        } else if ($(source).is("input")) {
            return $(source).val();
        } else if ($(source).is("textarea")) {
            return $(source).val();
        } else if ($(source).is("select")) {
            return $(source).val();
        }
    } catch (err) {
        console.log("GetValue: " + err.message);
    }
}
function FileGetBase64(source, dest) {
    //var preview = document.querySelector('img');
    var file = document.querySelector(source).files[0];
    var preview = $(dest);
    //var file = $(source).files[0];
    var reader = new FileReader();

    reader.addEventListener("load", function () {
        preview.data("base64", reader.result);
        preview.css("background-image", "url(" + reader.result + ")");
        //$(source).data("contents", reader.result);
        //preview.src = reader.result;
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}
function IsNumberKey(event) {
    var charCode = event.which ? event.which : event.keyCode;
    if (charCode !== 46 && charCode > 31
        && (charCode < 48 || charCode > 57))
        return false;

    return true;
}
function ReadCookies() {
    var allcookies = document.cookie;
    // Get all the cookies pairs in an array
    cookiearray = allcookies.split(';');
    // Now take key value pair out of this array
    for (var i = 0; i < cookiearray.length; i++) {
        name = cookiearray[i].split('=')[0];
        value = cookiearray[i].split('=')[1];
        //document.write("Key is : " + name + " and Value is : " + value);
    }
}
function GetCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function SetCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// INPUT
function StickyKey(source, action, maxkeyrate, timeout) {
    var t;
    var keyrate = 1;
    var repeat = function () {
        action();
        keyrate++; if (keyrate > maxkeyrate) { keyrate = maxkeyrate; }
        t = setTimeout(repeat, timeout);
    };
    $(source).on('mousedown', function () {
        repeat(keyrate);
    });
    $(source).on('touchstart', function () {
        repeat(keyrate);
    });
    $(source).on('mouseup', function () {
        clearTimeout(t);
        keyrate = 1;
    });
    $(source).on('touchend', function () {
        clearTimeout(t);
        keyrate = 1;
    });
}
function MapAction(source, action) {
    // Allows System To Handle Both Click and/or Touch events for this object
    $(source).on('mousedown touchstart', function (e) {
        e.preventDefault();
        action();
    });
}
function MapGameKey(source, key, single) {
    if (typeof single === 'undefined')
        single = false;

    $(source).data('pressed', false);

    if (single === false) {
        $(source).on('mousedown touchstart', function (e) {
            $(source).data('pressed', true);
            SendCMD("KMD", key);

            $(source).one('mouseleave mouseup touchleave touchend', function () {
                $(source).data('pressed', false);
                SendCMD("KMU", key);
            });
        });
    } else {
        $(source).on('mousedown touchstart', function (e) {
            e.preventDefault();
            SendCMD("KMC", key);
        });
    }
}
function MapInput(source, action) {
    if (typeof source === 'undefined')
        return;

    $(source).on('mousedown touchstart', function (e) {
        SendCMD("INPUT", action);
    });

}
function MapKey(key, command, single) {
    // Maps A Keyboard Press (key) To An In-Game Command/Action (command). 
    // single Indicates If This Is A Single Action(Not Press - And - Hold)
    try {
        if (typeof key === "undefined")
            return;
        if (typeof command === "undefined")
            return;
        if (typeof single === "undefined")
            single = false;

        keyMap[key] = { Command: command, Single: single };
    } catch (err) {

    }
}
function ReadProperty(obj, prop) {
    return obj[prop];
}
function SetKeyMode(source, mode) {
    if (typeof mode === 'undefined') mode = "Active";

    switch (mode) {
        case "Pulse":
            if ($(source).hasClass("dim")) $(source).removeClass("dim");
            if (!$(source).hasClass("pulse")) $(source).addClass("pulse");
            break;
        case "Blink":
            if ($(source).hasClass("dim")) $(source).removeClass("dim");
            if (!$(source).hasClass("blink")) $(source).addClass("blink");
            if ($(source).hasClass("pulse")) $(source).removeClass("pulse");
            break;
        case "Disabled":
            if (!$(source).hasClass("dim")) $(source).addClass("dim");
            if ($(source).hasClass("blink")) $(source).removeClass("blink");
            if ($(source).hasClass("pulse")) $(source).removeClass("pulse");
            break;
        default:
            //Active
            if ($(source).hasClass("dim")) $(source).removeClass("dim");
            if ($(source).hasClass("blink")) $(source).removeClass("blink");
            if ($(source).hasClass("pulse")) $(source).removeClass("pulse");
            break;
    }
}
function AddOptionGroup(source, text) {
    if (typeof value === "undefined") value = text;

    $(source).append("<optiongroup label=\"" + text + "\"/>");
}
function AddOption(source, text, value) {
    if (typeof value === "undefined") value = text;

    $(source).append("<option value=\"" + value + "\">" + text + "</option>");
}
function SetOptionRange(source, min, max) {
    $(source).empty();
    for (var c = min; c <= max; c++) {
        $(source).append("<option value='" + c + "'>" + c + "</option>");
    }
}
function SetInputValue(source, value) {
    try {
        $(source).val(value);
        $(source).trigger("input");
    } catch (err) {
        console.log("SetInputValue: " + err.message);
    }
}
function CsvToString(value) {
    var newValues = [];
    try {
        var values = value.split(",");

        for (var i = 0; i < values.length; i++) {
            if (values[i].trim() !== "")
                newValues.push(values[i].trim());
        }
    } catch (err) {
        console.log("CsvToString: " + err.message);
    }
    return newValues;
}
function GetLength(source) {
    try {
        return Object.keys(source).length;
    } catch (err) {
        return 0;
    }
}

function GetVariable(id) {
    try {
        if (typeof missionVariables[id] !== "undefined")
            return missionVariables[id];
    } catch (err) {
        console.log("GetVariable: " + err.message);
    }
    return "";
}
function SetVariable(id, value) {
    try {
        missionVariables[id] = value;
        SendCMD("VAR-SET", "{\"Name\": \"" + id + "\", \"Value\": \"" + value + "\" }");
    } catch (err) {
        console.log("SetVariable: " + err.message);
    }
}
// SELECTION
function SelectDrone(id) {
    $(document).trigger('onDroneSelection', id);
}

// Navigation 

function GotoTab(group, tab) {
    $("." + group).hide();
    $("#" + group + "-" + tab).show();
}

// UI 
function ShowDialog(target, dialogclass, height, width) {
    var dialogid = "puDialog";
    var dwidth = $(window.top.document).width();
    var dheight = $(window.top.document).height();
    if (arguments.length === 2) {
        height = 525;
        width = 600;
    }
    $("body", window.top.document).append("<div id='shader' style='height: " + dheight + "px; width: " + dwidth + "px;' onclick='closeDialog();'><div id='" + dialogid + "' class='Dialog " + dialogclass + "' style='height:" + height + "px;width:" + width + "px;'><iframe id='ifDialog' frameborder=0 scrolling='no' src='/portal/" + target + "' style='height:" + height + "px;width:" + width + "px;'></iframe></div></div>");
    $("#" + dialogid, window.top.document).show();
}
function ShowNotifcation(msg, top) {
    if (typeof msg === "undefined" | msg === "") return;

    if (typeof top === "undefined") top = -4;
    var left = ($(document).width() / 2) - 197;
    warningCount++;
    $("body").append("<div id='console-notification" + warningCount + "' class='console-notification' style='top: " + top + "px;left:" + left + "px'>" + msg + "</div>");
    $("#console-notification" + warningCount).slideDown(2000).delay(2000).fadeOut(250, function () {
        $("#console-notification" + warningCount).remove();
        warningCount--;
    });
}
function ShowWarning(msg, top) {
    if (typeof msg === "undefined" | msg === "") return;

    if (typeof top === "undefined") top = 70;
    var left = ($(document).width() / 2) - 197;
    warningCount++;
    $("body").append("<div id='console-warning" + warningCount + "' class='console-warning' style='left:" + left + "px'>" + msg + "</div>");
    $("#console-warning" + warningCount).delay(4000).fadeOut(250, function () {
        $("#console-warning" + warningCount).remove();
        warningCount--;
    });
}
function ShowMessage(msg, top) {
    if (typeof msg === "undefined" | msg === "") return;

    if (typeof top === "undefined") top = 70;
    var left = ($(document).width() / 2) - 197;
    warningCount++;
    $("body").append("<div id='console-message" + warningCount + "' class='console-notification' style='left:" + left + "px'>" + msg + "</div>");
    $("#console-message" + warningCount).delay(4000).fadeOut(250, function () {
        $("#console-message" + warningCount).remove();
        warningCount--;
    });
}
function ToggleDebug() {
    debuglog = !debuglog;
    if (debuglog) {
        $("#debug-panel").show();
    } else {
        $("#debug-panel").hide();
    }
    $("#debug-log").empty();
}
function CloseDialog() {
    $("#shader", window.top.document).remove();
}
function CloseInfo() {
    $(".info-dialog", window.top.document).remove();
}
function SetRadarZoom(v) {
    if (radarZoom > 4) radarZoom = 4;
    if (radarZoom < .0625) radarZoom = .0625;
    radarZoom = v;
}
function ZoomIn() {
    try {
        radarZoom = radarZoom * 2;
    } catch (err) {
        console.log("ZoomIn: " + err);
    }
    if (isNaN(radarZoom) || radarZoom > 4) radarZoom = 4;
}
function ZoomOut() {
    try {
        radarZoom = radarZoom / 2;

    } catch (err) {
        console.log("ZoomOut: " + err);
    }
    if (isNaN(radarZoom) || radarZoom < .0625) radarZoom = .0625;
}
function ZoomMapIn() {
    mapZoom = mapZoom * 2;
    if (mapZoom > 16) mapZoom = 16;
}
function ZoomMapOut() {
    mapZoom = mapZoom / 2;
    if (mapZoom < 1) mapZoom = 1;
}

function SetMapZoom(zoom) {
    mapZoom = zoom;
    $(document).trigger("onMapZoom", zoom);
}
function SetMapMode(mode) {
    $(document).trigger("onMapMode", mode);
}

// FILES
function HasFiles(source) {
    try {
        return $(source).get(0).files.length;
    } catch (err) {
        console.log("HasFiles: " + err.message);
    }
    return 0;
}
function SendFile(source, sid, onSuccess, onProgress) {
    try {
        var files = $(source)[0].files;     // Get the files from the input
        var formData = new FormData();      // Create a new FormData object.
        var file = files[0];                // Grab just one file, since we are not allowing multiple file uploads
        if (typeof sid === "undefined") sid = storyID;
        if (file.size >= 75000000) {
            alert('This file is larger than 50MB. It cannot be uploaded. You can move the file manually into the Story directory and then select it from the dropdown.');
            $(source).val('');
            onSuccess("OK");
            return;
        }

        // Add the file to the request.
        formData.append('storyID', sid);
        formData.append('source', file, file.name);
        $(source).data("lastfile", file.name);

        $.ajax({
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        // Do something with upload progress here
                        onProgress(percentComplete);
                    }
                }, false);

                xhr.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        // Do something with download progress
                        onProgress(percentComplete);
                    }
                }, false);

                return xhr;
            },
            type: "POST",
            url: "/upload.msp",
            data: formData,
            contentType: false,
            processData: false,
            success: function (data) {
                onSuccess(data);
            },
            error: function () {
                onSuccess("UPLOAD FAILURE");
            }
        });

        $(source).val("");

    } catch (err) {
        console.log("SendFile: " + err.message);
    }
}
function GetFileName(source) {
    return source.split('\\').pop().split('/').pop();
    //return source.replace(/^.*[\\\/]/, '');
}
function GetUserFiles(moduleID, onComplete) {
    try {
        PostCMD("USERFILES", "{ \"Filter\": \"\", \"ModuleID\": \"" + moduleID + "\"}", function (result) {
            userFiles = JSON.parse(result);
            $(document).trigger('onUserFiles');
            if (typeof onComplete !== "undefined") {
                onComplete();
            }
        });
    } catch (err) {
        console.log("GetUserFiles: " + err.message);
    }
}
function GetHtmlMedia(mid, onComplete) {
    try {
        if (typeof mid === "undefined")
            mid = moduleID;

        PostCMD("HTMLMEDIA", "{ \"Filter\": \"\", \"ModuleID\": \"" + mid + "\"}", function (result) {
            htmlMedia = JSON.parse(result);
            $(document).trigger('onHtmlMedia');
            if (typeof onComplete !== "undefined") {
                onComplete();
            }
        });
    } catch (err) {
        console.log("GetUserFiles: " + err.message);
    }
}
function SetFileList(source, filter) {
    if (typeof source === "undefined") return;
    if (typeof userFiles === "undefined") return;
    if (typeof filter === "undefined")
        filter = $(source).data("filter");
    if (typeof filter === "undefined")
        filter = "Image";

    var allowNone = $(source).data("allownone");
    if (typeof allowNone === "undefined")
        allowNone = false;

    var prevalue = $(source).val();
    if (typeof prevalue === "undefined" && typeof $(source).data("value") !== "undefined") {
        prevalue = $(source).data("value");
    }

    $(source).empty();
    $(source).data("filter", filter);

    if (allowNone)
        AddOption(source, "None", "");

    for (var c in userFiles) {
        var file = userFiles[c];

        if (filter.includes("Image")) {
            if (file.Type === "bmp" || file.Type === "jpg" || file.Type === "jpeg" || file.Type === "gif" || file.Type === "png")
                AddOption(source, file.Name);
        }
        if (filter.includes("Audio")) {
            if (file.Type === "mp3")
                AddOption(source, file.Name);
        }
        if (filter.includes("Video")) {
            if (file.Type === "mp4" || file.Type === "m4v")
                AddOption(source, file.Name);
        }

    }

    $(source).val(prevalue);

}
function SetHtmlMediaList(source, filter) {
    if (typeof source === "undefined") return;
    if (typeof userFiles === "undefined") return;
    if (typeof filter === "undefined")
        filter = $(source).data("filter");
    if (typeof filter === "undefined")
        filter = "Image";

    var allowNone = $(source).data("allownone");
    if (typeof allowNone === "undefined")
        allowNone = false;

    var prevalue = $(source).val();
    if (typeof prevalue === "undefined" && typeof $(source).data("value") !== "undefined") {
        prevalue = $(source).data("value");
    }

    $(source).empty();
    $(source).data("filter", filter);

    if (allowNone)
        AddOption(source, "None", "");

    for (var c in htmlMedia) {
        var file = htmlMedia[c];

        if (filter.includes("Image")) {
            if (file.Type === "bmp" || file.Type === "jpg" || file.Type === "jpeg" || file.Type === "gif" || file.Type === "png")
                AddOption(source, file.Name);
        }
        if (filter.includes("Audio")) {
            if (file.Type === "mp3")
                AddOption(source, file.Name);
        }
        if (filter.includes("Video")) {
            if (file.Type === "mp4" || file.Type === "m4v")
                AddOption(source, file.Name);
        }

    }

    $(source).val(prevalue);

}

// CSS
function Show(source) {
    try {
        $(source).show();
    } catch (err) {
        //
    }
}
function Hide(source) {
    try {
        $(source).hide();
    } catch (err) {
        //
    }
}

function SetData(source, id, value) {
    try {
        if ($(source).data(id) !== value)
            $(source).data(id, value);
    } catch (err) {
        console.log("SetData: " + err.message);
    }
}
function SetText(source, value) {
    try {
        if ($(source).text() !== value)
            $(source).text(value);
    } catch (err) {
        console.log("SetText: " + err.message);
    }
}
function SetHtml(source, value) {
    try {
        if ($(source).html() !== value)
            $(source).html(value);
    } catch (err) {
        console.log("SetHtml: " + err.message);
    }
}
function IsVisible(source) {
    return $(source).is(":visible");
}
function AddClass(source, value) {
    try {
        if (!$(source).hasClass(value))
            $(source).addClass(value);
    } catch (err) {
        console.log("AddClass: " + err.message);
    }
}
function RemoveClass(source, value) {
    try {
        if ($(source).hasClass(value))
            $(source).removeClass(value);
    } catch (err) {
        console.log("RemoveClass: " + err.message);
    }
}
function CreateCanvas(width, height) {
    if (typeof width === "undefined")
        width = 100;
    if (typeof height === "undefined")
        height = 100;

    var canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    return canvas;
}

// EFFECTS
function Shake() {
    //$("#online").effect("shake", { times: 1, distance: 4 }, 1000);
}
function BreakConsole() {
    var id = "v" + Math.ceil(Math.random() * 4);
    $("body", window.top.document).append("<div id=\"shattered-console\" class=\"" + id + "\"></div>"); // "<div id='shader' style='height: " + w_height + "px; width: " + w_width + "px;'><div id='brokenconsole'></div></div>");
    var bc = setTimeout(function () {
        ClearBreakConsole();
    }, 30 * second);
    try {
        snd_break.Play();
    } catch (err) { console.log("BreakConsole:" + err.message); }
}
function ClearBreakConsole() {
    $("#shattered-console").fadeOut(1000);
    var bc = setTimeout(function () {
        $("#shattered-console").remove();
    }, 2 * second);
}
function StartupEffect(gap) {
    if (online) return;
    if (typeof gap === 'undefined') gap = 300;
    var delay = gap;
    var maxdelay = gap;
    if ($("#cell-left").length !== 0) {
        //Left
        $(".sus", "#cell-left").each(function (index) {
            var id = $(this).attr('id');
            if (typeof id !== "undefined") {
                setTimeout(function () {
                    //snd_activate.play();
                    $("#" + id).show();
                }, delay);
                delay += gap;
            }
        });
        maxdelay = delay;
        //Right
        delay = gap;
        $(".sus", "#cell-right").each(function (index) {
            var id = $(this).attr('id');
            if (typeof id !== "undefined") {
                setTimeout(function () {
                    //snd_activate.play();
                    $("#" + id).show();
                }, delay);
                delay += gap;
            }
        });
        if (delay > maxdelay) maxdelay = delay;
        maxdelay += gap;

        //Canvas Area
        setTimeout(function () {
            $(".sua").fadeIn(1000);
        }, maxdelay);
    } else {
        $(".sus").each(function (index) {
            var id = $(this).attr('id');
            if (typeof id !== "undefined") {
                setTimeout(function () {
                    //snd_activate.play();
                    $("#" + id).show();
                }, delay);
                delay = delay + gap;
            }
        });

        setTimeout(function () {
            $(".sua").fadeIn(1000);
        }, delay);
    }
}
function ShutdownEffect() {
    $(".sus").hide();
    $(".sua").hide();
}

// HELPER Functions
function toBoolean(value) {
    if (value.toLowerCase() === 'false') {
        return false;
    } else if (value.toLowerCase() === 'true') {
        return true;
    } else {
        return undefined;
    }
}
function toMetric(distance) {
    var m = true;
    if (distance >= 1000) { m = false; distance /= 1000; }
    //if (distance >= 1) {
    //    m = false;
    //} else {
    //    distance *= 1000;
    //}
    var str = "";

    if (distance > 10) {
        distance = parseInt(distance);
    } else {
        distance = distance.toFixed(2);
    }

    if (m) {
        str = distance + " m";
    } else {
        str = distance + " km"; //.toString("#,###,###,##0.00")
    }
    return str;
}
function NumberWithCommas(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function currentTime() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();

    var suffix = "AM";
    if (hours >= 12) {
        suffix = "PM";
        hours = hours - 12;
    }
    if (hours === 0) {
        hours = 12;
    }

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    return hours + ":" + minutes + " " + suffix;
}
function GetDistance(v1, v2) {
    var xs = 0;
    var ys = 0;
    var zs = 0;

    if (typeof v1 === "undefined")
        return 0;
    if (typeof v2 === "undefined")
        return 0;

    xs = v2.X - v1.X;
    xs = xs * xs;
    ys = v2.Y - v1.Y;
    ys = ys * ys;
    zs = v2.Z - v1.Z;
    zs = zs * zs;

    return Math.sqrt(xs + ys + zs) * scale;
}
function GetDistance2(x, y, x2, y2) {
    var xs = 0;
    var ys = 0;

    if (typeof x === "undefined")
        return 0;
    if (typeof y === "undefined")
        return 0;
    if (typeof x2 === "undefined")
        return 0;
    if (typeof y2 === "undefined")
        return 0;

    xs = x - x2;
    xs = xs * xs;
    ys = y - y2;
    ys = ys * ys;

    return Math.sqrt(xs + ys) * scale;

    //var base = Math.sqrt(xs + ys) * scale;
    //if (base > 10) base = parseInt(base);

    //return base;
}
function GetDistanceLY(v1, v2) {
    // Get Distance In Light Years
    var ly = GetDistance(v1, v2);
    var ld = 365 * ly;

    if (ly > 1) {
        // Light Years
        return ly.toFixed(2) + " LY";
    } else if (ld > 1) {
        // Light Days
        return ld.toFixed(2) + " LD";
    } else if (24 * ld > 1) {
        // Light Hours
        return (24 * ld).toFixed(2) + " LH";
    } else {
        // Light Minutes
        return (24 * ld / 60).toFixed(2) + " LM";
    }
}
function getOffset(v1, v2) {
    var rst = { X: 0, Y: 0, Z: 0 };
    try {
        if (typeof v1 === "undefined")
            return rst;
        if (typeof v2 === "undefined")
            return rst;

        rst.X = v2.X - v1.X;
        rst.Z = v2.Y - v1.Y;
        rst.Y = v2.Z - v1.Z;
    } catch (err) {
        rst.X = 0;
        rst.Z = 0;
        rst.Y = 0;
    }
    return rst;
}
function GetSystem(planet) {
    try {
        if (planet === "")
            return "";
        if (typeof planet === "undefined")
            return;
        if (typeof currentMap === "undefined")
            return;

        //for (var i in currentMap.Systems) {
        //    var ss = currentMap.Systems[i];

        //    for (var c in ss.Planets) {
        //        var ps = ss.Planets[c];

        //        if (ps.Name === planet)
        //            return ss.Name;
        //    }
        //}

        return "";

    } catch (err) {

    }
    return "";
}
function GetHeading(o) {
    //Heading from Pitch/Yaw/Roll
    if (typeof o === 'undefined') return "000+00";

    var hdg = 0;
    var p = 0;
    var p2 = 0;
    var mrk = "00";
    var sign = " - ";
    if (typeof o.Yaw !== "undefined") {
        hdg = pad(Math.abs(o.Yaw).toFixed(0), 3);
        p = o.Pitch;
    } else {
        hdg = pad(Math.abs(o.X).toFixed(0), 3);
        p = o.Y;
    }

    p2 = Math.abs(p).toFixed(0);
   //p2 = p2 % 90;

    if (p2 > 270) {
        // Pitch Down
        p2 = 90 - p2 % 270;
        sign = " - ";
    } else if (p2 > 180) {
        p2 = 90 - p2 % 180;
        sign = " - ";
    } else if (p2 > 90) {
        p2 = 90 - p2 % 90;
        sign = " + ";
    } else if (p2 > 0) {
        sign = " + ";
    } else {
        sign = " - ";
    }

    //if (p2 > 270) p2 = 360 - p2;
    //if (p2 > 90 && p2 < 180)
    //    p2 -= 90;
    //else if (p2 > 180 && p2 < 270)
    //    p2 += 90;

    mrk = pad(p2, 2);
    hdg = hdg + sign + mrk;
    //if (p > 180 && mrk != "00") {
    //    hdg = hdg + "-" + mrk;
    //} else {
    //    hdg = hdg + "+" + mrk;
    //}
    return hdg;
}
function GetBearing(p1, p2) {
    var o = { X: 0, Y: 0, Z: 0 };
    var sign = "+";

    if (typeof p1 === "undefined") return "000+00";
    if (typeof p2 === "undefined") return "000+00";

    o.X = p1.X - p2.X;
    o.Y = p1.Y - p2.Y;
    o.Z = p1.Z - p2.Z;
    alt = RadiansToDegreees(Math.atan2(o.Y, Math.sqrt(o.X * o.X + o.Z * o.Z))).toFixed(0);
    az = RadiansToDegreees(Math.atan2(-o.X, -o.Y)).toFixed(0);
    if (az < 0) az = 180 + Math.abs(az);
    if (az === 360) az = 0;

    if (alt < 0) sign = "-";

    return pad(az, 3) + sign + pad(Math.abs(alt), 2);
    
}
function GetBearingR(relative) {
    var sign = "+";
    var az = 0;
    var alt = 0;
    if (typeof relative === "undefined") return "000+00";

    if (relative.Z >= 0) az = 180;
    az += relative.X * 90;

    if (relative.Y < 0) sign = "-";
    
    return pad(az.toFixed(0), 3) + sign + pad(Math.abs(alt), 2);

}
function GetETA(dist, spd) {
    //Speed is distance per millisecond, so this * 1000 = distance per second
    var dps = speed * 1000;
    var meta = Math.ceil(dist / dps);
    var m = Math.floor(ts / 60);
    var s = meta - (m * 60);
    var eta = "";

    if (m > 0) {
        eta += m + " m, ";
    }
    eta += s + " s";

    if (m === Infinity) eta = "";
}
function CleanForID(str) {
    return str.replace(/[|&;$%@"#/<>()+,]/g, "");
}
function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}
function Degrees(num) {
    try {
        if (num > 360)
            return num % 360;
        else if (num < 0)
            return 360 + num;
        else
            return num;
    } catch (err) {
        console.log("Degrees: " + err.message);
    }
    return 0;
}
function RadiansToDegreees(value) {
    var pi = Math.PI;
    var ra_de = eval(value) * (180 / pi);
    return ra_de;
}
function DegreesToRadians(value) {
    var pi = Math.PI;
    var de_ra = eval(value) * (pi / 180);
    return de_ra;
}
function Clamp(number, min, max) {
    return Math.max(min, Math.min(max, number));
}
function InRect(x, y, x1, y1, x2, y2) {
    if (x > x1 && x < x2) {
        if (y > y1 && y < y2) return true;
    }
    return false;
}
function Intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var a1, a2, b1, b2, c1, c2;
    var r1, r2, r3, r4;
    var denom, offset, num;
    var x, y;

    // Compute a1, b1, c1, where line joining points 1 and 2
    // is "a1 x + b1 y + c1 = 0".
    a1 = y2 - y1;
    b1 = x1 - x2;
    c1 = (x2 * y1) - (x1 * y2);

    // Compute r3 and r4.
    r3 = (a1 * x3) + (b1 * y3) + c1;
    r4 = (a1 * x4) + (b1 * y4) + c1;

    // Check signs of r3 and r4. If both point 3 and point 4 lie on
    // same side of line 1, the line segments do not intersect.
    if (r3 !== 0 && r4 !== 0 && SameSign(r3, r4)) {
        return undefined; // DONT_INTERSECT;
    }

    // Compute a2, b2, c2
    a2 = y4 - y3;
    b2 = x3 - x4;
    c2 = (x4 * y3) - (x3 * y4);

    // Compute r1 and r2
    r1 = (a2 * x1) + (b2 * y1) + c2;
    r2 = (a2 * x2) + (b2 * y2) + c2;

    // Check signs of r1 and r2. If both point 1 and point 2 lie
    // on same side of second line segment, the line segments do
    // not intersect.
    if ((r1 !== 0) && (r2 !== 0) && (SameSign(r1, r2))) {
        return undefined; //DONT_INTERSECT;
    }

    //Line segments intersect: compute intersection point.
    denom = (a1 * b2) - (a2 * b1);

    if (denom === 0) {
        return undefined; //COLLINEAR;
    }

    if (denom < 0) {
        offset = -denom / 2;
    }
    else {
        offset = denom / 2;
    }

    // The denom/2 is to get rounding instead of truncating. It
    // is added or subtracted to the numerator, depending upon the
    // sign of the numerator.
    num = (b1 * c2) - (b2 * c1);
    if (num < 0) {
        x = (num - offset) / denom;
    }
    else {
        x = (num + offset) / denom;
    }

    num = (a2 * c1) - (a1 * c2);
    if (num < 0) {
        y = (num - offset) / denom;
    }
    else {
        y = (num + offset) / denom;
    }

    // lines_intersect
    return { x: x, y: y };
}
function SameSign(a, b) {
    return a * b >= 0;
}
function GetNextID(collection) {
    try {
        var top = 0;

        for (var c in collection) {
            var cr = collection[c];

            if (cr.ID > top)
                top = cr.ID
        }

        top++;

    } catch (err) {

    }
    return 1;
}
function NewGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// COLOR
function ColorToCssString(color) {
    try {
        return "rgb(" + color.R + "," + color.G + "," + color.B + ")";
    } catch (err) {
        console.log("ColorToCssString: " + err.message);
    }
}
function componentToHex(c) {
    var hex = Number(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}
function RgbToHex(color) {
    try {
        return "#" + componentToHex(color.R) + componentToHex(color.G) + componentToHex(color.B);
    } catch (err) {
        console.log("RgbToHex: " + err.message);
    }
    return "#000000";
}
function RgbToHex2(r, g, b) {
    try {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    } catch (err) {
        console.log("RgbToHex: " + err.message);
    }
    return "#000000";
}
function HexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        R: parseInt(result[1], 16),
        G: parseInt(result[2], 16),
        B: parseInt(result[3], 16)
    } : null;
}
function RGBtoHSL(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
}
function randomColor2() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}
function randomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

// PEDIA

function FormatPediaText(source, addlinks) {
    if (typeof addlinks === "undefined")
        addlinks = true;

    if (addlinks)
        return source.replace(/\[\[(.*?)]]/gm, "<span class='pedia-link' onclick=\"ViewEntry('$1')\">$1</span>");
    else
        return source.replace(/\[\[(.*?)]]/gm, "$1");
}

// 3D
function Vector3Lerp(start, end, amt) {
    var final = { X: 0, Y: 0, Z: 0 };

    if (typeof start === "undefined" && typeof end === "undefined")
        return final;
    else if (typeof start === "undefined")
        start = end;
    else if (typeof end === "undefined")
        end = start;

    try {
        final.X = Lerp(start.X, end.X, amt);
        final.Y = Lerp(start.Y, end.Y, amt);
        final.Z = Lerp(start.Z, end.Z, amt);
    } catch (err) {
        console.log("Vector3Lerp: " + err.message);
    }

    return final;
}
function Vector3Length(source) {
    return source.X + source.Y + source.Z;
}
function Vector3Add(v1, v2) {
    return { "X": v1.X + v2.X, "Y": v1.Y + v2.Y, "Z": v1.Z + v2.Z };
}
function Vector3Subtract(v1, v2) {
    return { "X": v1.X - v2.X, "Y": v1.Y - v2.Y, "Z": v1.Z - v2.Z };
}
function Vector3Divide(v, scalar) {
    return { "X": v.X / scalar, "Y": v.Y / scalar, "Z": v.Z / scalar };
}
function Vector3Magnitude(v) {
    return Math.sqrt(v.X * v.X + v.Y * v.Y + v.Z * v.Z);
}
function Vector3Normalize(v) {
    return Vector3Divide(v, Vector3Magnitude(v));
}
function AngleBetweenVectors(v1, v2) {
    try {
        // Radians
        //return Math.atan2(v2.Y - v1.Y, v2.X - v1.X);
        // Degrees
        return Math.atan2(v2.Y - v1.Y, v2.X - v1.X) * 180 / Math.PI;
    } catch (err) {

    }
    return 0;
}
function RelativePosition(v1, v2, dir) {
    try {
        if (typeof dir === "undefined")
            dir = "Forward";

        v1 = Vector3Normalize(Vector3Subtract(v1, v2));
        //v1 = Vector3Normalize(v1);

        var forward = { "X": 0, "Y": 0, "Z": -1 };
        var left = { "X": -1, "Y": 0, "Z": 0 };
        var top = { "X": 0, "Y": -1, "Z": 0 };

        return { "X": (v1.X * left.X), "Y": (v1.Y * top.Y), "Z": (v1.Z * forward.Z) };

    } catch (err) {

    }
    return 0;
}
function Lerp(start, end, amt) {
    if (typeof amt === "undefined")
        amt = 1;
    
    return (1 - amt) * start + amt * end;
}
function Vector3ToString(src) {
    return src.X + ", " + src.Y + ", " + src.Z;
 }
function Vector3FromString(src) {
    try {
        var v3 = { X: 0, Y: 0, Z: 0 };

        var values = src.split(',');

        if (values.length = 3) {
            v3.X = parseFloat(values[0].trim());
            v3.Y = parseFloat(values[1].trim());
            v3.Z = parseFloat(values[2].trim());
        }

        return v3;
    } catch (err) {
        return { "X": 0, "Y": 0, "Z": 0 };
    }
}
function UpdateObjectMovement(source, step) {
    if (typeof source === "undefined")
        return;

    try {
        if (typeof step === "undefined")
            step = 0.04;

        // Position
        if (typeof source.NextPosition === "undefined")
            source.NextPosition = source.Position;
        if (typeof source.NextOrientation === "undefined")
            source.NextOrientation = source.Orientation;
        if (typeof source.Position === "undefined")
            source.Position = source.NextPosition;
        if (typeof source.Orientation === "undefined")
            source.Orientation = source.NextOrientation;

        // Don't Lerp, Just Go
        if (math.abs(Vector3Length(source.Position) - Vector3Length(source.NextPosition)) > 10000) {
            source.Position = source.NextPosition;
        } else {
            source.Position = Vector3Lerp(source.Position, source.NextPosition, step);
        }

        // Orientation
        if (source.Orientation.X < 25 && source.NextOrientation.X > 300) {
            // They Are Crossing 0 INTO The 360 Range
            source.Orientation.X += 360;
        } else if (source.Orientation.X > 300 && source.NextOrientation.X < 25) {
            // They Are Crossing 0 FROM The 360 Range
            source.Orientation.X -= 360;
        }

        // Don't Lerp, Just Go
        if (math.abs(source.Orientation.X - source.NextOrientation.X > 90)) {
            source.Orientation = source.NextOrientation;
        } else {
            source.Orientation = Vector3Lerp(source.Orientation, source.NextOrientation, step);
        }

        // Relative
        if (typeof source.NextRelative !== "undefined") {
            source.Relative = Vector3Lerp(source.Relative, source.NextRelative, step);
        }
        
        // Star Position?
        if (typeof source.NextStarPosition !== "undefined") 
            source.StarPosition = Vector3Lerp(source.StarPosition, source.NextStarPosition, step);

        // Galactic Position?
        if (typeof source.NextGalacticPosition !== "undefined") 
            source.GalacticPosition = Vector3Lerp(source.GalacticPosition, source.NextGalacticPosition, step);
        
    } catch (err) {
        console.log("UpdateObjectMovement: " + err.message);
    }
}

function Normalize(point, scale) {
    if (typeof scale === 'undefined') scale = 1;
    var norm = Math.sqrt(point.X * point.X + point.Y * point.Y + point.Z * point.Z);
    if (norm !== 0) { // as3 return 0,0 for a point of zero length
        point.X = scale * point.X / norm;
        point.Y = scale * point.Y / norm;
        point.Z = scale * point.Z / norm;
    }
    return point;
}
function Normalize2P(point1, point2, scale) {
    if (typeof scale === 'undefined') scale = 1;
    var norm = Math.sqrt(point1.x * point2.x + point1.y * point2.y);
    if (norm !== 0) { // as3 return 0,0 for a point of zero length
        point1.x = scale * point1.x / norm;
        point1.y = scale * point1.y / norm;
    }
    return { x: point1.x, y: point1.y };
}
function UpperFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function ScrollToBottom(source) {
    if ($(source).is(":visible")) {
        var d = $(source);
        d.scrollTop(d.prop("scrollHeight"));
    }
}

// SPEECH
function CaptureSpeech() {
    // get output div reference
    //var output = result; //document.getElementById(ouput);
    //var action = document.getElementById(status);
    // new speech recognition object
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var recognition = new SpeechRecognition();

    // This runs when the speech recognition service starts
    recognition.onstart = function () {
        $(document).trigger("onSpeechRecognitionState", { Status: "Listening", Text: "", Confidence: 0 });
        //SetHtml(status, "Listening, Please Speak...");
    };

    recognition.onspeechend = function () {
        $(document).trigger("onSpeechRecognitionState", { Status: "Stopped", Text: "", Confidence: 0 });
        //SetHtml(status, "");
        recognition.stop();
    }

    // This runs when the speech recognition service returns result
    recognition.onresult = function (event) {
        var transcript = event.results[0][0].transcript;
        var confidence = event.results[0][0].confidence;
        $(document).trigger("onSpeechRecognitionState", { Status: "Result", Text: transcript, Confidence: confidence });
        //SetValue(output, transcript);
        //$("#search").focus();
        //output.innerHTML = "<b>Text:</b> " + transcript + "<br/> <b>Confidence:</b> " + confidence * 100 + "%";
        //output.classList.remove("hide");
    };

    // start recognition
    recognition.start();
}

// BROWSER Functions
navigator.WhoAmI = (function () {
    var ua = navigator.userAgent, tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem !== null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) !== null) M.splice(1, 1, tem[1]);
    return M.join(' ');
})();

// PROTOTYPE Additions
Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}

String.prototype.EscapeSpecialChars = function () {
    return this.replace(/\\n/g, "\\n")
        .replace(/\\r/g, "\\r")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");
};

String.prototype.SwapNewLines = function () {
    return this.replace(/\n/g, "<br />");
};
function replaceAll(str, find, replace) {
    try {
        return str.toString().replace(new RegExp(escapeRegExp(find), 'g'), replace);
    } catch (err) {
    
    }
}

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function () {
        return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function ( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            window.setTimeout(callback, 1000 / 60);
		};
    })();
}

// CONTROLS
function Yaw(v) { SendCMD('VOY', v); }
function Pitch(v) { SendCMD('VOP', v); }
function Roll(v) { SendCMD('VOR', v); }
function Speed(v) { SendCMD('VVF', v); }

// SOUND 
//====================================================================================

function MusicQue(source, vol) {
    if (typeof source === "undefined") return;
    if (typeof vol === "undefined") vol = .5;
    this.source = source;

    // Initalize The Sound
    var volume = vol;
    var snd = new Audio(source);
    var ducking = false;
    snd.loop = true;
    snd.volume = vol;
    snd.load();

    this.SetVolume = function (newVolume) {
        try {
            volume = newVolume;
            snd.volume = vol;
        } catch (err) {
            console.log("MusicQue.SetVolume: " + err.message);
        }
    };

    this.Play = function () {
        if (!soundEnabled) return;
        try {
            var isPlaying = snd.currentTime > 0 && !snd.paused && !snd.ended && snd.readyState > 2;

            if (!isPlaying) {
                snd.volume = volume;
                snd.play();
            }
        } catch (err) {
            console.log("MusicQue.Play: " + err.message);
        }
    };

    this.Pause = function () {
        try {
            if (!snd.ended) {
                snd.pause();
                //snd.currentTime = 0;
            }
        } catch (err) {
            console.log("MusicQue.Pause: " + err.message);
        }
    };

    this.Stop = function () {
        try {
            if (!snd.ended) {
                snd.pause();
                snd.currentTime = 0;
            }
        } catch (err) {
            console.log("MusicQue.Stop: " + err.message);
        }
    };

    this.Duck = function (duck, vol) {
        try {
            if (typeof duck === "undefined") duck = false;
            if (typeof vol === "undefined") vol = .5;

            if (!snd.ended) {
                if (duck) {
                    ducking = true;
                    snd.volume = volume * vol;  // Cut The Current Volume By The Ducking Level
                } else {
                    ducking = false;
                    snd.volume = volume;
                }
            }
        } catch (err) {
            console.log("MusicQue.Duck: " + err.message);
        }
    }

}
function SoundQue(source, vol, max, loop) {
    if (typeof source === "undefined") return;
    if (typeof vol === "undefined") vol = .5; //.5;
    if (typeof max === "undefined") max = 4;
    if (typeof loop === "undefined") loop = false;

    var volume = vol;
    var size = max; // Max sounds allowed in the pool
    this.source = source;
    var pool = [];
    this.pool = pool;
    var current = 0;
    var playbackRate = 1;

    if (volume > 1)
        volume = volume * .01;

    if (loop)
        size = 1;

    for (var i = 0; i < size; i++) {
        // Initalize The Sound And Load
        try {
            snd = new Audio(source);
            snd.onended = function () { SoundClipComplete(); };
            snd.volume = volume;
            snd.loop = loop;
            snd.load();

            snd.addEventListener("ended", function () {
                snd.currentTime = 0;

                // Music Ducking?
                //MusicDucking(false);
            });

            pool[i] = snd;
        } catch (err) {
            console.log("SoundQue: " + err.message);
        }
    }

    this.SetVolume = function (newVolume) {
        try {
            if (newVolume > 1)
                newVolume = newVolume * .01;

            if (volume !== newVolume) {
                volume = newVolume;
                for (var i = 0; i < size; i++) {
                    pool[i].volume = volume;
                }
            }
        } catch (err) {
            console.log("SoundQue.Stop: " + err.message);
        }
    };

    this.Rate = function (rate) {
        try {
            playbackRate = rate;
        } catch (err) {
            console.log("SoundQue.Rate: " + err.message);
        }
    };

    this.Play = function () {
        if (!soundEnabled) return;
        try {
            var isPlaying = pool[current].currentTime > 0 && !pool[current].paused && !pool[current].ended && pool[current].readyState > 2;

            if (!isPlaying) {
                pool[current].volume = volume;
                pool[current].playbackRate = playbackRate;
                pool[current].play();

                //MusicDucking(true);

            }
            current = (current + 1) % size;
        } catch (err) {
            console.log("SoundQue.Play: " + err.message);
        }
    };

    this.Pause = function () {
        try {
            for (var i = 0; i < size; i++) {
                if (!pool[i].ended) {
                    pool[i].pause();
                    //MusicDucking(false);
                }
            }
        } catch (err) {
            console.log("SoundQue.Pause: " + err.message);
        }
    };

    this.Stop = function () {
        try {
            for (var i = 0; i < size; i++) {
                if (!pool[i].ended) {
                    pool[i].pause();
                    pool[i].currentTime = 0;
                    //MusicDucking(false);
                }
            }
        } catch (err) {
            console.log("SoundQue.Stop: " + err.message);
        }
    };

}
function PlayClickSound() {
    try {
        snd_click.Play();
    } catch (err) {
        console.log("PlayClickSound: " + err);
    }
}
function PlayDisabledSound() {
    try {
        snd_disabled.Play();
    } catch (err) {
        console.log("PlayDisabledSound: " + err);
    }
}
function SoundClipComplete() { }

// Click / Touch Loction(s)
//====================================================================================

function GetEventCoords(source, e) {
    try {
        return (e.type === "touchstart" || e.type === "touchmove" || e.type === "touchend") ? GetTouchCoords(source, e) : GetClickCoords(source, e);
    } catch (err) {
        return {x: 0, y: 0};
    }
}
function GetClickCoords(source, e) {
    if (w_scale >= 1) {
        return { x: (e.pageX) - Math.ceil(source.offset().left), y: (e.pageY) - Math.ceil(source.offset().top) };
    } else {
        return { x: (e.pageX * w_scaleoffset) - Math.ceil(source.offset().left), y: (e.pageY * w_scaleoffset) - Math.ceil(source.offset().top) };
    }
}
function GetTouchCoords(source, e) {
    var touch = e.changedTouches[0];
    //alert(touch.pageX);
    if (w_scale >= 1) {
        return { x: touch.pageX - Math.ceil(source.offset().left), y: touch.pageY - Math.ceil(source.offset().top) };
    } else {
        return { x: (touch.pageX * w_scaleoffset) - Math.ceil(source.offset().left), y: (touch.pageY * w_scaleoffset) - Math.ceil(source.offset().top) };
    }
}

// CANVAS HELPERS
//====================================================================================

var TO_RADIANS = Math.PI / 180;
function DrawRotatedImage(context, image, x, y, angle) {

    // save the current co-ordinate system 
    // before we screw with it
    context.save();

    // move to the middle of where we want to draw our image
    context.translate(x, y);

    // rotate around that point, converting our 
    // angle from degrees to radians 
    context.rotate(angle * TO_RADIANS);

    // draw it up and to the left by half the width
    // and height of the image 
    context.drawImage(image, -(image.width / 2), -(image.height / 2));

    // and restore the co-ords to how they were when we began
    context.restore();

}
function DrawCircle(context, x, y, size, color, strokesize, strokecolor) {
    context.beginPath();
    context.arc(x, y, size, 0, fullCircle, true);

    if (typeof strokesize !== "undefined") {
        context.lineWidth = strokesize;
        context.strokeStyle = strokecolor;
        context.stroke();
    }

    context.fillStyle = color;
    context.fill();
    context.closePath();
}
function DrawLine(context, x, y, x2, y2, size, color) {
    try {
        context.lineWidth = size;
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x2, y2);
        context.stroke();
        context.closePath();
    } catch (err) {

    }
}
jQuery.fn.rotate = function (degrees) {
    $(this).css({ 'transform': 'rotate(' + degrees + 'deg)' });
    return $(this);
};

// Look Up Functions
//====================================================================================

function SetFocusedObject (o) {
    try {
        focusedObject = o;
        UpdateFocusedObject(focusedObject);
        //if (typeof focusedObject !== "undefined") {
        //    if (currentPlanet != focusedObject.Planet) {
        //        currentPlanet = focusedObject.Planet;
        //        SendCMD("PSD", currentPlanet);
        //    }
        //}

    } catch (err) {

    }
}

function UpdateFocusedObject (source) {
    try {
        if (typeof focusedObject !== "undefined") {
            if (currentPlanet != focusedObject.Planet) {
                currentPlanet = focusedObject.Planet;
                GetPlanetDetail(currentPlanet);
            }
            //focusedObject.NextPosition = source.NextPosition;
            //focusedObject.NextOrientation = source.NextOrientation;
            //UpdateObjectMovement(focusedObject);
        }
    } catch (err) {

    }
}

function GetWeaponByHardpoint(hardpoint) {
    try {
        for (var wi in weaponData) {
            if (weaponData[wi].Name === hardpoint) {
                return weaponData[wi];
            }
        }
    } catch (err) {
        console.log("GetWeaponByHardpoint: " + err.message);
    }
    return null;
}

// UI HELPERS
//====================================================================================
jQuery.fn.ResourceFileList = function (moduleID, allowNone) {
    var $this = $(this);
    var id = $this.attr("id");
    var mid = moduleID;
    var filter = $this.data("filter");

    if (typeof allowNone === "undefined")
        allowNone = false;

    $this.data("allownone", allowNone);

    // Set Up Div With Correct Objects
    var ihtml = "<div class='data-m'><div class='file-option refresh-list icon refresh' title='Refresh' onclick='GetUserFiles()'>&nbsp;</div></div>";
    //ihtml += "<div class='data-m'><div class='file-option addfile' title='Add File' onclick=\"ShowFileUpload('" + filter + "', '#" + id + "')\">...</div></div>";
    ihtml += "<div class='data-m'><div class='file-option addfile' title='Add File' onclick=\"ShowFileUpload('', '#" + id + "')\">...</div></div>";
    $this.parent().parent().append(ihtml);

    $(document).on("onUserFiles", function () {
        SetFileList("#" + id, filter);
    });

};

jQuery.fn.HtmlMediaList = function (moduleID, allowNone) {
    var $this = $(this);
    var id = $this.attr("id");
    var mid = moduleID;
    var filter = $this.data("filter");

    if (typeof allowNone === "undefined")
        allowNone = false;

    $this.data("allownone", allowNone);

    // Set Up Div With Correct Objects
    var ihtml = "<div class='data-m'><div class='file-option refresh-list icon refresh' title='Refresh' onclick='GetHtmlMedia()'>&nbsp;</div></div>";
    //ihtml += "<div class='data-m'><div class='file-option addfile' title='Add File' onclick=\"ShowFileUpload('', '#" + id + "')\">...</div></div>";
    $this.parent().parent().append(ihtml);

    $(document).on("onHtmlMedia", function () {
        SetHtmlMediaList("#" + id, filter);
    });

};

jQuery.fn.ColorPicker = function (source) {
    var id = "";
    var $this = $(this);
    var bCanPreview = true; // can preview
    var eid = $this.attr('id');
    var pname = "color-preview-" + eid;
    var name = "color-picker-" + eid;
    var wheel = name + "-wheel";

    if (typeof source === "undefined")
        source = "";

    $this.hide();
    $this.parent().css("position", "relative");
    $this.parent().append("<div id='" + pname + "' class='color-preview' style='background-color:" + $this.val() + "'></div>");
    $this.parent().append("<div id='" + name + "' class='color-picker hidden'><canvas id='" + wheel + "' width='240' height='150'></canvas></div>");

    // create canvas and context objects
    var canvas = document.getElementById(wheel);
    var ctx = canvas.getContext('2d');
    // drawing active image
    var image = new Image();

    image.onload = function () {
        ctx.drawImage(image, 0, 0, image.width, image.height); // draw the image on the canvas
    };
    if (source !== "")
        image.src = source;
    else
        image.src = 'images/color-range.png';

    $this.on("change input", function (e) {
        $("#" + pname).css('background-color', $this.val());
    });
    $('#' + wheel).mousemove(function (e) { // mouse move handler
        //if (bCanPreview)
        //    SetColor(e);
    });
    $('#' + wheel).click(function (e) { // click event handler
        bCanPreview = !bCanPreview;
        SetColor(e);
        Hide();
    });
    $('#' + wheel).on("mouseout", function (event) {
        Hide();
    });
    $("#" + pname).click(function (e) { // preview click
        var offset = $(e.currentTarget).position();
        var left = 0; //offset.left;
        var top = offset.top + $this.height() + 4;
        $('#' + name).css("top", top + "px");
        $('#' + name).css("left", left + "px");
        ToggleWheel();
        bCanPreview = true;
    });
    function ToggleWheel() {
        $('#' + name).fadeToggle("fast", "linear");
    }
    function Hide() {
        if ($('#' + name).is(":visible"))
            $('#' + name).fadeOut("fast", "linear");
    }
    function SetColor(e) {
        // get coordinates of current position
        var canvasOffset = $(canvas).offset();
        var canvasX = Math.floor(e.pageX - canvasOffset.left);
        var canvasY = Math.floor(e.pageY - canvasOffset.top);
        // get current pixel
        var imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
        var pixel = imageData.data;
        // update preview color
        //var pixelColor = "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
        var dColor = pixel[2] + 256 * pixel[1] + 65536 * pixel[0];
        var hex = "#" + ('0000' + dColor.toString(16)).substr(-6);
        // update controls
        //$('#rVal').val(pixel[0]);
        //$('#gVal').val(pixel[1]);
        //$('#bVal').val(pixel[2]);
        $("#" + pname).data("hexvalue", hex);
        $("#" + pname).css('background-color', hex);
        $this.val(hex);

        if (typeof OnColorChange === "function") {
            // safe to use the function
            OnColorChange(id, hex);
        }
    }
};

// WIDGETS
//====================================================================================

// Radar Canvas (Local/System/Galactic)
jQuery.fn.Radar = function (options) {
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d");

    var rendering = false;
    var hidden = false;
    var onFocus = false;
    var newFocus = false;

    if (typeof options === "undefined")
        options = {};

    // Packet Types
    AddPacketType("BLAST");

    // Mode
    var baseMode = typeof options.Mode !== "undefined" ? options.Mode : 1; // 1= Local, 2= System, 3= Galactic
    var mode = baseMode; // 1= Local, 2= System, 3= Galactic
    var userMode = mode;
    var previousMode = mode;
    var playerLock = false;

    // Zoom
    var globalzoom = 10;
    var zoom = 10;                      // Actual Zoom Level Used For Display
    var zoomUserLocal = 10;             // User Zoom Levels
    var zoomUserSystem = 1;
    var zoomUserGalactic = 10;
    var zoomToLocal = 10;   // 41-60
    var zoomToSystem = 10;  // 21-40
    var zoomToGlobal = 10;   // 1-20  
    var lastzoom = 0;
    var maxzoom = 8;

    var center = { x: 0, y: 0 };
    var gridoffset = { x: 0, y: 0 };

    var showtext = true;
    var lastmaneuver = "Cruise";

    // Options
    var consoleTarget = typeof options.Console !== "undefined" ? options.Console : "";
    var showCompass = typeof options.Compass !== "undefined" ? options.Compass : true;
    var weaponArcs = typeof options.WeaponArcs !== "undefined" ? options.WeaponArcs : false;
    var lockMode = typeof options.LockMode !== "undefined" ? options.LockMode : 0;
    var scanningMode = typeof options.ScanningMode !== "undefined" ? options.ScanningMode : false;
    var T3dView = typeof options.View3D !== "undefined" ? options.View3D : false;

    // Selections
    var selectedLocal = -1;
    var selectedSystem = "";
    var selectedLocation = "";

    // UI
    var zoomLevelID = "#radar-zoom-level";

    // Scale
    var localscale = .01;
    var localgridscale = .01;

    // Background
    $this.css("background-image", "url('/images/nebula.png')");

    // Load Images
    //var bg = new Image();
    //bg.src = "images/grid1.jpg";
    //var stars = new Image();
    //stars.src = "images/stars.jpg";

    // Local
    var rvp = new Image();
    rvp.src = "images/rdr_vessel.png";
    var rm = new Image();
    rm.src = "images/radar_missile.png";
    var ft = new Image();
    ft.src = "images/lock-flight.png";
    var tt = new Image();
    tt.src = "images/lock-target.png";
    var st = new Image();
    st.src = "images/lock-science.png";
    var gt = new Image();
    gt.src = "images/lock-gm.png";
    var rp = new Image();
    rp.src = "images/planet.png";
    var rcl = new Image();
    rcl.src = "images/cluster-r.png";
    // Compass
    var cmp;
    var cmpa;
    if (showCompass) {
        cmp = new Image();
        cmp.src = "images/compass.png";
        cmpa = new Image();
        cmpa.src = "images/compass-arrow.png";
    }
    
    var icons = new Image();
    icons.src = "images/item-icons.png";

    // Galactic Variables
    var mousedown = false;
    var mousestart;
    var dragnatural = true;
    var dragging = false;
    var dragged = 0;
    var viewcenter = { X: 0, Y: 0, Z: 0 };
    var lastPosition = { X: 0, Y: 0, Z: 0 };

    var reticle = new Image();
    var reticleRotation = 0;
    var lastRotationUpdate = Date.now();
    reticle.src = "/images/reticle.png";
    var star = new Image();
    star.src = "/images/star-g-m.png";
    // End Galactic

    // Scanning Variables
    var snd_ping;
    var scanningPing = 5;
    var lastPing = new Date();

    // System Variables
    var energy = new Image();
    var starclass = "g";
    var starol = new Image();
    var siText = "";
    var giText = "";
    var lastSystem;
    energy.src = "/images/energy.png";

    $this.on("mousemove", function (e) {

        switch (mode) {
            case 1:
                if (typeof gridPosition !== "undefined") {
                    var mc = GetEventCoords($this, e);
                    gridPosition.x = parseInt(viewcenter.x + (((mc.x - center.x) / localscale) / zoom));
                    gridPosition.y = parseInt(viewcenter.y + (((mc.y - center.y) / localscale) / zoom));
                }
                break;
            case 2:
                if (typeof gridPosition !== "undefined") {
                    var mc = GetEventCoords($this, e);
                    gridPosition.x = parseInt(viewcenter.X + (((mc.x - center.x) / localscale) / zoom));
                    gridPosition.y = parseInt(viewcenter.Y + (((mc.y - center.y) / localscale) / zoom));
                }
                break;
            case 3:
                if (typeof gridPosition !== "undefined") {
                    var mc = GetEventCoords($this, e);

                    gridPosition.x = parseInt(viewcenter.X + (mc.x - center.x) / zoom);
                    gridPosition.y = parseInt(viewcenter.Y + (mc.y - center.y) / zoom);
                }
                break;
        }

    });

    $this.on("mousedown", function (e) {

        switch (mode) {
            case 1:
                CheckLocalSelection(e);
                break;
            case 2:
                CheckSystemSelection(e);
                break;
            case 3:
                CheckGalacticSelection(e);
                break;
        }

    });

    $(document).on("onResize", function (event) {
        ResetSize();
    });

    $(document).on("mousedown", ".map-mode", function (event) {
        userMode = $(this).data("mode")
        SetMode(userMode);
    });

    $(document).on("onReset", function () {

        mode = baseMode;

        globalzoom = 10;
        zoomUserLocal = 10;
        zoomUserSystem = 1;
        zoomUserGalactic = 10;

        SetZoom();
    });

    $(document).on("onMapMode", function (e, mode) {
        SetMode(mode);
    });

    $(document).on("onMapZoom", function (e, zoom) {
        SetZoom(zoom);
    });

    $(document).on("onResize", function (e) {
        ResetSize();
    });

    $(document).on("onFocus", function () {
        newFocus = true;
    });

    $(zoomLevelID).on("input", function (e) {
        var z = parseFloat($("#radar-zoom-level").val());

        switch (mode) {
            case 1:
                zoomUserLocal = z;
                break;
            case 2:
                zoomUserSystem = z;
                break;
            case 3:
                zoomUserGalactic = z;
                break;
        }

        globalzoom = z;

        //console.log("Zoom: " + globalzoom);

        SetZoom();

        $("#radar-zoom-label").text(zoom + " : " + globalzoom);
    });

    $(document).on("onTargetInfo", function (e, id) {
        if (consoleTarget === "Tactical" && selectedid !== id) {
            selectedid = id;
        }
    });

    $(document).on("onFlightTargetInfo", function (e, id) {
        if (consoleTarget === "Flight" && selectedid !== id) {
            selectedid = id;
        }
    });

    $(document).on("onScienceTargetInfo", function (e, id) {
        if (consoleTarget === "Science" && selectedid !== id) {
            selectedid = id;
        }
    });

    Initialize();
    SetZoom();
    ResetSize();
    Render(); 

    function Initialize() {

        // Lock Mode?
        mode = lockMode;
        switch (lockMode) {
            case 1:
                // Local
                userMode = mode;
                //$(zoomLevelID).attr("min", 41);
                //$(zoomLevelID).attr("max", 60);
                $(zoomLevelID).val(zoomToLocal);
                break;
            case 2:
                // System
                userMode = mode;
                //$(zoomLevelID).attr("min", 21);
                //$(zoomLevelID).attr("max", 40);
                $(zoomLevelID).val(zoomToSystem);
                break;
            case 3:
                // Galactic
                userMode = mode;
                //$(zoomLevelID).attr("min", 3);
                //$(zoomLevelID).attr("max", 20);
                $(zoomLevelID).val(zoomToGlobal);
                break;
            default:
                //$(zoomLevelID).attr("min", 3);
                //$(zoomLevelID).attr("max", 60);
                SetMode(1);
                $(zoomLevelID).val(zoomToLocal);
                break;
        }

        SetMode(mode);

        if (scanningMode) {
            snd_ping = new SoundQue("/sound/ping.mp3");
        }
    }

    function SetMode(newMode) {
        mode = newMode;

        switch (mode) {
            case 1:
                globalzoom = zoomUserLocal;
                break;
            case 2:
                globalzoom = zoomUserSystem;
                break;
            case 3:
                globalzoom = zoomUserGalactic;
                break;
        }

        $(".map-mode-1").removeClass("selected");
        $(".map-mode-2").removeClass("selected");
        $(".map-mode-3").removeClass("selected");
        $(".map-mode-" + mode).addClass("selected");

        $(document).trigger("onMapModeSet", mode);

        SetZoom();
    }

    function SetZoom(newZoom) {
        if (typeof newZoom !== "undefined") {
            globalzoom = newZoom;
        }

        switch (mode) {
            case 1:
                // Local
                zoom = globalzoom * .06;
                break;
            case 2:
                // System
                zoom = globalzoom; // * (globalzoom * .1);
                break;
            case 3:
                // Galactic
                if (globalzoom < 3)
                    globalzoom = 3;
                zoom = globalzoom;
                break;
        }

        CloseInfo();

        $("#radar-zoom-level").val(globalzoom);

    }

    function Render() {
        try {
            if (rendering)
                return;

            //console.log("Rendering Radar");

            if (pageHidden || !$this.is(':visible')) {
                hidden = true;
                //return;
            } else if (hidden || newFocus) {
                hidden = false;
                newFocus = false;
                onFocus = true;
            } else if (onFocus) {
                onFocus = false;
            }

            rendering = true;

            previousMode = mode;

            if (typeof thisvessel !== "undefined") {
                UpdateObjectMovement(thisvessel, (onFocus) ? 1 : undefined);

                if (lockMode) {
                    
                } else if (thisvessel.Maneuver === "FTL") {
                    if (galacticinfo.System !== "") {
                        globalzoom = zoomToSystem;
                        SetMode(2);
                    } else {
                        globalzoom = zoomToGlobal;
                        SetMode(3);
                    }

                    SetZoom();
                } else if (mode !== userMode) {
                    //globalzoom = zoomUser;
                    SetMode(userMode);
                    SetZoom();
                }
            }

            if (!hidden) {
                switch (mode) {
                    case 2:
                        // System
                        RenderSystem();
                        break;
                    case 3:
                        // Galactic
                        RenderGalatic();
                        break;
                    default:
                        // Local
                        RenderLocal();
                        break;
                }

                if (onFocus)
                    onFocus = false;
            }

        } catch (err) {
            console.log("Radar.Render: " + err.message);
        }

        rendering = false;

        requestAnimationFrame(Render);

    }

    // Global Map Functions

    function DrawVessel(ts, tl) {
        try {
            var yaw = DegreesToRadians(thisvessel.Orientation.X);

            //ct.translate(center.x, center.y);
            //if (!rotated)
            ct.rotate(yaw);

            if (ts < 12) ts = 12;
            ct.drawImage(rvp, tl, tl, ts, ts);

            ct.rotate(-yaw);

        } catch (err) {
            console.log("Radar.DrawVessel: " + err.message);
        }
    }

    // Outline

    function DrawFrame() {
        var sh = 40;
        var cw = 300;
        var aw = 40;
        var mw = ct.canvas.width - ((sh + aw) * 2);
        var mh = ct.canvas.height - sh;

        ct.translate(0, 0);
        //ct.moveTo(0, sh);

        ct.fillStyle = 'rgba(0, 0, 0, 0)';
        ct.strokeStyle = '#0000ee';
        ct.lineWidth = 1;
        ct.beginPath();
        // Top
        ct.lineTo(cw, sh);
        ct.lineTo(cw + aw, 0);
        ct.lineTo(ct.canvas.width - cw - aw, 0);
        ct.lineTo(ct.canvas.width - cw, sh);
        ct.lineTo(ct.canvas.width, sh);
        // Right Side
        ct.lineTo(ct.canvas.width, mh);
        // Bottom
        ct.lineTo(ct.canvas.width - cw, mh);
        ct.lineTo(ct.canvas.width - cw - sh, ct.canvas.height);
        ct.lineTo(cw + sh, ct.canvas.height);
        ct.lineTo(cw, mh);
        ct.lineTo(0, mh);
        // Left Side
        ct.lineTo(0, sh);
        ct.closePath();
        //ct.fill();
        ct.stroke();
    }

    // Local Map Function

    function ResetSize() {
        ct.canvas.width = $this.width();
        ct.canvas.height = $this.height();
    }

    function RenderLocal() {
        try {
            if (typeof thisvessel === "undefined") return;
            if (typeof contacts === "undefined") return;
            //if (!$this.is(':visible')) return;

            if (lastzoom !== zoom) {
                if (zoom > maxzoom)
                    zoom = maxzoom;
                lastzoom = zoom;
            }

            viewcenter.x = thisvessel.Position.X;
            viewcenter.y = thisvessel.Position.Y;

            ResetSize();
            ct.clearRect(0, 0, ct.canvas.width, ct.canvas.height);

            center.x = parseInt(ct.canvas.width / 2);
            center.y = parseInt(ct.canvas.height / 2);

            ct.font = "9px sans-serif";
            ct.fillStyle = "#aaffaa";
            ct.lineStyle = "#ffff00";
            ct.setTransform(1, 0, 0, 1, center.x, center.y);
            var storedTransform = ct.getTransform();
            ct.save();

            // Offset
            var insize = 10000;
            //var scaleX = (spacialData.X % insize) / insize;
            //var scaleY = (spacialData.Y % insize) / insize;
            //var rot = 0;
            //var showtext = true;

            // Icon Sizing
            var ts = 30; // * radarZoom;
            if (ts < 12) ts = 12;
            var tl = -(ts / 2);

            // Grid
            var go = getOffset(thisvessel.Position, { X: 0, Y: 0, Z: 0 });
            gridoffset.x = parseInt(center.x + (go.X * localgridscale) * zoom);
            gridoffset.y = parseInt(center.y + (go.Z * localgridscale) * zoom);

            //// Draw Grid
            //var dotwidth = 1000 * zoom;

            // Scanning Functions?
            if (scanningMode)
                DrawPING();

            lastmaneuver = thisvessel.Maneuver;

            if (thisvessel.Maneuver === "FTL") {
                //$this.css("background-image", "none");
            } else if (previousMode !== 1) {
                //DrawGrid();
                //$this.css("background-image", "url(images/grid-s.png)");
            } else {
                DrawGrid();
            }
            //$this.css("background-position", gridoffset.x + "px " + gridoffset.y + "px");
            //$this.css("background-size", 2000 * zoom);

            var bgsize = Clamp(9600 * zoom, 800, 9600);
            //$this.css("background-image", "url('/images/nebula.png')");
            $this.css("background-position", center.x + "px " + center.y + "px");
            $this.css("background-size", bgsize + "px " + bgsize + "px");

            ct.setTransform(storedTransform);

            // Unerlays
            if (weaponArcs)
                DrawWeaponArcs();

            // Draw Contacts
            for (var c in contacts)
                DrawObject(contacts[c], ts, tl);

            // Overlays

            ct.setTransform(storedTransform);

            // Compass
            if (showCompass)
                DrawCompass();

            // Draw Vessel
            //ct.translate(center.x, center.y);
            //ct.drawImage(rp, xi - offs, yi - offs, ps, ps);
            DrawObject(thisvessel, ts, tl);
            //DrawVessel(ts, tl);

            ct.restore();

        } catch (err) {
            console.log("Radar.RenderLocal: " + err.message);
        }
    }

    function DrawObject(o, ts, tl) {
        try {
            if (typeof o.Name === "undefined" || o.Name === "")
                return;
            if (typeof o.BaseType === "undefined")
                return;
            if (o.Planet !== thisvessel.Planet)
                return;

            ct.save();

            var isPlayer = (o === thisvessel);

            // Updates For Smooth Rendering
            var po;
            if (!isPlayer) 
                UpdateObjectMovement(o, (onFocus) ? 1 : undefined); 
            
            po = getOffset(thisvessel.Position, o.Position);
            var xi = parseInt(po.X * localscale * zoom);
            var yi = parseInt(po.Z * localscale * zoom);

            var below = false;
            var rot = DegreesToRadians(o.Orientation.X);

            showtext = false;
            //if (rotated) {
            //ct.translate(center.x, center.y);
            //ct.rotate(-DegreesToRadians(spacialData.Yaw));
            //}

            if (po.Y < 0)
                below = true;

            ct.font = "9px sans-serif";
            var nw = ct.measureText(o.Name).width;
            var range = 0;

            if (below)
                ct.fillStyle = "#aaaaff";
            else
                ct.fillStyle = "#aaffaa";

            if (o.ID === selectedid || o.BaseType === "Planet") {
                range = GetDistance(thisvessel.Position, o.Position);
                if (o.BaseType === "Planet")
                    range -= (o.Scale * scale);
                if (range < 0) range = 0;
            }

            if (o.ID === selectedid) {
                ct.fillStyle = "#fff";
                SetText("#target-intel-range", toMetric(range));
                showtext = true;
            }

            if (o.BaseType === "Planet") {
                var ps = parseInt((o.Scale * localscale * scale) * zoom * 2);
                var offs = Math.floor(ps / 2);
                //ipy = 75;

                // Scanning?
                if (scanningMode) {
                    if (typeof scanningid !== "undefined") {
                        if (scanningid !== 0 && scanningid === o.ID) {
                            var prads = (Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 1.9));
                            ct.strokeStyle = "green";
                            ct.lineWidth = 4;
                            ct.beginPath();
                            ct.arc(xi, yi, ps * .51, 0, prads, true); //fullCircle
                            ct.stroke();
                            ct.closePath();
                        }
                    }
                }

                ct.drawImage(rp, xi - offs, yi - offs, ps, ps);
                
                ct.fillText(o.Name, xi - parseInt(nw / 2), yi + 4);
                var nd = ct.measureText(toMetric(range)).width;
                ct.fillText(toMetric(range), xi - parseInt(nd / 2), yi + 16); // Distance

            } else if (o.BaseType === "Cluster") {
                var ps = parseInt((o.Radius * localscale * scale) * zoom * 2);
                var offs = Math.floor(ps / 2);
                ct.drawImage(rcl, xi - offs, yi - offs, ps, ps);

            } else {
                if (InRect(center.x + xi, center.y + yi, 0, 0, ct.canvas.width, ct.canvas.height)) {

                    // Scale Item
                    //ts = parseInt((o.Radius * localscale * scale) * zoom * 2);
                    //tl = -(ts / 2);

                    var plane = (T3dView) ? plane = o.Relative.Y * 60 : 0;

                    // On Screen
                    ct.translate(xi, yi + plane);

                    // Distance From Base
                    if (plane < 0) {
                        DrawLine(ct, 0, 0, 0, -plane, 1, "rgba(100, 255, 100, .8)");
                        DrawDot(ct, 2, 0, -plane, "rgba(100, 255, 100, .6)");
                    }

                    ct.rotate(rot);

                    // Icon
                    if (isPlayer) {
                        ct.drawImage(rvp, tl, tl, ts, ts);
                    } else {
                        var ipx = 0;
                        var ipy = 0;

                        var iconstyle = "white";

                        //if (typeof factions[o.Faction] !== "undefined") 
                        //    iconstyle = "rgb(" + factions[o.Faction].Color.R + "," + factions[o.Faction].Color.G + "," + factions[o.Faction].Color.B + ")";
                        
                        //if (o.Faction === thisvessel.Faction)
                        //    iconstyle = "green";
                        //else if (IsEnemyFaction(o))
                        //    iconstyle = "red";
                        //else
                        //    iconstyle = "cyan";

                        if (o.Faction === thisvessel.Faction)
                            ipx = 100;
                        else if (IsEnemyFaction(o))
                            ipx = 200;
                        else
                            ipx = 300;

                        if (o.BaseType === "Missile") {
                            ct.drawImage(rm, -8, -8, 16, 16);
                        } else {
                            switch (o.BaseType) {
                                case "Object":
                                    ipx = 0;
                                    break;
                                case "Debris":
                                    ipx = 100;
                                    ipy = 600;
                                    //ts = 30;
                                    break;
                                case "Container":
                                    ipy = 400;
                                    break;
                                case "Vessel":
                                    ipy = 100;
                                    break;
                                case "Cargo":
                                case "Repair":
                                case "Drone":
                                    ipy = 300;
                                    break;
                                default:
                                    // Station-Other
                                    ipy = 200;
                                    break;
                            }

                            //ct.drawImage(icons, ipx, ipy, 60, 60, tl, tl, ts, ts);
                            // this will keep new drawings only where we already have existing pixels
                            //ct.globalCompositeOperation = 'source-atop';

                            //ct.fillStyle = iconstyle;
                            //ct.fillRect(tl, tl, ts, ts);

                            // now choose between the list of blending modes
                            //ct.globalCompositeOperation = "overlay"; // "overlay";
                            // draw our original image
                            ct.drawImage(icons, ipx, ipy, 100, 100, tl, tl, ts, ts);
                            // go back to default
                            ct.globalCompositeOperation = 'source-over';

                        }
                    }

                    ct.rotate(-rot);

                    // Target?
                    var tso = ts + 4;
                    var tro = parseInt(-tso / 2);

                    if (o.ID === currenttargetid)
                        ct.drawImage(tt, tro, tro, tso, tso);
                    if (o.ID === flighttargetid)
                        ct.drawImage(ft, tro, tro, tso, tso);
                    //if (o.ID === sciencetargetid)
                    //    ct.drawImage(st, tro, tro, tso, tso);
                    if (o.ID === gmtargetid)
                        ct.drawImage(gt, tro, tro, tso, tso);

                    // Scanning?
                    if (scanningMode) {
                        if (typeof scanningid !== "undefined") {
                            if (scanningid !== 0 && scanningid === o.ID) {
                                //ct.width = 30;
                                var rads = (Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 2)); // (Math.PI / 180) * 360;
                                ct.strokeStyle = "green";
                                ct.lineWidth = 4;
                                ct.beginPath();
                                ct.arc(0, 0, 20, 0, rads, true); //fullCircle
                                //ct.closePath();
                                ct.stroke();
                            }
                        }
                    }

                    // Label
                    if (showtext === true) {
                        ct.font = "9px sans-serif";
                        var ndt = ct.measureText(toMetric(range)).width;
                        var nl = -tl + 12; // 22;
                        var dl = tl - 4; // -16;
                        if (nl < 6) nl = 6;
                        if (dl > -4) dl = -4;
                        
                        ct.fillStyle = "white";
                        ct.fillText(o.Name, -parseInt(nw / 2), nl); // Name
                        if (!isPlayer)
                            ct.fillText(toMetric(range), -parseInt(ndt / 2), dl); // Distance
                    }

                    // Distance From Base
                    if (plane > 0) {
                        DrawLine(ct, 0, 0, 0, -plane, 1, "rgba(100, 100, 255, .8)");
                        DrawDot(ct, 2, 0, -plane, "rgba(100, 100, 255, .6)");
                    }

                    //ct.translate(-xi, -(yi + plane));
                    //ct.translate(center.x, center.y);

                } else {

                    ipy = 500;

                    ts = 36;

                    if (o.Faction === thisvessel.Faction)
                        ipx = 100;
                    else if (IsEnemyFaction(o))
                        ipx = 200;
                    else
                        ipx = 300;

                    //ct.translate(-center.x, -center.y);

                    rot = DegreesToRadians(AngleBetweenVectors(thisvessel.Position, o.Position) + 90);
                    if (rot > 360)
                        rot -= 360;
                    ct.rotate(rot);
                    ct.drawImage(icons, ipx, ipy, 100, 100, -(ts / 2), -(ct.canvas.height / 2) - 2, ts, ts);
                    //ct.rotate(-rot);
                    //ct.drawImage(cmp, -(compheight / 2), -(compheight / 2), compheight, compheight);

                    //var inset = 0;
                    //var itt = Intersect(inset, inset, ct.canvas.width, inset, center.x, center.y, center.x + xi, center.y + yi); // Top
                    //var itb = Intersect(inset, ct.canvas.height, ct.canvas.width, ct.canvas.height, center.x, center.y, center.x + xi, center.y + yi); // Bottom
                    //var itl = Intersect(inset, inset, inset, ct.canvas.height, center.x, center.y, center.x + xi, center.y + yi); // Left
                    //var itr = Intersect(ct.canvas.width, inset, ct.canvas.width, ct.canvas.height, center.x, center.y, center.x + xi, center.y + yi); // Right

                    //if (IsEnemyFaction(o)) ct.fillStyle = "#ff0000";

                    //if (typeof itt !== "undefined") {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itt.x, itt.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //} else if (itb) {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itb.x, itb.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //} else if (itl) {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itl.x, itl.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //} else if (itr) {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itr.x, itr.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //}
                }

            }
        } catch (err) {
            console.log("Radar.DrawObject: " + err.message);
        }
        ct.restore();
    }

    function DrawCompass() {
        ct.save();
        try {
            var rot = DegreesToRadians(thisvessel.Orientation.X);
            var arrowSize = 24;
            var pad = 8;
            var compheight = ct.canvas.height - (pad * 2);
            var comphalf = compheight / 2;

            // Compass
            //ct.rotate(rot);
            ct.drawImage(cmp, -comphalf, -comphalf, compheight, compheight);
            
            // Heading Arrow
            ct.rotate(rot);
            ct.drawImage(cmpa, -6, -comphalf + (arrowSize) - 6, arrowSize, arrowSize);

        } catch (err) {
            console.log("Radar.DrawCompass: " + err.message);
        }
        ct.restore();
    }

    function DrawGrid(gridSize, sections, mode) {
        try {
            if (typeof gridSize === "undefined")
                gridSize = 100000;

            if (typeof sections === "undefined")
                sections = 20;

            if (typeof mode == "undefined")
                mode = "Local";

            if (typeof sectors == "undefined")
                sectors = false;

            var gs = gridSize * localscale * zoom;
            var ox;
            var oy;
            var top = -parseInt(ct.canvas.height / 2);
            var bottom = parseInt(ct.canvas.height / 2);
            var left = -parseInt(ct.canvas.width / 2);
            var right = parseInt(ct.canvas.width / 2);
            var toff = Math.ceil(gs / 2);

            // Find Top Left Map Coords
            switch (mode) {
                case "Galactic":
                    ox = 0; //gridoffset.x - center.x;
                    oy = 0; //gridoffset.y - center.y;
                    top += viewcenter.Z * zoom;
                    bottom += viewcenter.Z * zoom;
                    left += viewcenter.X * zoom;
                    right += viewcenter.X * zoom;
                    sectors = true;
                    break;
                default:
                    ox = gridoffset.x - center.x;
                    oy = gridoffset.y - center.y;
                    break;
            }

            // Columns
            for (var c = -sections; c < sections; c++) {
                var cp = ox + gs * c;
                if (cp < left || cp > right)
                    continue;

                ct.lineWidth = 1;
                ct.strokeStyle = 'rgba(0, 0, 200, .5)';
                ct.beginPath();
                ct.moveTo(cp, top);
                ct.lineTo(cp, bottom);
                ct.stroke();
                ct.closePath();

                //console.log("Column: " + cp);
            }

            // Rows
            for (var r = -sections; r < sections; r++) {
                var rp = oy + gs * r;
                if (rp < top || rp > bottom)
                    continue;

                ct.lineWidth = 1;
                ct.strokeStyle = 'rgba(0, 0, 200, .5)';
                ct.beginPath();
                ct.moveTo(left, rp);
                ct.lineTo(right, rp);
                ct.stroke();
                ct.closePath();

                //console.log("Row: " + cp);
            }

            // Sector Labels?
            if (sectors) {
                var cc = 0;
                ct.font = "bold " + (30 * zoom) + "px Arial";
                ct.fillStyle = "rgba(150, 150, 150, .1)";

                // Columns
                for (var c = -sections; c < sections; c++) {
                    var cp = ox + gs * c;
                    //if (cp < left || cp > right)
                    //    continue;

                    cc++;
                    var cn = String.fromCharCode(64 + cc);
                    var rc = 0;

                    // Rows
                    for (var r = -sections; r < sections; r++) {
                        var rp = oy + gs * r;
                        //if (rp < top || rp > bottom)
                        //    continue;

                        rc++;

                        var sl = cn + rc;
                        var fs = ct.measureText(sl)
    
                        ct.fillText(sl, cp + toff - Math.ceil(fs.width / 2), rp + toff + Math.ceil(fs.actualBoundingBoxAscent / 2)); // Name
                    }
                }
            }

        } catch (err) {

        }
    }

    function DrawWeaponArcs() {
        ct.save();
        try {
            //ct.translate(center.x, center.y);
            //if (!rotated)
            ct.rotate(DegreesToRadians(thisvessel.Orientation.X));

            var rld = 35000 * localscale * zoom;
            ct.lineWidth = 1;
            ct.strokeStyle = 'darkblue';
            ct.beginPath();
            ct.moveTo(0, 0);
            ct.lineTo(-rld, -rld);
            ct.moveTo(0, 0);
            ct.lineTo(rld, -rld);
            ct.stroke();
            ct.closePath();
            ct.beginPath();
            ct.strokeStyle = '#000033';
            ct.moveTo(0, 0);
            ct.lineTo(rld, rld);
            ct.moveTo(0, 0);
            ct.lineTo(-rld, rld);
            ct.stroke();
            ct.closePath();

            ct.moveTo(0, 0);
            ct.strokeStyle = 'darkblue';
            // 100km
            ct.beginPath();
            ct.arc(0, 0, rld * 1.41, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();
            // 40km
            rld *= .43;
            ct.beginPath();
            ct.arc(0, 0, rld * 1.41, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();

            ct.restore();
        } catch (err) {
            console.log("Radar.DrawWeaponArcs: " + err.message);
        }
        ct.restore();
    }

    function CheckLocalSelection(e) {
        try {
            if (typeof contacts === "undefined") return;

            var coords = GetEventCoords($this, e);
            var offset = { x: 0, y: 0 };
            var closestobject;
            var closerange = 1000000;

            for (var c in contacts) {
                try {
                    var v = contacts[c];
                    var po = getOffset(thisvessel.Position, v.Position);
                    var plane = 0;

                    if (T3dView)
                        plane = v.Relative.Y * 60;

                    var xi = center.x + ((po.X * localscale) * zoom);
                    var yi = center.y + plane + ((po.Z * localscale) * zoom);
                    var radius = 20 + (4 - zoom) * 3;

                    if (v.BaseType === "Planet")
                        radius = (1.7 * (v.Scale * .006)) * zoom;
                    var range = GetDistance2(xi, yi, coords.x, coords.y);

                    if (range <= radius && range < closerange) {
                        closerange = range;
                        closestobject = v;
                    }

                    // Player?
                    var prange = GetDistance2(center.x, center.y, coords.x, coords.y);
                    if (prange <= 30 && prange < closerange) {
                        closestobject = thisvessel;
                    }
                } catch (err) {
                    console.log("Radar.MouseDown.Contact: " + err.message);
                }
            }

            if (typeof closestobject !== "undefined") {
                CloseInfo();
                PlayClickSound();

                if (closestobject.ID === 0) {
                    if (selectedLocal !== closestobject.Name)
                        selectedLocal = closestobject.Name;
                    else
                        selectedLocal = "";
                    ObjectSelected(selectedLocal);
                } else {
                    if (selectedLocal !== closestobject.ID) 
                        selectedLocal = closestobject.ID;
                    else
                        selectedLocal = -1;
                    ObjectSelected(selectedLocal);
                }
            } else {
                CloseInfo();
            }
        } catch (err) {
            console.log("Radar.CheckLocalSelection: " + err.message);
        }
    }

    // System Map Functions

    function RenderSystem() {
        try {
            //if (!$this.is(':visible')) return;
            var center = { x: 0, y: 0 };
            var offset = { x: 0, y: 0 };
            var reticleSize = 36;
            var reticleScale = reticleSize * 1; //mapZoom
            var reticleHalf = reticleScale / 2;
            var size = 10;
            var moving = false;

            // Clear
            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();
            ct.save();

            if (typeof starSystem === "undefined")
                return;

            if (lastSystem !== starSystem) {
                lastSystem = starSystem;
                SetZoom(1);

                if (starSystem.Class !== starclass) {
                    starclass = starSystem.Class.toLowerCase();
                    starol.src = "/images/star-" + starclass + ".png";
                }
            }

            center.x = Math.ceil(ct.canvas.width / 2);
            center.y = Math.ceil(ct.canvas.height / 2);

            var bgsize = Clamp(800 * zoom * 2, 800, 6400);
            //$this.css("background-image", "url('/images/nebula.png')");
            $this.css("background-position", center.x + "px " + center.y + "px");
            $this.css("background-size", bgsize + "px " + bgsize + "px");

            //if (thisvessel.Speed > 0 && galacticinfo.System !== "" && galacticinfo.Planet === "") {
                moving = true;
            //}

            // Info
            // Labels
            //ct.fillStyle = "DarkGrey";
            //ct.font = "bold 14px sans-serif";
            //ct.fillText("Galaxy:", 12, 36);
            //ct.fillText("System:", 12, 56);

            //// Data
            //ct.fillStyle = "White";
            //ct.font = "14px sans-serif";
            //ct.fillText(starSystem.Name, 100, 56);

            var maxrange = center.x > center.y ? center.y - 10 : center.x - 10;
            if (maxrange < 0)
                maxrange = 0;
            var farthest = 0;

            // Find Farthest Planet
            for (var fi in starSystem.Planets) {
                var fp = starSystem.Planets[fi];
                if (fp.OrbitalDistance > farthest) farthest = starSystem.Planets[fi].OrbitalDistance;
            }

            var localscale = (maxrange / farthest) * zoom;

            // Habitable Zone
            ct.globalAlpha = 0.07;
            var hzz = 1.55; // Constant
            var hod = (starSystem.HabitableZone.X / farthest) * maxrange * zoom * hzz;
            var hw = ((starSystem.HabitableZone.Y - starSystem.HabitableZone.X) / farthest) * maxrange * zoom * hzz;
            ct.strokeStyle = "rgb(10,255,10)";
            ct.lineWidth = hw;
            ct.beginPath();
            ct.arc(center.x, center.y, hod, 0, fullCircle, true); //(Math.PI / 180) * 0
            ct.stroke();
            ct.closePath();
            ct.globalAlpha = 1;

            // Orbital Path
            ct.strokeStyle = "rgb(75, 75, 75, .4)";
            ct.lineWidth = 2;
            for (var i in starSystem.Planets) {
                var p = starSystem.Planets[i];
                var od = (p.OrbitalDistance / farthest) * maxrange * zoom;
                ct.beginPath();
                ct.arc(center.x, center.y, od, 0, fullCircle, true); //(Math.PI / 180) * 0
                ct.stroke();
                ct.closePath();
            }

            // Reticle Rotation?
            reticleRotation += 2;
            if (reticleRotation > 360) reticleRotation -= 360;
            var rot = DegreesToRadians(reticleRotation);

            // Scan Data?
            if (typeof systemScanResults !== "undefined") {
                // Labels
                ct.drawImage(energy, 0, 0, 256, 256, ct.canvas.width - 320, 20, 40, 40);
                ct.fillStyle = "White";
                ct.font = "18px sans-serif";
                ct.fillText("Energy Reading Detected", ct.canvas.width - 275, 40);

                for (var si in systemScanResults) {
                    var r = systemScanResults[si];

                    //if (r.ScanDetail.length === 0) {
                        //$("#scan-levels").hide();
                        //list = "<div class='Reading centered'>Scan Was Inconclusive</div>";
                    //} else if (r.ScanDetail.length > 0 && typeof r.ScanDetail[0].Range !== "undefined") {
                        //$("#scan-levels").hide();
                        //list = "<div class='Reading centered'>Detailed scans are ineffective beyond 600km</div>";
                    //} else {
                        // Energy Reading
                        var roffset = { x: 0, y: 0 };
                        roffset.x = parseInt((r.Position.X * localscale) + center.x);
                        roffset.y = parseInt((r.Position.Z * localscale) + center.y);
                        ct.save();
                        ct.translate(roffset.x, roffset.y);
                        ct.rotate(-rot);
                        ct.drawImage(energy, -40, -40, 80, 80);
                        ct.restore();

                        //ct.fillStyle = "white";
                        //ct.lineWidth = 4;
                        //ct.beginPath();
                        //ct.arc(roffset.x, roffset.y, 20, 0, fullCircle, true); 
                        ////ct.fill();
                        //ct.stroke();
                        //ct.closePath();

                        //for (var i in systemScanResults.ScanDetail) {
                        //    var r = systemScanResults.ScanDetail[i];

                        //}
                    //}
                }
            }

            // Planets / Belts
            for (var pi in starSystem.Planets) {
                var planet = starSystem.Planets[pi];
                var pod = (planet.OrbitalDistance / farthest) * maxrange * zoom;
                var op = DegreesToRadians(planet.OrbitalPosition - 90);
                var ot = planet.OrbitalPeriod;
                var poffset = { x: 0, y: 0 };

                poffset.x = center.x + (pod * Math.cos(op));
                poffset.y = center.y + (pod * Math.sin(op));
                planet.offset = { x: poffset.x, y: poffset.y };

                size = 6;
                ct.font = "12px sans-serif";
                ct.width = 2;
                ct.fillStyle = "rgb(" + planet.Color.R + ", " + planet.Color.G + ", " + planet.Color.B + ")";

                // Planet
                ct.beginPath();
                ct.arc(poffset.x, poffset.y, size, 0, fullCircle, true);  //(Math.PI / 180) * 0
                ct.fill();
                ct.closePath();

                // Name
                var nm = planet.Name;
                var textwidth = ct.measureText(nm).width;
                //var norm = Normalize2P(center, offset);

                var xrel = offset.x / ct.canvas.width;
                var xpos = offset.x + 10;  // Right Side
                //if (offset.x + ct.measureText(planet.Name).width > ct.width) offset.x -= textwidth - 20;

                //xpos.x = offset.x + norm.x * 10;
                //xpos.y = offset.y + norm.y * 10;

                if (xrel <= .5) {
                    // Left Side
                    xpos = poffset.x - textwidth - 10;
                    if (xpos < 0) {
                        // Switch To Right Side
                        xpos = poffset.x + 10;
                    }

                } else {
                    // Right Side
                    xpos = poffset.x + 10;
                    if (xpos + textwidth > ct.canvas.width) {
                        // Switch To Left Side
                        xpos = poffset.x - textwidth - 10;
                    }
                }

                ct.fillStyle = "White";
                ct.fillText(planet.Name, xpos, poffset.y);
            }

            // Star
            size = 10;
            ct.fillStyle = "rgb(" + starSystem.Color.R + ", " + starSystem.Color.G + ", " + starSystem.Color.B + ")";
            ct.beginPath();
            ct.arc(center.x, center.y, size, 0, fullCircle, true); //(Math.PI / 180) * 0
            ct.fill();
            ct.closePath();

            // Overlay
            ct.drawImage(starol, center.x - 10, center.y - 10, 20, 20);

            //ct.fillText(starSystem.Name, xi + 15, yi + 5); 

            if (typeof thisvessel !== "undefined" && typeof thisvessel.StarPosition !== "undefined" && galacticinfo.System === starSystem.Name) {

                // Updates For Smooth Rendering
                UpdateObjectMovement(thisvessel);

                var scl = 11.47;
                var sroffset = { x: 0, y: 0 };
                sroffset.x = parseInt((thisvessel.StarPosition.X * localscale) + center.x);
                sroffset.y = parseInt((thisvessel.StarPosition.Z * localscale) + center.y);
                ct.translate(sroffset.x, sroffset.y);

                if (moving) {
                    var ts = 30; // * radarZoom;
                    if (ts < 12) ts = 12;
                    var tl = -(ts / 2);
                    DrawVessel(ts, tl);
                } else {
                    ct.rotate(rot);
                    ct.drawImage(reticle, -reticleHalf, -reticleHalf, reticleScale, reticleScale);
                }
            }

            ct.restore();

        } catch (err) {
            console.log("Radar.RenderSystem: " + err.message);
        }
    }

    function CheckSystemSelection(e) {
        try {
            var coords = GetEventCoords($this, e);
            var radius = 50; //mapZoom * 30;
            if (siText === "")
                siText = hf_PlanetarySystemInfo;
            var closestobject;
            var closerange = 1000000;

            for (var i in starSystem.Planets) {
                var ps = starSystem.Planets[i];

                var range = GetDistance2(ps.offset.x, ps.offset.y, coords.x, coords.y);

                if (range <= radius && range < closerange) {
                    closerange = range;
                    closestobject = ps;
                }
            }

            if (typeof closestobject !== "undefined") {
                PlayClickSound();

                var w = 175;
                var t = closestobject.offset.y - 0;
                var l = closestobject.offset.x + 15;

                //if ((l + w) > w_width) l = (ps.offset.x - 30 - w);

                var style = "width: " + w + "px; height: auto;top: " + t + "px;left: " + l + "px";
                var si = siText;
                si = replaceAll(si, "[Style]", style);
                si = replaceAll(si, "[Name]", closestobject.Name);
                si = replaceAll(si, "[Class]", replaceAll(closestobject.Class, "_", " "));
                si = replaceAll(si, "[Planets]", closestobject.Moons);
                si = replaceAll(si, "[Distance]", GetDistance(thisvessel.GalacticPosition, closestobject.Position) + " Lightyears");
                si = replaceAll(si, "[Explored]", closestobject.Explored === true ? "Yes" : "No");

                CloseInfo();
                $("body", window.top.document).append(si);
            } else {
                CloseInfo();
            }
        } catch (err) {
            console.log("Radar.CheckSytemSelection: " + err.message);
        }
    }

    // Galactic Map Functions

    function RenderGalatic() {
        try {
            if (typeof currentMap === "undefined")
                return;
            if (typeof thisvessel.GalacticPosition !== "undefined" && typeof viewcenter === "undefined") 
                viewcenter.X = thisvessel.GalacticPosition.X;

            // Locals
            var center = { x: 0, y: 0 };
            var offset = { x: 0, y: 0 };
            var reticleSize = 12;
            var reticleScale = reticleSize * zoom;
            var reticleHalf = reticleScale / 2;
            var moving = false;

            ct.save();
            //Clear
            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();

            center.x = Math.ceil(ct.canvas.width / 2);
            center.y = Math.ceil(ct.canvas.height / 2);

            if (typeof lastPosition === "undefined") {
                lastPosition.X = thisvessel.GalacticPosition.X;
                lastPosition.Z = thisvessel.GalacticPosition.Z;
            }

            if (typeof thisvessel.GalacticPosition !== "undefined" && lastPosition.X !== thisvessel.GalacticPosition.X && lastPosition.Z !== thisvessel.GalacticPosition.Z) {
                viewcenter.X = thisvessel.GalacticPosition.X;
                viewcenter.Z = thisvessel.GalacticPosition.Z;
                lastPosition.X = thisvessel.GalacticPosition.X;
                lastPosition.Z = thisvessel.GalacticPosition.Z;
            //    moving = true;
            }

            //if (thisvessel.Speed > 0 && galacticinfo.System === "") {
                moving = true;
            //}

            if (typeof viewcenter !== "undefined") {
                center.x -= viewcenter.X * zoom;
                center.y -= viewcenter.Z * zoom;
            }

            ct.setTransform(1, 0, 0, 1, center.x, center.y);
            var storedTransform = ct.getTransform();

            // Grid
            var go = getOffset(thisvessel.GalacticPosition, { X: 0, Y: 0, Z: 0 });
            gridoffset.x = parseInt(center.x + (go.X * localgridscale * zoom));
            gridoffset.y = parseInt(center.y + (go.Z * localgridscale * zoom));

            var bgsize = Clamp(800 * zoom, 800, 6400);
            //$this.css("background-image", "url('/images/nebula.png')");
            $this.css("background-position", center.x + "px " + center.y + "px");
            $this.css("background-size", bgsize + "px " + bgsize + "px");

            // Factions
            for (var si in currentMap.Systems) {
                var ssi = currentMap.Systems[si];
                var fsize = 1.5;

                fsize += ssi.Planets * .05;
                fsize *= zoom / 2;

                offset.x = (ssi.Position.X * zoom); // + center.x;
                offset.y = (ssi.Position.Z * zoom); // + center.y;
                ssi.offset = { x: offset.x, y: offset.y };

                // Render Faction?
                if (ssi.Faction !== "") {
                    DrawCircle(ct,
                        offset.x,
                        offset.y,
                        fsize * 10,
                        "rgba(" + factions[ssi.Faction].Color.R / 2 + ", " + factions[ssi.Faction].Color.G / 2 + ", " + factions[ssi.Faction].Color.B / 2 + ", 1)"
                    );
                }

            }

            DrawGrid(10000, 4, "Galactic");

            // Label Settings
            ct.font = "12px sans-serif";
            ct.strokeStyle = "rgb(50,50,50)";
            ct.width = 1;

            // Systems
            for (var i in currentMap.Systems) {
                var ss = currentMap.Systems[i];
                var size = .5;

                size += ss.Planets * .05;
                size *= zoom / 2;

                offset.x = (ss.Position.X * zoom); //+ center.x;
                offset.y = (ss.Position.Z * zoom);// + center.y;
                ss.offset = { x: offset.x, y: offset.y };

                // Render Star
                //DrawCircle(ct, offset.x, offset.y, size * 1.5, "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", .25)");
                var color = "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", .5)";
                DrawCircle(ct,
                    offset.x,
                    offset.y,
                    size,
                    "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", 1)",
                    size * .6,
                    "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", .5)"
                );
                //DrawCircle(ct, offset.x, offset.y, size * 1, color);
                //DrawCircle(ct, offset.x, offset.y, size * .75, color);
                //Star
                //var stsz = size * 3; //Star 1

                //if (ss.Selected) {
                //    ct.beginPath();
                //    ct.arc(offset.x, offset.y, size * 5, 0, circ, true);
                //    ct.stroke();
                //    ct.closePath();
                //    //ct.fillText(ss.Name, offset.x + 10, offset.y + 4);
                //}

                if (galacticinfo.System === ss.Name) {
                    ct.fillStyle = "white";
                    ct.fillText(ss.Name, offset.x + (4 * zoom), offset.y + 4);
                }
                //ct.fillRect(offset.x, offset.y, size, size);
            }

            // Mission Waypoint(s)
            //if (missionWaypoints != undefined) {
            //    for (var m in missionWaypoints) {
            //        var mw = missionWaypoints[mw];

            //    }
            //}

            // Vessel Waypoint(s)
            //if (vesselWaypoints != undefined) {
            //    for (var v in vesselWaypoints) {
            //        var vw = vesselWaypoints[vw];

            //    }
            //}

            // Our Position
            if (typeof thisvessel.GalacticPosition !== "undefined") {

                // Updates For Smooth Rendering
                UpdateObjectMovement(thisvessel);

                reticleRotation += 2;
                if (reticleRotation > 360) reticleRotation -= 360;
                var rot = DegreesToRadians(reticleRotation);
                var roffset = { x: 0, y: 0 };
                roffset.x = parseInt((thisvessel.GalacticPosition.X * zoom)); // + center.x);
                roffset.y = parseInt((thisvessel.GalacticPosition.Z * zoom)); // + center.y);
                ct.translate(roffset.x, roffset.y);
                //ct.rotate(rot);
                if (moving) {
                    var ts = 30; // * radarZoom;
                    if (ts < 12) ts = 12;
                    var tl = -(ts / 2);
                    DrawVessel(ts, tl);
                } else {
                    ct.drawImage(reticle, -reticleHalf, -reticleHalf, reticleScale, reticleScale);
                }
            }

            ct.restore();

            //if (mousestart != undefined) {
            //    ct.fillStyle = "white";
            //    ct.fillText("X:" + mousestart.x, -80, -80);
            //}
        } catch (err) {
            console.log("Radar.RenderGalactic: " + err.message);
        }
    }

    function CheckGalacticSelection(e) {
        //if (dragging) {
        //    dragging = false;
        //    return;
        //}
        var coords = GetEventCoords($this, e);
        var radius = 10; // (10 - mapZoom) * 10;
        var closestobject;
        var closerange = 1000;

        if (giText === "")
            giText = hf_StellarInfo;

        var clickOffset = {
            "x": ct.canvas.width / 2 - viewcenter.X * zoom,
            "y": ct.canvas.height / 2 - viewcenter.Z * zoom
        };

        for (var i in currentMap.Systems) {
            var ss = currentMap.Systems[i];
            var range = GetDistance2(clickOffset.x + ss.offset.x, clickOffset.y + ss.offset.y, coords.x, coords.y) / zoom;
            //var range = GetDistance2(ss.offset.x, ss.offset.y, coords.x, coords.y) / zoom;

            if (range <= radius && range < closerange) {
                closerange = range;
                closestobject = ss;
            }
        }

        if (typeof closestobject !== "undefined") {
            PlayClickSound();

            var w = 175;
            var t = parseInt(clickOffset.y + closestobject.offset.y - 0);
            var l = parseInt(clickOffset.x + closestobject.offset.x + 30);

            if (t < ct.canvas.scrollTop + 30) {
                t = ct.canvas.scrollTop + 30;
            } else if (t + 125 > ct.canvas.scrollTop + ct.canvas.scrollHeight) {
                t -= 125;
            }

            if ((l + w) > w_width) l = (closestobject.offset.x - 30 - w);

            var style = "width: " + w + "px; height: auto;top: " + t + "px;left: " + l + "px";
            var si = giText;
            si = replaceAll(si, "[Style]", style);
            si = replaceAll(si, "[Name]", closestobject.Name);
            si = replaceAll(si, "[Class]", closestobject.Class);
            si = replaceAll(si, "[Planets]", closestobject.Planets);
            si = replaceAll(si, "[Distance]", GetDistanceLY(thisvessel.GalacticPosition, closestobject.Position));
            si = replaceAll(si, "[Explored]", closestobject.Explored === true ? "Yes" : "No");

            CloseInfo();
            $("body", window.top.document).append(si);
        } else {
            CloseInfo();
        }
    }

    // Scanning Functions

    function DrawPING() {
        try {
            // Ring
            //ct.translate(center.x, center.y);
            //if (!rotated) ct.rotate(DegreesToRadians(spacialData.Yaw));

            var arld = 210000 * localscale * zoom;
            ct.lineWidth = 1;
            ct.strokeStyle = 'darkblue';

            //ct.moveTo(0, 0); //center.x, center.y);
            // 200km
            ct.beginPath();
            ct.arc(0, 0, arld * 1.41, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();

            ct.restore();

            scanningPing += 13 * ElapsedMilliseconds(lastPing);
            lastPing = new Date();

            if (scanningPing > 300000) 
                scanningPing = 5;
            
            if (scanningPing === 5 && typeof snd_ping !== "undefined") 
                snd_ping.Play();

            //ct.moveTo(center.x, center.y);
            ct.lineWidth = 4;
            ct.strokeStyle = '#101010';
            var rld = scanningPing * localscale * zoom;
            ct.beginPath();
            ct.arc(0, 0, rld, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();
        } catch (err) {
            console.log("ScanningDisplay.DrawPING", err.message);
        }
    }

    // Relative Radar Functions

    function DrawDot(ct, width, x, y, color) {
        try {
            ct.fillStyle = color;
            ct.width = width;
            ct.beginPath();
            ct.arc(x, y, width, 0, fullCircle, true);
            ct.fill();
            ct.closePath();
        } catch (err) {
            console.log("Radar.DrawDot: " + err.message);
        }
    }

};

jQuery.fn.GMRadar = function (options) {
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d");

    var rendering = false;
    var hidden = false;
    var onFocus = false;
    var newFocus = false;

    if (typeof options === "undefined")
        options = {};

    // Packet Types
    AddPacketType("BLAST");

    // Mode
    var mode = 1; // 1= Local, 2= System, 3= Galactic
    var userMode = 1;
    var previousMode = 1;
    var playerLock = false;

    // Zoom
    var globalzoom = 10;
    var zoom = 10;                      // Actual Zoom Level Used For Display
    var zoomUserLocal = 10;             // User Zoom Levels
    var zoomUserSystem = 1;
    var zoomUserGalactic = 10;
    var zoomToLocal = 10;   // 41-60
    var zoomToSystem = 10;  // 21-40
    var zoomToGlobal = 10;   // 1-20  
    var lastzoom = 0;
    var maxzoom = 8;

    var center = { x: 0, y: 0 };
    var gridoffset = { x: 0, y: 0 };

    var showtext = true;
    var lastmaneuver = "Cruise";

    // Options
    var consoleTarget = typeof options.Console !== "undefined" ? options.Console : "";
    var showCompass = typeof options.Compass !== "undefined" ? options.Compass : true;
    var weaponArcs = typeof options.WeaponArcs !== "undefined" ? options.WeaponArcs : false;
    var lockMode = typeof options.LockMode !== "undefined" ? options.LockMode : 0;
    var scanningMode = typeof options.ScanningMode !== "undefined" ? options.ScanningMode : false;
    var T3dView = typeof options.View3D !== "undefined" ? options.View3D : false;

    var hf_PlanetInfo;
    $.get("hf-planetary-system-gm.htm", {}, function (data) { hf_PlanetInfo = data; });

    // Selections
    var selectedLocal = -1;
    var selectedSystem = "";
    var selectedLocation = "";

    // UI
    var zoomLevelID = "#radar-zoom-level";

    // Scale
    var localscale = .01;
    var localgridscale = .01;

    // Background
    $this.css("background-image", "url('/images/nebula.png')");

    // Local
    var rvp = new Image();
    rvp.src = "images/rdr_vessel.png";
    var rm = new Image();
    rm.src = "images/radar_missile.png";
    var ft = new Image();
    ft.src = "images/lock-flight.png";
    var tt = new Image();
    tt.src = "images/lock-target.png";
    var st = new Image();
    st.src = "images/lock-science.png";
    var gt = new Image();
    gt.src = "images/lock-gm.png";
    var rp = new Image();
    rp.src = "images/planet.png";
    var rcl = new Image();
    rcl.src = "images/cluster-r.png";
    // Compass
    var cmp;
    var cmpa;
    if (showCompass) {
        cmp = new Image();
        cmp.src = "images/compass.png";
        cmpa = new Image();
        cmpa.src = "images/compass-arrow.png";
    }

    var icons = new Image();
    icons.src = "images/item-icons.png";

    // Galactic Variables
    var mousedown = false;
    var mousestart;
    var dragnatural = true;
    var dragging = false;
    var dragged = 0;
    var viewcenter = { X: 0, Y: 0, Z: 0 };
    var lastPosition = { X: 0, Y: 0, Z: 0 };

    var reticle = new Image();
    var reticleRotation = 0;
    var lastRotationUpdate = Date.now();
    reticle.src = "/images/reticle.png";
    var star = new Image();
    star.src = "/images/star-g-m.png";
    // End Galactic

    // Scanning Variables
    var snd_ping;
    var scanningPing = 5;
    var lastPing = new Date();

    // System Variables
    var energy = new Image();
    var starclass = "g";
    var starol = new Image();
    var siText = "";
    var giText = "";
    var lastSystem;
    energy.src = "/images/energy.png";

    $this.on("mousemove", function (e) {

        switch (mode) {
            case 1:
                if (typeof gridPosition !== "undefined") {
                    var mc = GetEventCoords($this, e);
                    gridPosition.x = parseInt(viewcenter.x + (((mc.x - center.x) / localscale) / zoom));
                    gridPosition.y = parseInt(viewcenter.y + (((mc.y - center.y) / localscale) / zoom));
                }
                break;
            case 2:
                if (typeof gridPosition !== "undefined") {
                    var mc = GetEventCoords($this, e);
                    gridPosition.x = parseInt(viewcenter.X + (((mc.x - center.x) / localscale) / zoom));
                    gridPosition.y = parseInt(viewcenter.Y + (((mc.y - center.y) / localscale) / zoom));
                }
                break;
            case 3:
                if (typeof gridPosition !== "undefined") {
                    var mc = GetEventCoords($this, e);

                    gridPosition.x = parseInt(viewcenter.X + (mc.x - center.x) / zoom);
                    gridPosition.y = parseInt(viewcenter.Y + (mc.y - center.y) / zoom);
                }
                break;
        }

    });

    $this.on("mousedown", function (e) {

        switch (mode) {
            case 1:
                CheckLocalSelection(e);
                break;
            case 2:
                CheckSystemSelection(e);
                break;
            case 3:
                CheckGalacticSelection(e);
                break;
        }

    });

    $(document).on("onResize", function (event) {
        ResetSize();
    });

    $(document).on("mousedown", ".map-mode", function (event) {
        userMode = $(this).data("mode")
        SetMode(userMode);
    });

    $(document).on("onReset", function () {

        userMode = 1;

        globalzoom = 10;
        zoomUserLocal = 10;
        zoomUserSystem = 1;
        zoomUserGalactic = 10;

        SetZoom();
    });

    $(document).on("onMapMode", function (e, mode) {
        SetMode(mode);
    });

    $(document).on("onMapZoom", function (e, zoom) {
        SetZoom(zoom);
    });

    $(document).on("onResize", function (e) {
        ResetSize();
    });

    $(document).on("onFocus", function () {
        newFocus = true;
    });

    $(zoomLevelID).on("input", function (e) {
        var z = parseFloat($("#radar-zoom-level").val());

        switch (mode) {
            case 1:
                zoomUserLocal = z;
                break;
            case 2:
                zoomUserSystem = z;
                break;
            case 3:
                zoomUserGalactic = z;
                break;
        }

        globalzoom = z;

        SetZoom();

        $("#radar-zoom-label").text(zoom + " : " + globalzoom);
    });

    $(document).on("onTargetInfo", function (e, id) {
        if (consoleTarget === "Tactical" && selectedid !== id) {
            selectedid = id;
        }
    });

    $(document).on("onFlightTargetInfo", function (e, id) {
        if (consoleTarget === "Flight" && selectedid !== id) {
            selectedid = id;
        }
    });

    $(document).on("onScienceTargetInfo", function (e, id) {
        if (consoleTarget === "Science" && selectedid !== id) {
            selectedid = id;
        }
    });

    Initialize();
    SetZoom();
    ResetSize();
    Render();

    function Initialize() {

        // Lock Mode?
        mode = lockMode;
        switch (lockMode) {
            case 1:
                // Local
                baseMode = mode;
                userMode = mode;
                //$(zoomLevelID).attr("min", 41);
                //$(zoomLevelID).attr("max", 60);
                $(zoomLevelID).val(zoomToLocal);
                break;
            case 2:
                // System
                baseMode = mode;
                userMode = mode;
                //$(zoomLevelID).attr("min", 21);
                //$(zoomLevelID).attr("max", 40);
                $(zoomLevelID).val(zoomToSystem);
                break;
            case 3:
                // Galactic
                baseMode = mode;
                userMode = mode;
                //$(zoomLevelID).attr("min", 3);
                //$(zoomLevelID).attr("max", 20);
                $(zoomLevelID).val(zoomToGlobal);
                break;
            default:
                //$(zoomLevelID).attr("min", 3);
                //$(zoomLevelID).attr("max", 60);
                SetMode(1);
                $(zoomLevelID).val(zoomToLocal);
                break;
        }

        SetMode(mode);

        if (scanningMode) {
            snd_ping = new SoundQue("/sound/ping.mp3");
        }
    }

    function SetMode(newMode) {
        mode = newMode;

        switch (mode) {
            case 1:
                globalzoom = zoomUserLocal;
                break;
            case 2:
                globalzoom = zoomUserSystem;
                break;
            case 3:
                globalzoom = zoomUserGalactic;
                break;
        }

        $(".map-mode-1").removeClass("selected");
        $(".map-mode-2").removeClass("selected");
        $(".map-mode-3").removeClass("selected");
        $(".map-mode-" + mode).addClass("selected");

        $(document).trigger("onMapModeSet", mode);

        SetZoom();
    }

    function SetZoom(newZoom) {
        if (typeof newZoom !== "undefined") {
            globalzoom = newZoom;
        }

        switch (mode) {
            case 1:
                // Local
                zoom = globalzoom * .06;
                break;
            case 2:
                // System
                zoom = globalzoom; // * (globalzoom * .1);
                break;
            case 3:
                // Galactic
                if (globalzoom < 3)
                    globalzoom = 3;
                zoom = globalzoom;
                break;
        }

        CloseInfo();

        $("#radar-zoom-level").val(globalzoom);

    }

    function Render() {
        try {
            if (rendering)
                return;

            //console.log("Rendering Radar");

            if (pageHidden || !$this.is(':visible')) {
                hidden = true;
                //return;
            } else if (hidden || newFocus) {
                hidden = false;
                newFocus = false;
                onFocus = true;
            } else if (onFocus) {
                onFocus = false;
            }

            rendering = true;

            previousMode = mode;

            if (typeof focusedObject !== "undefined") {
                if (typeof contacts[focusedObject.ID] !== "undefined") {
                    focusedObject = contacts[focusedObject.ID];
                }
                //UpdateObjectMovement(focusedObject, (onFocus) ? 1 : undefined);

                if (lockMode) {

                } else if (focusedObject.Maneuver === "FTL") {
                    if (galacticinfo.System !== "") {
                        globalzoom = zoomToSystem;
                        SetMode(2);
                    } else {
                        globalzoom = zoomToGlobal;
                        SetMode(3);
                    }

                    SetZoom();
                } else if (mode !== userMode) {
                    //globalzoom = zoomUser;
                    SetMode(userMode);
                    SetZoom();
                }
            }

            if (!hidden) {
                switch (mode) {
                    case 2:
                        // System
                        RenderSystem();
                        break;
                    case 3:
                        // Galactic
                        RenderGalatic();
                        break;
                    default:
                        // Local
                        RenderLocal();
                        break;
                }

                if (onFocus)
                    onFocus = false;
            }

        } catch (err) {
            console.log("Radar.Render: " + err.message);
        }

        rendering = false;

        requestAnimationFrame(Render);

    }

    // Global Map Functions

    function DrawVessel(ts, tl) {
        try {
            var yaw = DegreesToRadians(thisvessel.Orientation.X);

            //ct.translate(center.x, center.y);
            //if (!rotated)
            ct.rotate(yaw);

            if (ts < 12) ts = 12;
            ct.drawImage(rvp, tl, tl, ts, ts);

            ct.rotate(-yaw);

        } catch (err) {
            console.log("Radar.DrawVessel: " + err.message);
        }
    }

    // Outline

    function DrawFrame() {
        var sh = 40;
        var cw = 300;
        var aw = 40;
        var mw = ct.canvas.width - ((sh + aw) * 2);
        var mh = ct.canvas.height - sh;

        ct.translate(0, 0);
        //ct.moveTo(0, sh);

        ct.fillStyle = 'rgba(0, 0, 0, 0)';
        ct.strokeStyle = '#0000ee';
        ct.lineWidth = 1;
        ct.beginPath();
        // Top
        ct.lineTo(cw, sh);
        ct.lineTo(cw + aw, 0);
        ct.lineTo(ct.canvas.width - cw - aw, 0);
        ct.lineTo(ct.canvas.width - cw, sh);
        ct.lineTo(ct.canvas.width, sh);
        // Right Side
        ct.lineTo(ct.canvas.width, mh);
        // Bottom
        ct.lineTo(ct.canvas.width - cw, mh);
        ct.lineTo(ct.canvas.width - cw - sh, ct.canvas.height);
        ct.lineTo(cw + sh, ct.canvas.height);
        ct.lineTo(cw, mh);
        ct.lineTo(0, mh);
        // Left Side
        ct.lineTo(0, sh);
        ct.closePath();
        //ct.fill();
        ct.stroke();
    }

    // Local Map Function

    function ResetSize() {
        ct.canvas.width = $this.width();
        ct.canvas.height = $this.height();
    }

    function RenderLocal() {
        try {
            if (typeof focusedObject === "undefined" && typeof thisvessel !== "undefined")
                SetFocusedObject(thisvessel);

            if (typeof focusedObject === "undefined")
                return;
            if (typeof contacts === "undefined") 
                return;
            //if (!$this.is(':visible')) return;

            if (lastzoom !== zoom) {
                if (zoom > maxzoom) zoom = maxzoom;
                lastzoom = zoom;
            }

            viewcenter.x = focusedObject.Position.X;
            viewcenter.y = focusedObject.Position.Y;

            ResetSize();
            ct.clearRect(0, 0, ct.canvas.width, ct.canvas.height);

            center.x = parseInt(ct.canvas.width / 2);
            center.y = parseInt(ct.canvas.height / 2);

            ct.font = "9px sans-serif";
            ct.fillStyle = "#aaffaa";
            ct.lineStyle = "#ffff00";
            ct.setTransform(1, 0, 0, 1, center.x, center.y);
            var storedTransform = ct.getTransform();
            ct.save();

            // Offset
            var insize = 10000;
            //var scaleX = (spacialData.X % insize) / insize;
            //var scaleY = (spacialData.Y % insize) / insize;
            //var rot = 0;
            //var showtext = true;

            // Icon Sizing
            var ts = 30; // * radarZoom;
            if (ts < 12) ts = 12;
            var tl = -(ts / 2);

            // Grid
            var go = getOffset(focusedObject.Position, { X: 0, Y: 0, Z: 0 });
            gridoffset.x = parseInt(center.x + (go.X * localgridscale) * zoom);
            gridoffset.y = parseInt(center.y + (go.Z * localgridscale) * zoom);

            // Draw Grid
            var dotwidth = 1000 * zoom;

            // Scanning Functions?
            if (scanningMode)
                DrawPING();

            lastmaneuver = focusedObject.Maneuver;

            if (focusedObject.Maneuver === "FTL") {
                //$this.css("background-image", "none");
            } else if (previousMode !== 1) {
                //DrawGrid();
                //$this.css("background-image", "url(images/grid-s.png)");
            } else {
                DrawGrid();
            }
            //$this.css("background-position", gridoffset.x + "px " + gridoffset.y + "px");
            //$this.css("background-size", 2000 * zoom);

            var bgsize = Clamp(9600 * zoom, 800, 9600);
            //$this.css("background-image", "url('/images/nebula.png')");
            $this.css("background-position", center.x + "px " + center.y + "px");
            $this.css("background-size", bgsize + "px " + bgsize + "px");

            ct.setTransform(storedTransform);

            // Unerlays
            if (weaponArcs)
                DrawWeaponArcs();

            // Draw Planetary Items
            if (typeof planetarySystem !== "undefined") {
                for (var c in planetarySystem)
                    DrawObject(planetarySystem[c], ts, tl);
            }

            // Draw Contacts
            for (var c in contacts)
                DrawObject(contacts[c], ts, tl);

            // Overlays

            ct.setTransform(storedTransform);

            // Compass
            if (showCompass)
                DrawCompass();

            // Draw Vessel
            //ct.translate(center.x, center.y);
            //ct.drawImage(rp, xi - offs, yi - offs, ps, ps);
            //DrawObject(activeObject, ts, tl);
            //DrawVessel(ts, tl);

            ct.restore();

        } catch (err) {
            console.log("Radar.RenderLocal: " + err.message);
        }
    }

    function DrawObject(o, ts, tl) {
        try {
            if (typeof o.Name === "undefined" || o.Name === "")
                return;
            if (typeof o.BaseType === "undefined")
                return;
            if (o.Planet !== focusedObject.Planet)
                return;

            ct.save();

            var isPlayer = (o === thisvessel);

            // Updates For Smooth Rendering
            var po;
            if (!isPlayer)
                UpdateObjectMovement(o, (onFocus) ? 1 : undefined);

            po = getOffset(focusedObject.Position, o.Position);
            var xi = parseInt(po.X * localscale * zoom);
            var yi = parseInt(po.Z * localscale * zoom);

            var below = false;
            var rot = DegreesToRadians(o.Orientation.X);

            showtext = false;
            //if (rotated) {
            //ct.translate(center.x, center.y);
            //ct.rotate(-DegreesToRadians(spacialData.Yaw));
            //}

            if (po.Y < 0)
                below = true;

            ct.font = "9px sans-serif";
            var nw = ct.measureText(o.Name).width;
            var range = 0;

            if (below)
                ct.fillStyle = "#aaaaff";
            else
                ct.fillStyle = "#aaffaa";

            if (o.ID === selectedid || o.BaseType === "Planet") {
                range = GetDistance(focusedObject.Position, o.Position);
                if (o.BaseType === "Planet")
                    range -= (o.Scale * scale);
                if (range < 0) range = 0;
            }

            if (o.ID === selectedid) {
                ct.fillStyle = "#fff";
                SetText("#target-intel-range", toMetric(range));
                showtext = true;
            }

            if (o.BaseType === "Planet") {
                var ps = parseInt((o.Scale * localscale * scale) * zoom * 2);
                var offs = Math.floor(ps / 2);
                //ipy = 75;

                // Scanning?
                if (scanningMode) {
                    if (typeof scanningid !== "undefined") {
                        if (scanningid !== 0 && scanningid === o.ID) {
                            var prads = (Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 1.9));
                            ct.strokeStyle = "green";
                            ct.lineWidth = 4;
                            ct.beginPath();
                            ct.arc(xi, yi, ps * .51, 0, prads, true); //fullCircle
                            ct.stroke();
                            ct.closePath();
                        }
                    }
                }

                ct.drawImage(rp, xi - offs, yi - offs, ps, ps);
                
                ct.fillText(o.Name, xi - parseInt(nw / 2), yi + 4);
                var nd = ct.measureText(toMetric(range)).width;
                ct.fillText(toMetric(range), xi - parseInt(nd / 2), yi + 16); // Distance

            } else if (o.BaseType === "Cluster") {
                var ps = parseInt((o.Scale * localscale * scale) * zoom * 2);
                var offs = Math.floor(ps / 2);
                ct.drawImage(rcl, xi - offs, yi - offs, ps, ps);

            } else {
                if (InRect(center.x + xi, center.y + yi, 0, 0, ct.canvas.width, ct.canvas.height)) {

                    // Scale Item
                    //ts = parseInt((o.Scale * localscale * scale) * zoom * 2);
                    //tl = -(ts / 2);

                    var plane = (T3dView) ? plane = o.Relative.Y * 60 : 0;

                    // On Screen
                    ct.translate(xi, yi + plane);

                    // Distance From Base
                    if (plane < 0) {
                        DrawLine(ct, 0, 0, 0, -plane, 1, "rgba(100, 255, 100, .8)");
                        DrawDot(ct, 2, 0, -plane, "rgba(100, 255, 100, .6)");
                    }

                    ct.rotate(rot);

                    // Icon
                    if (isPlayer) {
                        ct.drawImage(rvp, tl, tl, ts, ts);
                    } else {
                        var ipx = 0;
                        var ipy = 0;

                        var iconstyle = "white";

                        if (typeof factions[o.Faction] !== "undefined") 
                            iconstyle = "rgb(" + factions[o.Faction].Color.R + "," + factions[o.Faction].Color.G + "," + factions[o.Faction].Color.B + ")";
                        else 
                            iconstyle = "white";

                        //if (o.Faction === thisvessel.Faction)
                        //    iconstyle = "green";
                        //else if (IsEnemyFaction(o))
                        //    iconstyle = "red";
                        //else
                        //    iconstyle = "cyan";

                        //if (o.Faction === focusedObject.Faction)
                        //    ipx = 60;
                        //else if (IsEnemyFaction(o))
                        //    ipx = 120;
                        //else
                        //    ipx = 180;

                        if (o.BaseType === "Missile") {
                            ct.drawImage(rm, -8, -8, 16, 16);
                        } else {
                            switch (o.BaseType) {
                                case "Object":
                                    ipx = 0;
                                    break;
                                case "Debris":
                                    ipx = 100;
                                    ipy = 600;
                                    //ts = 30;
                                    break;
                                case "Container":
                                    ipy = 400;
                                    break;
                                case "Vessel":
                                    ipy = 100;
                                    break;
                                case "Cargo":
                                case "Repair":
                                case "Drone":
                                    ipy = 300;
                                    break;
                                default:
                                    // Station-Other
                                    ipy = 200;
                                    break;
                            }

                            ct.drawImage(icons, ipx, ipy, 100, 100, tl, tl, ts, ts);
                            // this will keep new drawings only where we already have existing pixels
                            ct.globalCompositeOperation = 'source-atop';

                            ct.fillStyle = iconstyle;
                            ct.fillRect(tl, tl, ts, ts);

                            // now choose between the list of blending modes
                            ct.globalCompositeOperation = "destination-over"; // "overlay";
                            // draw our original image
                            ct.drawImage(icons, ipx, ipy, 100, 100, tl, tl, ts, ts);
                            // go back to default
                            ct.globalCompositeOperation = 'source-over';

                        }
                    }

                    ct.rotate(-rot);

                    // Target?
                    var tso = ts + 4;
                    var tro = parseInt(-tso / 2);

                    if (o.ID === currenttargetid)
                        ct.drawImage(tt, tro, tro, tso, tso);
                    if (o.ID === flighttargetid)
                        ct.drawImage(ft, tro, tro, tso, tso);
                    //if (o.ID === sciencetargetid)
                    //    ct.drawImage(st, tro, tro, tso, tso);
                    if (o.ID === gmtargetid)
                        ct.drawImage(gt, tro, tro, tso, tso);

                    // Scanning?
                    if (scanningMode) {
                        if (typeof scanningid !== "undefined") {
                            if (scanningid !== 0 && scanningid === o.ID) {
                                //ct.width = 30;
                                var rads = (Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 2)); // (Math.PI / 180) * 360;
                                ct.strokeStyle = "green";
                                ct.lineWidth = 4;
                                ct.beginPath();
                                ct.arc(0, 0, 20, 0, rads, true); //fullCircle
                                //ct.closePath();
                                ct.stroke();
                            }
                        }
                    }

                    // Label
                    if (showtext === true) {
                        var ndt = ct.measureText(toMetric(range)).width;
                        var nl = -tl + 12; // 22;
                        var dl = tl - 4; // -16;
                        if (nl < 6) nl = 6;
                        if (dl > -4) dl = -4;
                        ct.font = "9px sans-serif";
                        ct.fillStyle = "white";
                        ct.fillText(o.Name, -parseInt(nw / 2), nl); // Name
                        if (dl > 0)
                            ct.fillText(toMetric(range), -parseInt(ndt / 2), dl); // Distance
                    }

                    // Distance From Base
                    if (plane > 0) {
                        DrawLine(ct, 0, 0, 0, -plane, 1, "rgba(100, 100, 255, .8)");
                        DrawDot(ct, 2, 0, -plane, "rgba(100, 100, 255, .6)");
                    }

                    //ct.translate(-xi, -(yi + plane));
                    //ct.translate(center.x, center.y);

                } else {

                    ipy = 500;

                    ts = 36;

                    if (o.Faction === focusedObject.Faction)
                        ipx = 100;
                    else if (IsEnemyFaction(o))
                        ipx = 200;
                    else
                        ipx = 300;

                    //ct.translate(-center.x, -center.y);

                    rot = DegreesToRadians(AngleBetweenVectors(focusedObject.Position, o.Position) + 90);
                    if (rot > 360)
                        rot -= 360;
                    ct.rotate(rot);
                    ct.drawImage(icons, ipx, ipy, 100, 100, -(ts / 2), -(ct.canvas.height / 2) - 2, ts, ts);
                    //ct.rotate(-rot);
                    //ct.drawImage(cmp, -(compheight / 2), -(compheight / 2), compheight, compheight);

                    //var inset = 0;
                    //var itt = Intersect(inset, inset, ct.canvas.width, inset, center.x, center.y, center.x + xi, center.y + yi); // Top
                    //var itb = Intersect(inset, ct.canvas.height, ct.canvas.width, ct.canvas.height, center.x, center.y, center.x + xi, center.y + yi); // Bottom
                    //var itl = Intersect(inset, inset, inset, ct.canvas.height, center.x, center.y, center.x + xi, center.y + yi); // Left
                    //var itr = Intersect(ct.canvas.width, inset, ct.canvas.width, ct.canvas.height, center.x, center.y, center.x + xi, center.y + yi); // Right

                    //if (IsEnemyFaction(o)) ct.fillStyle = "#ff0000";

                    //if (typeof itt !== "undefined") {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itt.x, itt.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //} else if (itb) {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itb.x, itb.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //} else if (itl) {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itl.x, itl.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //} else if (itr) {
                    //    ct.width = 3;
                    //    ct.beginPath();
                    //    ct.arc(itr.x, itr.y, 5, 0, fullCircle, true);
                    //    ct.fill();
                    //    ct.closePath();
                    //}
                }

            }
        } catch (err) {
            console.log("Radar.DrawObject: " + err.message);
        }
        ct.restore();
    }

    function DrawCompass() {
        ct.save();
        try {
            var rot = DegreesToRadians(focusedObject.Orientation.X);
            var arrowSize = 24;
            var pad = 8;
            var compheight = ct.canvas.height - (pad * 2);
            var comphalf = compheight / 2;

            // Compass
            //ct.rotate(rot);
            ct.drawImage(cmp, -comphalf, -comphalf, compheight, compheight);

            // Heading Arrow
            ct.rotate(rot);
            ct.drawImage(cmpa, -6, -comphalf + (arrowSize) - 6, arrowSize, arrowSize);

        } catch (err) {
            console.log("Radar.DrawCompass: " + err.message);
        }
        ct.restore();
    }

    function DrawGrid(gridSize, sections, mode) {
        try {
            if (typeof gridSize === "undefined")
                gridSize = 100000;

            if (typeof sections === "undefined")
                sections = 20;

            if (typeof mode == "undefined")
                mode = "Local";

            if (typeof sectors == "undefined")
                sectors = false;

            var gs = gridSize * localscale * zoom;
            var ox;
            var oy;
            var top = -parseInt(ct.canvas.height / 2);
            var bottom = parseInt(ct.canvas.height / 2);
            var left = -parseInt(ct.canvas.width / 2);
            var right = parseInt(ct.canvas.width / 2);
            var toff = Math.ceil(gs / 2);

            // Find Top Left Map Coords
            switch (mode) {
                case "Galactic":
                    ox = 0; //gridoffset.x - center.x;
                    oy = 0; //gridoffset.y - center.y;
                    top += viewcenter.Z * zoom;
                    bottom += viewcenter.Z * zoom;
                    left += viewcenter.X * zoom;
                    right += viewcenter.X * zoom;
                    sectors = true;
                    break;
                default:
                    ox = gridoffset.x - center.x;
                    oy = gridoffset.y - center.y;
                    break;
            }

            // Columns
            for (var c = -sections; c < sections; c++) {
                var cp = ox + gs * c;
                if (cp < left || cp > right)
                    continue;

                ct.lineWidth = 1;
                ct.strokeStyle = 'rgba(0, 0, 200, .5)';
                ct.beginPath();
                ct.moveTo(cp, top);
                ct.lineTo(cp, bottom);
                ct.stroke();
                ct.closePath();

                //console.log("Column: " + cp);
            }

            // Rows
            for (var r = -sections; r < sections; r++) {
                var rp = oy + gs * r;
                if (rp < top || rp > bottom)
                    continue;

                ct.lineWidth = 1;
                ct.strokeStyle = 'rgba(0, 0, 200, .5)';
                ct.beginPath();
                ct.moveTo(left, rp);
                ct.lineTo(right, rp);
                ct.stroke();
                ct.closePath();

                //console.log("Row: " + cp);
            }

            // Sector Labels?
            if (sectors) {
                var cc = 0;
                ct.font = "bold " + (30 * zoom) + "px Arial";
                ct.fillStyle = "rgba(150, 150, 150, .1)";

                // Columns
                for (var c = -sections; c < sections; c++) {
                    var cp = ox + gs * c;
                    //if (cp < left || cp > right)
                    //    continue;

                    cc++;
                    var cn = String.fromCharCode(64 + cc);
                    var rc = 0;

                    // Rows
                    for (var r = -sections; r < sections; r++) {
                        var rp = oy + gs * r;
                        //if (rp < top || rp > bottom)
                        //    continue;

                        rc++;

                        var sl = cn + rc;
                        var fs = ct.measureText(sl)

                        ct.fillText(sl, cp + toff - Math.ceil(fs.width / 2), rp + toff + Math.ceil(fs.actualBoundingBoxAscent / 2)); // Name
                    }
                }
            }

        } catch (err) {

        }
    }

    function DrawWeaponArcs() {
        ct.save();
        try {
            //ct.translate(center.x, center.y);
            //if (!rotated)
            ct.rotate(DegreesToRadians(focusedObject.Orientation.X));

            var rld = 35000 * localscale * zoom;
            ct.lineWidth = 1;
            ct.strokeStyle = 'darkblue';
            ct.beginPath();
            ct.moveTo(0, 0);
            ct.lineTo(-rld, -rld);
            ct.moveTo(0, 0);
            ct.lineTo(rld, -rld);
            ct.stroke();
            ct.closePath();
            ct.beginPath();
            ct.strokeStyle = '#000033';
            ct.moveTo(0, 0);
            ct.lineTo(rld, rld);
            ct.moveTo(0, 0);
            ct.lineTo(-rld, rld);
            ct.stroke();
            ct.closePath();

            ct.moveTo(0, 0);
            ct.strokeStyle = 'darkblue';
            // 100km
            ct.beginPath();
            ct.arc(0, 0, rld * 1.41, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();
            // 40km
            rld *= .43;
            ct.beginPath();
            ct.arc(0, 0, rld * 1.41, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();

            ct.restore();
        } catch (err) {
            console.log("Radar.DrawWeaponArcs: " + err.message);
        }
        ct.restore();
    }

    function CheckLocalSelection(e) {
        try {
            if (typeof contacts === "undefined") return;

            var coords = GetEventCoords($this, e);
            var offset = { x: 0, y: 0 };
            var closestobject;
            var closerange = 1000000;

            for (var c in contacts) {
                try {
                    var v = contacts[c];

                    if (v.Planet !== currentPlanet) 
                        continue;

                    var po = getOffset(focusedObject.Position, v.Position);
                    var plane = 0;

                    if (T3dView)
                        plane = v.Relative.Y * 60;

                    var xi = center.x + ((po.X * localscale) * zoom);
                    var yi = center.y + plane + ((po.Z * localscale) * zoom);
                    var radius = 20 + (4 - zoom) * 3;

                    if (v.BaseType === "Planet")
                        radius = (1.7 * (v.Scale * .006)) * zoom;
                    var range = GetDistance2(xi, yi, coords.x, coords.y);

                    if (range <= radius && range < closerange) {
                        closerange = range;
                        closestobject = v;
                    }

                    // Player?
                    var prange = GetDistance2(center.x, center.y, coords.x, coords.y);
                    if (prange <= 30 && prange < closerange) {
                        closestobject = focusedObject;
                    }
                } catch (err) {
                    console.log("Radar.MouseDown.Contact: " + err.message);
                }
            }

            if (typeof closestobject !== "undefined") {
                CloseInfo();
                PlayClickSound();

                if (closestobject.ID === 0) {
                    if (selectedLocal !== closestobject.Name)
                        selectedLocal = closestobject.Name;
                    else
                        selectedLocal = "";
                    ObjectSelected(selectedLocal);
                } else {
                    if (selectedLocal !== closestobject.ID)
                        selectedLocal = closestobject.ID;
                    else
                        selectedLocal = -1;
                    ObjectSelected(selectedLocal);
                }
            } else {
                CloseInfo();
            }
        } catch (err) {
            console.log("Radar.CheckLocalSelection: " + err.message);
        }
    }

    // System Map Functions

    function RenderSystem() {
        try {
            //if (!$this.is(':visible')) return;
            var center = { x: 0, y: 0 };
            var offset = { x: 0, y: 0 };
            var reticleSize = 36;
            var reticleScale = reticleSize * 1; //mapZoom
            var reticleHalf = reticleScale / 2;
            var size = 10;
            var moving = false;

            // Clear
            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();
            ct.save();

            if (typeof starSystem === "undefined")
                return;

            if (lastSystem !== starSystem) {
                lastSystem = starSystem;
                SetZoom(1);

                if (starSystem.Class !== starclass) {
                    starclass = starSystem.Class.toLowerCase();
                    starol.src = "/images/star-" + starclass + ".png";
                }
            }

            center.x = Math.ceil(ct.canvas.width / 2);
            center.y = Math.ceil(ct.canvas.height / 2);

            var bgsize = Clamp(800 * zoom * 2, 800, 6400);
            //$this.css("background-image", "url('/images/nebula.png')");
            $this.css("background-position", center.x + "px " + center.y + "px");
            $this.css("background-size", bgsize + "px " + bgsize + "px");

            //if (thisvessel.Speed > 0 && galacticinfo.System !== "" && galacticinfo.Planet === "") {
            moving = true;
            //}

            // Info
            // Labels
            //ct.fillStyle = "DarkGrey";
            //ct.font = "bold 14px sans-serif";
            //ct.fillText("Galaxy:", 12, 36);
            //ct.fillText("System:", 12, 56);

            //// Data
            //ct.fillStyle = "White";
            //ct.font = "14px sans-serif";
            //ct.fillText(starSystem.Name, 100, 56);

            var maxrange = center.x > center.y ? center.y - 10 : center.x - 10;
            if (maxrange < 0)
                maxrange = 0;
            var farthest = 0;

            // Find Farthest Planet
            for (var fi in starSystem.Planets) {
                var fp = starSystem.Planets[fi];
                if (fp.OrbitalDistance > farthest) farthest = starSystem.Planets[fi].OrbitalDistance;
            }

            var localscale = (maxrange / farthest) * zoom;

            // Habitable Zone
            ct.globalAlpha = 0.07;
            var hzz = 1.55; // Constant
            var hod = (starSystem.HabitableZone.X / farthest) * maxrange * zoom * hzz;
            var hw = ((starSystem.HabitableZone.Y - starSystem.HabitableZone.X) / farthest) * maxrange * zoom * hzz;
            ct.strokeStyle = "rgb(10,255,10)";
            ct.lineWidth = hw;
            ct.beginPath();
            ct.arc(center.x, center.y, hod, 0, fullCircle, true); //(Math.PI / 180) * 0
            ct.stroke();
            ct.closePath();
            ct.globalAlpha = 1;

            // Orbital Path
            ct.strokeStyle = "rgb(75, 75, 75, .4)";
            ct.lineWidth = 2;
            for (var i in starSystem.Planets) {
                var p = starSystem.Planets[i];
                var od = (p.OrbitalDistance / farthest) * maxrange * zoom;
                ct.beginPath();
                ct.arc(center.x, center.y, od, 0, fullCircle, true); //(Math.PI / 180) * 0
                ct.stroke();
                ct.closePath();
            }

            // Reticle Rotation?
            reticleRotation += 2;
            if (reticleRotation > 360) reticleRotation -= 360;
            var rot = DegreesToRadians(reticleRotation);

            // Scan Data?
            if (typeof systemScanResults !== "undefined") {
                // Labels
                ct.drawImage(energy, 0, 0, 256, 256, ct.canvas.width - 320, 20, 40, 40);
                ct.fillStyle = "White";
                ct.font = "18px sans-serif";
                ct.fillText("Energy Reading Detected", ct.canvas.width - 275, 40);

                for (var si in systemScanResults) {
                    var r = systemScanResults[si];

                    if (r.ScanDetail.length === 0) {
                        //$("#scan-levels").hide();
                        //list = "<div class='Reading centered'>Scan Was Inconclusive</div>";
                    } else if (r.ScanDetail.length > 0 && typeof r.ScanDetail[0].Range !== "undefined") {
                        //$("#scan-levels").hide();
                        //list = "<div class='Reading centered'>Detailed scans are ineffective beyond 600km</div>";
                    } else {
                        // Energy Reading
                        var roffset = { x: 0, y: 0 };
                        roffset.x = parseInt((r.Position.X * localscale) + center.x);
                        roffset.y = parseInt((r.Position.Z * localscale) + center.y);
                        ct.save();
                        ct.translate(roffset.x, roffset.y);
                        ct.rotate(-rot);
                        ct.drawImage(energy, -40, -40, 80, 80);
                        ct.restore();

                        //ct.fillStyle = "white";
                        //ct.lineWidth = 4;
                        //ct.beginPath();
                        //ct.arc(roffset.x, roffset.y, 20, 0, fullCircle, true); 
                        ////ct.fill();
                        //ct.stroke();
                        //ct.closePath();

                        //for (var i in systemScanResults.ScanDetail) {
                        //    var r = systemScanResults.ScanDetail[i];

                        //}
                    }
                }
            }

            // Planets / Belts
            for (var pi in starSystem.Planets) {
                var planet = starSystem.Planets[pi];
                var pod = (planet.OrbitalDistance / farthest) * maxrange * zoom;
                var op = DegreesToRadians(planet.OrbitalPosition - 90);
                var ot = planet.OrbitalPeriod;
                var poffset = { x: 0, y: 0 };

                poffset.x = center.x + (pod * Math.cos(op));
                poffset.y = center.y + (pod * Math.sin(op));
                planet.offset = { x: poffset.x, y: poffset.y };

                size = 6;
                ct.font = "12px sans-serif";
                ct.width = 2;
                ct.fillStyle = "rgb(" + planet.Color.R + ", " + planet.Color.G + ", " + planet.Color.B + ")";

                // Planet
                ct.beginPath();
                ct.arc(poffset.x, poffset.y, size, 0, fullCircle, true);  //(Math.PI / 180) * 0
                ct.fill();
                ct.closePath();

                // Name
                var nm = planet.Name;
                var textwidth = ct.measureText(nm).width;
                //var norm = Normalize2P(center, offset);

                var xrel = offset.x / ct.canvas.width;
                var xpos = offset.x + 10;  // Right Side
                //if (offset.x + ct.measureText(planet.Name).width > ct.width) offset.x -= textwidth - 20;

                //xpos.x = offset.x + norm.x * 10;
                //xpos.y = offset.y + norm.y * 10;

                if (xrel <= .5) {
                    // Left Side
                    xpos = poffset.x - textwidth - 10;
                    if (xpos < 0) {
                        // Switch To Right Side
                        xpos = poffset.x + 10;
                    }

                } else {
                    // Right Side
                    xpos = poffset.x + 10;
                    if (xpos + textwidth > ct.canvas.width) {
                        // Switch To Left Side
                        xpos = poffset.x - textwidth - 10;
                    }
                }

                ct.fillStyle = "White";
                ct.fillText(planet.Name, xpos, poffset.y);
            }

            // Star
            size = 10;
            ct.fillStyle = "rgb(" + starSystem.Color.R + ", " + starSystem.Color.G + ", " + starSystem.Color.B + ")";
            ct.beginPath();
            ct.arc(center.x, center.y, size, 0, fullCircle, true); //(Math.PI / 180) * 0
            ct.fill();
            ct.closePath();

            // Overlay
            ct.drawImage(starol, center.x - 10, center.y - 10, 20, 20);

            //ct.fillText(starSystem.Name, xi + 15, yi + 5); 

            if (typeof focusedObject !== "undefined" && typeof focusedObject.StarPosition !== "undefined" && galacticinfo.System === starSystem.Name) {

                // Updates For Smooth Rendering
                UpdateObjectMovement(focusedObject);

                var scl = 11.47;
                var sroffset = { x: 0, y: 0 };
                sroffset.x = parseInt((focusedObject.StarPosition.X * localscale) + center.x);
                sroffset.y = parseInt((focusedObject.StarPosition.Z * localscale) + center.y);
                ct.translate(sroffset.x, sroffset.y);

                if (moving) {
                    var ts = 30; // * radarZoom;
                    if (ts < 12) ts = 12;
                    var tl = -(ts / 2);
                    DrawVessel(ts, tl);
                } else {
                    ct.rotate(rot);
                    ct.drawImage(reticle, -reticleHalf, -reticleHalf, reticleScale, reticleScale);
                }
            }

            ct.restore();

        } catch (err) {
            console.log("Radar.RenderSystem: " + err.message);
        }
    }

    function CheckSystemSelection(e) {
        try {
            var coords = GetEventCoords($this, e);
            var radius = 50; //mapZoom * 30;
            if (siText === "")
                siText = hf_PlanetInfo;
            var closestobject;
            var closerange = 1000000;

            for (var i in starSystem.Planets) {
                var ps = starSystem.Planets[i];

                var range = GetDistance2(ps.offset.x, ps.offset.y, coords.x, coords.y);

                if (range <= radius && range < closerange) {
                    closerange = range;
                    closestobject = ps;
                }
            }

            if (typeof closestobject !== "undefined") {
                PlayClickSound();

                var w = 175;
                var t = closestobject.offset.y - 0;
                var l = closestobject.offset.x + 15;

                //if ((l + w) > w_width) l = (ps.offset.x - 30 - w);

                var style = "width: " + w + "px; height: auto;top: " + t + "px;left: " + l + "px";
                var si = siText;
                si = replaceAll(si, "[Style]", style);
                si = replaceAll(si, "[Name]", closestobject.Name);
                si = replaceAll(si, "[Class]", replaceAll(closestobject.Class, "_", " "));
                si = replaceAll(si, "[Planets]", closestobject.Moons);
                si = replaceAll(si, "[Distance]", GetDistance(focusedObject.GalacticPosition, closestobject.Position) + " Lightyears");
                si = replaceAll(si, "[Explored]", closestobject.Explored === true ? "Yes" : "No");

                CloseInfo();
                $("body", window.top.document).append(si);
            } else {
                CloseInfo();
            }
        } catch (err) {
            console.log("Radar.CheckSytemSelection: " + err.message);
        }
    }

    // Galactic Map Functions

    function RenderGalatic() {
        try {
            if (typeof currentMap === "undefined")
                return;
            if (typeof focusedObject.GalacticPosition !== "undefined" && typeof viewcenter === "undefined")
                viewcenter.X = focusedObject.GalacticPosition.X;

            // Locals
            var center = { x: 0, y: 0 };
            var offset = { x: 0, y: 0 };
            var reticleSize = 12;
            var reticleScale = reticleSize * zoom;
            var reticleHalf = reticleScale / 2;
            var moving = false;

            ct.save();
            //Clear
            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();

            center.x = Math.ceil(ct.canvas.width / 2);
            center.y = Math.ceil(ct.canvas.height / 2);

            if (typeof lastPosition === "undefined") {
                lastPosition.X = focusedObject.GalacticPosition.X;
                lastPosition.Z = focusedObject.GalacticPosition.Z;
            }

            if (typeof focusedObject.GalacticPosition !== "undefined" && lastPosition.X !== focusedObject.GalacticPosition.X && lastPosition.Z !== focusedObject.GalacticPosition.Z) {
                viewcenter.X = focusedObject.GalacticPosition.X;
                viewcenter.Z = focusedObject.GalacticPosition.Z;
                lastPosition.X = focusedObject.GalacticPosition.X;
                lastPosition.Z = focusedObject.GalacticPosition.Z;
                //    moving = true;
            }

            //if (thisvessel.Speed > 0 && galacticinfo.System === "") {
            moving = true;
            //}

            if (typeof viewcenter !== "undefined") {
                center.x -= viewcenter.X * zoom;
                center.y -= viewcenter.Z * zoom;
            }

            ct.setTransform(1, 0, 0, 1, center.x, center.y);
            var storedTransform = ct.getTransform();

            // Grid
            var go = getOffset(focusedObject.GalacticPosition, { X: 0, Y: 0, Z: 0 });
            gridoffset.x = parseInt(center.x + (go.X * localgridscale * zoom));
            gridoffset.y = parseInt(center.y + (go.Z * localgridscale * zoom));

            var bgsize = Clamp(800 * zoom, 800, 6400);
            //$this.css("background-image", "url('/images/nebula.png')");
            $this.css("background-position", center.x + "px " + center.y + "px");
            $this.css("background-size", bgsize + "px " + bgsize + "px");

            // Factions
            for (var si in currentMap.Systems) {
                var ssi = currentMap.Systems[si];
                var fsize = 1.5;

                fsize += ssi.Planets * .05;
                fsize *= zoom / 2;

                offset.x = (ssi.Position.X * zoom); // + center.x;
                offset.y = (ssi.Position.Z * zoom); // + center.y;
                ssi.offset = { x: offset.x, y: offset.y };

                // Render Faction?
                if (ssi.Faction !== "") {
                    DrawCircle(ct,
                        offset.x,
                        offset.y,
                        fsize * 10,
                        "rgba(" + factions[ssi.Faction].Color.R / 2 + ", " + factions[ssi.Faction].Color.G / 2 + ", " + factions[ssi.Faction].Color.B / 2 + ", 1)"
                    );
                }

            }

            DrawGrid(10000, 4, "Galactic");

            // Label Settings
            ct.font = "12px sans-serif";
            ct.strokeStyle = "rgb(50,50,50)";
            ct.width = 1;

            // Systems
            for (var i in currentMap.Systems) {
                var ss = currentMap.Systems[i];
                var size = .5;

                size += ss.Planets * .05;
                size *= zoom / 2;

                offset.x = (ss.Position.X * zoom); //+ center.x;
                offset.y = (ss.Position.Z * zoom);// + center.y;
                ss.offset = { x: offset.x, y: offset.y };

                // Render Star
                //DrawCircle(ct, offset.x, offset.y, size * 1.5, "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", .25)");
                var color = "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", .5)";
                DrawCircle(ct,
                    offset.x,
                    offset.y,
                    size,
                    "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", 1)",
                    size * .6,
                    "rgba(" + ss.Color.R + ", " + ss.Color.G + ", " + ss.Color.B + ", .5)"
                );
                //DrawCircle(ct, offset.x, offset.y, size * 1, color);
                //DrawCircle(ct, offset.x, offset.y, size * .75, color);
                //Star
                //var stsz = size * 3; //Star 1

                //if (ss.Selected) {
                //    ct.beginPath();
                //    ct.arc(offset.x, offset.y, size * 5, 0, circ, true);
                //    ct.stroke();
                //    ct.closePath();
                //    //ct.fillText(ss.Name, offset.x + 10, offset.y + 4);
                //}

                if (galacticinfo.System === ss.Name) {
                    ct.fillStyle = "white";
                    ct.fillText(ss.Name, offset.x + (4 * zoom), offset.y + 4);
                }
                //ct.fillRect(offset.x, offset.y, size, size);
            }

            // Mission Waypoint(s)
            //if (missionWaypoints != undefined) {
            //    for (var m in missionWaypoints) {
            //        var mw = missionWaypoints[mw];

            //    }
            //}

            // Vessel Waypoint(s)
            //if (vesselWaypoints != undefined) {
            //    for (var v in vesselWaypoints) {
            //        var vw = vesselWaypoints[vw];

            //    }
            //}

            // Our Position
            if (typeof focusedObject.GalacticPosition !== "undefined") {

                // Updates For Smooth Rendering
                UpdateObjectMovement(focusedObject);

                reticleRotation += 2;
                if (reticleRotation > 360) reticleRotation -= 360;
                var rot = DegreesToRadians(reticleRotation);
                var roffset = { x: 0, y: 0 };
                roffset.x = parseInt((focusedObject.GalacticPosition.X * zoom)); // + center.x);
                roffset.y = parseInt((focusedObject.GalacticPosition.Z * zoom)); // + center.y);
                ct.translate(roffset.x, roffset.y);
                //ct.rotate(rot);
                if (moving) {
                    var ts = 30; // * radarZoom;
                    if (ts < 12) ts = 12;
                    var tl = -(ts / 2);
                    DrawVessel(ts, tl);
                } else {
                    ct.drawImage(reticle, -reticleHalf, -reticleHalf, reticleScale, reticleScale);
                }
            }

            ct.restore();

            //if (mousestart != undefined) {
            //    ct.fillStyle = "white";
            //    ct.fillText("X:" + mousestart.x, -80, -80);
            //}
        } catch (err) {
            console.log("Radar.RenderGalactic: " + err.message);
        }
    }

    function CheckGalacticSelection(e) {
        //if (dragging) {
        //    dragging = false;
        //    return;
        //}
        var coords = GetEventCoords($this, e);
        var radius = 10; // (10 - mapZoom) * 10;
        var closestobject;
        var closerange = 1000;

        if (giText === "")
            giText = hf_StellarInfo;

        var clickOffset = {
            "x": ct.canvas.width / 2 - viewcenter.X * zoom,
            "y": ct.canvas.height / 2 - viewcenter.Z * zoom
        };

        for (var i in currentMap.Systems) {
            var ss = currentMap.Systems[i];
            var range = GetDistance2(clickOffset.x + ss.offset.x, clickOffset.y + ss.offset.y, coords.x, coords.y) / zoom;
            //var range = GetDistance2(ss.offset.x, ss.offset.y, coords.x, coords.y) / zoom;

            if (range <= radius && range < closerange) {
                closerange = range;
                closestobject = ss;
            }
        }

        if (typeof closestobject !== "undefined") {
            PlayClickSound();

            var w = 175;
            var t = parseInt(clickOffset.y + closestobject.offset.y - 0);
            var l = parseInt(clickOffset.x + closestobject.offset.x + 30);

            if (t < ct.canvas.scrollTop + 30) {
                t = ct.canvas.scrollTop + 30;
            } else if (t + 125 > ct.canvas.scrollTop + ct.canvas.scrollHeight) {
                t -= 125;
            }

            if ((l + w) > w_width) l = (closestobject.offset.x - 30 - w);

            var style = "width: " + w + "px; height: auto;top: " + t + "px;left: " + l + "px";
            var si = giText;
            si = replaceAll(si, "[Style]", style);
            si = replaceAll(si, "[Name]", closestobject.Name);
            si = replaceAll(si, "[Class]", closestobject.Class);
            si = replaceAll(si, "[Planets]", closestobject.Planets);
            si = replaceAll(si, "[Distance]", GetDistanceLY(focusedObject.GalacticPosition, closestobject.Position));
            si = replaceAll(si, "[Explored]", closestobject.Explored === true ? "Yes" : "No");

            CloseInfo();
            $("body", window.top.document).append(si);
        } else {
            CloseInfo();
        }
    }

    // Scanning Functions

    function DrawPING() {
        try {
            // Ring
            //ct.translate(center.x, center.y);
            //if (!rotated) ct.rotate(DegreesToRadians(spacialData.Yaw));

            var arld = 210000 * localscale * zoom;
            ct.lineWidth = 1;
            ct.strokeStyle = 'darkblue';

            //ct.moveTo(0, 0); //center.x, center.y);
            // 200km
            ct.beginPath();
            ct.arc(0, 0, arld * 1.41, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();

            ct.restore();

            scanningPing += 13 * ElapsedMilliseconds(lastPing);
            lastPing = new Date();

            if (scanningPing > 300000)
                scanningPing = 5;

            if (scanningPing === 5 && typeof snd_ping !== "undefined")
                snd_ping.Play();

            //ct.moveTo(center.x, center.y);
            ct.lineWidth = 4;
            ct.strokeStyle = '#101010';
            var rld = scanningPing * localscale * zoom;
            ct.beginPath();
            ct.arc(0, 0, rld, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();
        } catch (err) {
            console.log("ScanningDisplay.DrawPING", err.message);
        }
    }

    // Relative Radar Functions

    function DrawDot(ct, width, x, y, color) {
        try {
            ct.fillStyle = color;
            ct.width = width;
            ct.beginPath();
            ct.arc(x, y, width, 0, fullCircle, true);
            ct.fill();
            ct.closePath();
        } catch (err) {
            console.log("Radar.DrawDot: " + err.message);
        }
    }

};

// Star System Map
jQuery.fn.SystemMap = function (siText) {
    var $this = $(this);
    var mapProcessing = false;
    var starol = new Image();
    var reticle = new Image();
    var energy = new Image();
    var reticleRotation = 0;
    var starclass = "g";

    //starol.src = "/images/star-g.png";
    reticle.src = "/images/reticle.png";
    energy.src = "/images/energy.png";

    if (typeof siText === "undefined") siText = hf_PlanetarySystemInfo;

    var cv;
    var ct;
    cv = $this;
    ct = cv[0].getContext("2d");
    cv[0].height = $this.height();
    cv[0].width = $this.width();

    Render();

    $this.on("mousedown touchstart", function (e) {
        $("#planetarysystem-detail", window.top.document).remove();

        var coords = GetEventCoords($this, e);
        var radius = 50; //mapZoom * 30;
        if (siText === "") siText = hf_PlanetarySystemInfo;
        var closestobject;
        var closerange = 1000000;

        //$("#CurrentSystem").text("");
        for (var i in starSystem.Planets) {
            var ps = starSystem.Planets[i];

            var range = GetDistance2(ps.offset.x, ps.offset.y, coords.x, coords.y);

            if (range <= radius && range < closerange) {
                closerange = range;
                closestobject = ps;
            }
        }

        if (typeof closestobject !== "undefined") {
            PlayClickSound();

            var w = 175;
            var t = closestobject.offset.y - 0;
            var l = closestobject.offset.x + 15;

            //if ((l + w) > w_width) l = (ps.offset.x - 30 - w);

            var style = "width: " + w + "px; height: auto;top: " + t + "px;left: " + l + "px";
            var si = siText;
            si = replaceAll(si, "[Style]", style);
            si = replaceAll(si, "[Name]", closestobject.Name);
            si = replaceAll(si, "[Class]", replaceAll(closestobject.Class, "_", " "));
            si = replaceAll(si, "[Planets]", closestobject.Moons);
            si = replaceAll(si, "[Distance]", "- Lightyears");
            si = replaceAll(si, "[Explored]", closestobject.Explored === true ? "Yes" : "No");

            $("body", window.top.document).append(si);
        }

    });

    $this.on("onResize", function (e) {
        ResetSize();
    });

    function ResetSize() {
        ct.canvas.width = $this.width();
        ct.canvas.height = $this.height();
    }

    function Render() {
        RenderSystemMap();
        requestAnimationFrame(Render);
    }

    function RenderSystemMap() {
        if (!$this.is(':visible')) return;

        var w = $this.width();
        var h = $this.height();
        var center = { x: 0, y: 0 };
        var offset = { x: 0, y: 0 };
        var reticleSize = 36;
        var reticleScale = reticleSize * 1; //mapZoom
        var reticleHalf = reticleScale / 2;
        var size = 10;
        
        //Clear
        //ct.canvas.width = ct.canvas.width;
        ct.canvas.width = $this.width();
        ct.canvas.height = $this.height();
        ct.save();

        if (typeof starSystem === "undefined") return;

        if (starSystem.Class !== starclass) {
            starclass = starSystem.Class.toLowerCase();
            starol.src = "/images/star-" + starclass + ".png";
        }

        center.x = Math.ceil(ct.canvas.width / 2);
        center.y = Math.ceil(ct.canvas.height / 2);

        $this.css("background-position", center.x + "px " + center.y + "px");
        $this.css("background-size", (800 * mapZoom) + "px " + (800 * mapZoom) + "px");

        // Info
        // Labels
        //ct.fillStyle = "DarkGrey";
        //ct.font = "bold 14px sans-serif";
        //ct.fillText("Galaxy:", 12, 36);
        //ct.fillText("System:", 12, 56);

        //// Data
        //ct.fillStyle = "White";
        //ct.font = "14px sans-serif";
        //ct.fillText(starSystem.Name, 100, 56);

        var maxrange = center.x > center.y ? center.y - 10 : center.x - 10;
        var farthest = 0;

        // Find Farthest Planet
        for (var fi in starSystem.Planets) {
            var fp = starSystem.Planets[fi];
            if (fp.OrbitalDistance > farthest) farthest = starSystem.Planets[fi].OrbitalDistance;
        }

        var localscale = (maxrange / farthest) * mapZoom;

        // Habitable Zone
        ct.globalAlpha = 0.07;
        var hzz = 1.55; // Constant
        var hod = (starSystem.HabitableZone.X / farthest) * maxrange * mapZoom * hzz;
        var hw = ((starSystem.HabitableZone.Y - starSystem.HabitableZone.X) / farthest) * maxrange * mapZoom * hzz;
        ct.strokeStyle = "rgb(10,255,10)";
        ct.lineWidth = hw;
        ct.beginPath();
        ct.arc(center.x, center.y, hod, 0, fullCircle, true); //(Math.PI / 180) * 0
        ct.stroke();
        ct.closePath();
        ct.globalAlpha = 1;

        // Orbital Path
        ct.strokeStyle = "rgb(75,75,75)";
        ct.lineWidth = 2;
        for (var i in starSystem.Planets) {
            var p = starSystem.Planets[i];
            var od = (p.OrbitalDistance / farthest) * maxrange * mapZoom;
            ct.beginPath();
            ct.arc(center.x, center.y, od, 0, fullCircle, true); //(Math.PI / 180) * 0
            ct.stroke();
            ct.closePath();
        }

        // Reticle Rotation?
        reticleRotation += 2;
        if (reticleRotation > 360) reticleRotation -= 360;
        var rot = DegreesToRadians(reticleRotation);

        // Scan Data?
        if (typeof systemScanResults !== "undefined") {
            // Labels
            ct.drawImage(energy, 0, 0, 256, 256, ct.canvas.width - 320, 20, 40, 40);
            ct.fillStyle = "White";
            ct.font = "18px sans-serif";
            ct.fillText("Energy Reading Detected", ct.canvas.width - 275, 40);

            for (var si in systemScanResults) {
                var r = systemScanResults[si];

                if (r.ScanDetail.length === 0) {
                    //$("#scan-levels").hide();
                    //list = "<div class='Reading centered'>Scan Was Inconclusive</div>";
                } else if (r.ScanDetail.length > 0 && typeof r.ScanDetail[0].Range !== "undefined") {
                    //$("#scan-levels").hide();
                    //list = "<div class='Reading centered'>Detailed scans are ineffective beyond 600km</div>";
                } else {
                    // Energy Reading
                    var roffset = { x: 0, y: 0 };
                    roffset.x = parseInt((r.Position.X * localscale) + center.x);
                    roffset.y = parseInt((r.Position.Z * localscale) + center.y);
                    ct.save();
                    ct.translate(roffset.x, roffset.y);
                    ct.rotate(-rot);
                    ct.drawImage(energy, -40, -40, 80, 80);
                    ct.restore();
                    
                    //ct.fillStyle = "white";
                    //ct.lineWidth = 4;
                    //ct.beginPath();
                    //ct.arc(roffset.x, roffset.y, 20, 0, fullCircle, true); 
                    ////ct.fill();
                    //ct.stroke();
                    //ct.closePath();

                    //for (var i in systemScanResults.ScanDetail) {
                    //    var r = systemScanResults.ScanDetail[i];

                    //}
                }
            }
        }

        // Planets / Belts
        for (var pi in starSystem.Planets) {
            var planet = starSystem.Planets[pi];
            var pod = (planet.OrbitalDistance / farthest) * maxrange * mapZoom;
            var op = DegreesToRadians(planet.OrbitalPosition - 90);
            var ot = planet.OrbitalPeriod;
            var poffset = { x: 0, y: 0 };

            poffset.x = center.x + (pod * Math.cos(op));
            poffset.y = center.y + (pod * Math.sin(op));
            planet.offset = { x: poffset.x, y: poffset.y };

            size = 6;
            ct.font = "12px sans-serif";
            ct.width = 2;
            ct.fillStyle = "rgb(" + planet.Color.R + ", " + planet.Color.G + ", " + planet.Color.B + ")";

            // Planet
            ct.beginPath();
            ct.arc(poffset.x, poffset.y, size, 0, fullCircle, true);  //(Math.PI / 180) * 0
            ct.fill();
            ct.closePath();

            // Name
            var nm = planet.Name;
            var textwidth = ct.measureText(nm).width;
            //var norm = Normalize2P(center, offset);
                
            var xrel = offset.x / ct.canvas.width;
            var xpos = offset.x + 10;  // Right Side
            //if (offset.x + ct.measureText(planet.Name).width > ct.width) offset.x -= textwidth - 20;

            //xpos.x = offset.x + norm.x * 10;
            //xpos.y = offset.y + norm.y * 10;

            if (xrel <= .5) {
                // Left Side
                xpos = poffset.x - textwidth - 10;
                if (xpos < 0) {
                    // Switch To Right Side
                    xpos = poffset.x + 10;
                }

            } else {
                // Right Side
                xpos = poffset.x + 10;
                if (xpos + textwidth > ct.canvas.width) {
                    // Switch To Left Side
                    xpos = poffset.x - textwidth - 10;
                }
            }

            ct.fillStyle = "White";
            ct.fillText(planet.Name, xpos, poffset.y);
        }

        // Star
        size = 10;
        ct.fillStyle = "rgb(" + starSystem.Color.R + ", " + starSystem.Color.G + ", " + starSystem.Color.B + ")";
        ct.beginPath();
        ct.arc(center.x, center.y, size, 0, fullCircle, true); //(Math.PI / 180) * 0
        ct.fill();
        ct.closePath();

        // Overlay
        ct.drawImage(starol, center.x - 10, center.y - 10, 20, 20);

        //ct.fillText(starSystem.Name, xi + 15, yi + 5); 

        if (typeof focusedObject.StarPosition !== "undefined" && galacticinfo.System === starSystem.Name) {
            var scl = 11.47;
            var sroffset = { x: 0, y: 0 };
            sroffset.x = parseInt((focusedObject.StarPosition.X * localscale) + center.x);
            sroffset.y = parseInt((focusedObject.StarPosition.Z * localscale) + center.y);
            ct.translate(sroffset.x, sroffset.y);
            ct.rotate(rot);
            ct.drawImage(reticle, -reticleHalf, -reticleHalf, reticleScale, reticleScale);
        }

        ct.restore();

    }

};

// Radar Canvas
jQuery.fn.RadarDisplay = function (isrotated, arcs) {
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d"); //, { alpha: false });
    var rotated = false;

    // Locals
    var lastzoom = 0;
    var maxzoom = 8;

    var center = { x: 0, y: 0 };
    var coords = { x: 0, y: 0 };
    var gridoffset = { x: 0, y: 0 };

    var gridsize = 200;
    var gridcells = { x: 0, y: 0 };
    var starsize = 1024;
    var starcells = { x: 0, y: 0 };
    var showtext = true;
    var lastmaneuver = "Cruise";
    var showarcs = typeof arcs !== "undefined" ? arcs : false;
    var localscale = .01;
    var localgridscale = .01;

    var explosions = Object.create(null);

    //if (isrotated != undefined) rotated = isrotated;

    // Load Images
    var bg = new Image();
    bg.src = "images/grid1.jpg";
    var stars = new Image();
    stars.src = "images/stars.jpg";

    var rvp = new Image();
    rvp.src = "images/rdr_vessel.png";
    var rm = new Image();
    rm.src = "images/radar_missile.png";
    var ft = new Image();
    ft.src = "images/lock-flight.png";
    var tt = new Image();
    tt.src = "images/lock-target.png";
    var gt = new Image();
    gt.src = "images/lock-gm.png";
    var rp = new Image();
    rp.src = "images/planet.png";
    var cmp = new Image();
    cmp.src = "images/compass.png";

    var icons = new Image();
    icons.src = "images/item-icons.png";

    // Set Canvas
    $this.css("background-image", "url(images/grid-s.png)");

    renderRadar();

    $this.on("mousedown", function (e) {
        var coords = GetEventCoords($this, e);

        CloseInfo();

        var offset = { x: 0, y: 0 };
        var closestobject;
        var closerange = 1000000;

        for (var c in contacts) {
            var v = contacts[c];
            var po = getOffset(thisvessel.Position, v.Position);
            var xi = (center.x) + ((po.X * localscale) * radarZoom);
            var yi = (center.y) + ((po.Z * localscale) * radarZoom);
            var radius = 20 + (4 - radarZoom) * 3;

            if (v.BaseType === "Planet") radius = (1.7 * (v.Scale * .006)) * radarZoom;
            //if (v.BaseType === "Planet") radius = (3.32 * (v.Scale * .006)) * radarZoom;
            var range = GetDistance2(xi, yi, coords.x, coords.y);

            if (range <= radius && range < closerange) {
                closerange = range;
                closestobject = v;
            }

            // Player?
            var prange = GetDistance2(center.x, center.y, coords.x, coords.y);
            if (prange <= 30 && prange < closerange) {
                closestobject = thisvessel;
            }
            //if (Math.abs(xi - coords.x) <= radius) {
            //    if (Math.abs(yi - coords.y) <= radius) {
            //        if (v.ID == 0) {
            //            ObjectSelected(v.Name);
            //        } else {
            //            ObjectSelected(v.ID);
            //        }
            //        return;
            //    }
            //}
        }

        if (typeof closestobject !== "undefined") {
            PlayClickSound();

            if (closestobject.ID === 0) {
                ObjectSelected(closestobject.Name);
            } else {
                ObjectSelected(closestobject.ID);
            }
        }

    });

    function renderRadar() {
        requestAnimationFrame(renderRadar);
        if (typeof thisvessel === "undefined") return;
        if (typeof contacts === "undefined") return;
        if (!$this.is(':visible')) return;

        try {
            if (comms === 1 && socketstatus === 0) { return; }

            if (lastzoom !== radarZoom) {
                if (radarZoom > maxzoom) radarZoom = maxzoom;
                lastzoom = radarZoom;
            }

            ct.canvas.width = cv.width();
            ct.canvas.height = cv.height();
            ct.clearRect(0, 0, cv.width, cv.height);
            ct.font = "9px sans-serif";
            //ct.fillStyle = "black";
            //ct.fillRect(0, 0, w_width, w_height);

            ct.fillStyle = "#aaffaa";
            ct.lineStyle = "#ffff00";
            //ct.translate(center.x, center.y);
            //ct.rotate(-DegreesToRadians(spacialData.Yaw));
            ct.save();

            center.x = Math.floor(ct.canvas.width / 2);
            center.y = Math.floor(ct.canvas.height / 2);

            // Offset
            var insize = 10000;
            var scaleX = (thisvessel.Position.X % insize) / insize;
            var scaleY = (thisvessel.Position.Y % insize) / insize;
            var rot = 0;
            var showtext = true;

            // Icon Sizing
            var ts = 30; // * radarZoom;
            if (ts < 12) ts = 12;
            var tl = parseInt(-(ts / 2));

            // Grid
            var go = getOffset(thisvessel.Position, { X: 0, Y: 0, Z: 0 });
            gridoffset.x = Math.floor(center.x + (go.X * localgridscale) * radarZoom);
            gridoffset.y = Math.floor(center.y + (go.Z * localgridscale) * radarZoom);

            // Draw Grid
            var dotwidth = 1000 * radarZoom;

            if (thisvessel.Maneuver === "FTL") {
                $this.css("background-image", "none");
            } else if (lastmaneuver === "FTL") {
                $this.css("background-image", "url(images/grid-s.png)");
            }
            lastmaneuver = thisvessel.Maneuver;

            $this.css("background-position", gridoffset.x + "px " + gridoffset.y + "px");
            $this.css("background-size", 2000 * radarZoom);

            // Draw Reticle
            if (showarcs) {
                ct.translate(center.x, center.y);
                if (!rotated) ct.rotate(DegreesToRadians(thisvessel.Orientation.X));

                var rld = parseInt(35000 * localscale * radarZoom);
                ct.lineWidth = 1;
                ct.strokeStyle = 'darkblue';
                ct.beginPath();
                ct.moveTo(0, 0);
                ct.lineTo(-rld, -rld);
                ct.moveTo(0, 0);
                ct.lineTo(rld, -rld);
                ct.stroke();
                ct.closePath();
                ct.beginPath();
                ct.strokeStyle = '#000033';
                ct.moveTo(0, 0);
                ct.lineTo(rld, rld);
                ct.moveTo(0, 0);
                ct.lineTo(-rld, rld);
                ct.stroke();
                ct.closePath();

                ct.moveTo(0, 0);
                ct.strokeStyle = 'darkblue';
                // 100km
                ct.beginPath();
                ct.arc(0, 0, Math.floor(rld * 1.41), 0, fullCircle, true);
                ct.stroke();
                ct.closePath();
                // 40km
                rld *= .43;
                ct.beginPath();
                ct.arc(0, 0, Math.floor(rld * 1.41), 0, fullCircle, true);
                ct.stroke();
                ct.closePath();

                ct.restore();
            }

            // Draw Contacts
            
            for (var c in contacts) {
                var v = contacts[c];

                if (typeof v.Name === "undefined") continue;
                if (typeof v.BaseType === "undefined") continue;

                var po = getOffset(thisvessel.Position, v.Position);
                var xi = Math.floor(center.x + ((po.X * localscale) * radarZoom));
                var yi = Math.floor(center.y + ((po.Z * localscale) * radarZoom));
                var ipx = 0;
                var ipy = 0;

                var below = false;
                rot = DegreesToRadians(v.Orientation.X);

                showtext = false;
                //if (rotated) {
                //ct.translate(center.x, center.y);
                //ct.rotate(-DegreesToRadians(spacialData.Yaw));
                //}

                if (po.Y < 0) below = true;

                if (v.Name !== "") {
                    var nw = ct.measureText(v.Name).width;
                    var range = 0;

                    showtext = false; //false

                    if (below)
                        ct.fillStyle = "#aaaaff";
                    else
                        ct.fillStyle = "#aaffaa";
                    if (v.ID === selectedid) ct.fillStyle = "#fff";

                    if (v.ID === selectedid || v.BaseType === "Planet") {
                        range = GetDistance(thisvessel.Position, v.Position);
                        if (v.BaseType === "Planet") range -= (v.Scale * scale);
                        if (range < 0) range = 0;
                    }

                    if (v.ID === selectedid) {
                        SetText("#target-intel-range", toMetric(range));
                        showtext = true;
                    }

                    if (v.BaseType === "Planet") {
                        var ps = (v.Scale * localscale * scale) * radarZoom * 2;
                        //var ps = (v.Scale * scale) * radarZoom;
                        var offs = Math.floor(ps / 2);
                        ipy = 75;

                        ct.drawImage(rp, xi - offs, yi - offs, ps, ps);
                        ct.fillText(v.Name, xi - Math.floor(nw / 2), yi + 4);
                        var nd = ct.measureText(toMetric(range)).width;
                        ct.fillText(toMetric(range), xi - Math.floor(nd / 2), yi + 16); // Distance
                    } else {
                        //continue;
                        if (InRect(xi, yi, 0, 0, ct.canvas.width, ct.canvas.height)) {
                            // On Screen
                            ct.translate(xi, yi);

                            // Target?
                            var tso = ts + 4;
                            var tro = Math.floor(-tso / 2);

                            if (v.ID === currenttargetid) {
                                ct.drawImage(tt, tro, tro, tso, tso);
                            }
                            if (v.ID === flighttargetid) {
                                ct.drawImage(ft, tro, tro, tso, tso);
                            }
                            if (v.ID === gmtargetid) {
                                ct.drawImage(gt, tro, tro, tso, tso);
                            }

                            // Scanning?
                            if (typeof scanningid !== "undefined") {
                                if (scanningid !== 0 && scanningid === v.ID) {
                                    //ct.width = 30;
                                    var rads = (Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 2)); // (Math.PI / 180) * 360;
                                    ct.strokeStyle = "green";
                                    ct.lineWidth = 4;
                                    ct.beginPath();
                                    ct.arc(0, 0, 20, 0, rads, true); //fullCircle
                                    ct.stroke();
                                    ct.closePath();
                                }
                            }

                            // Label
                            if (showtext === true) {
                                var ndt = ct.measureText(toMetric(range)).width;
                                //ct.fillText(GetHeading(vpsacial, v.Orientation), xi - 35, yi -14);
                                var nl = 22;
                                var dl = -16;
                                //var nl = 6 + (16 * radarZoom);
                                //var dl = -4 + (-12 * radarZoom);
                                if (nl < 6) nl = 6;
                                if (dl > -4) dl = -4;
                                ct.fillText(v.Name, -Math.floor(nw / 2), nl); // Name
                                ct.fillText(toMetric(range), -Math.floor(ndt / 2), dl); // Distance
                            }

                            ct.rotate(rot);

                            if (v.Faction === thisvessel.Faction)
                                ipx = 60;
                            else if (IsEnemyFaction(v))
                                ipx = 120;
                            else
                                ipx = 180;

                            if (v.BaseType === "Missile") {
                                ct.drawImage(rm, -8, -8, 16, 16);
                            } else {
                                switch (v.BaseType) {
                                    case "Object":
                                        ipx = 0;
                                        break;
                                    case "Container":
                                        ipy = 240;
                                        break;
                                    case "Vessel":
                                        ipy = v.SubType === "Container" ? 240 : 60;
                                        break;
                                    case "Drone":
                                        ipy = 180;
                                        break;
                                    default:
                                        // Station-Other
                                        ipy = 120;
                                        break;
                                }

                                ct.drawImage(icons, ipx, ipy, 60, 60, tl, tl, ts, ts);
                            }

                            ct.rotate(-rot);
                            ct.translate(-xi, -yi);

                        } else {
                            // Off Screen
                            var inset = 0;
                            var itt = Intersect(inset, inset, ct.canvas.width, inset, center.x, center.y, xi, yi); // Top
                            var itb = Intersect(inset, ct.canvas.height, ct.canvas.width, ct.canvas.height, center.x, center.y, xi, yi); // Bottom
                            var itl = Intersect(inset, inset, inset, ct.canvas.height, center.x, center.y, xi, yi); // Left
                            var itr = Intersect(ct.canvas.width, inset, ct.canvas.width, ct.canvas.height, center.x, center.y, xi, yi); // Right

                            if (IsEnemyFaction(v)) ct.fillStyle = "#ff0000";
                            //if (v.Faction != thisvessel.Faction && v.BaseType != "Object" && v.Faction != "") ct.fillStyle = "#ff0000";

                            if (typeof itt !== "undefined") {
                                ct.width = 3;
                                ct.beginPath();
                                ct.arc(itt.x, itt.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            } else if (itb) {
                                ct.width = 3;
                                ct.beginPath();
                                ct.arc(itb.x, itb.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            } else if (itl) {
                                ct.width = 3;
                                ct.beginPath();
                                ct.arc(itl.x, itl.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            } else if (itr) {
                                ct.width = 3;
                                ct.beginPath();
                                ct.arc(itr.x, itr.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            }
                        }

                    }

                }
                ct.restore();
            }

            // Compass
            var compheight = ct.canvas.height;
            ct.drawImage(cmp, center.x - (compheight / 2), 0, compheight, compheight);

            // Draw Vessel
            ct.translate(center.x, center.y);
            if (!rotated)
                ct.rotate(DegreesToRadians(thisvessel.Orientation.X));

            if (ts < 12) ts = 12;
            ct.drawImage(rvp, tl, tl, ts, ts);

            ct.restore();
        } catch (err) {
            console.log("RadarDisplay.Render: " + err.message);
        }
    }

};

// Radar Listing
jQuery.fn.RadarList = function (layout, options) {
    var $this = $(this);
    var radarProcessing = false;

    var template = hf_RadarListing;

    if (typeof options === "undefined") options = {};
    var consoleTarget = typeof options.Console !== "undefined" ? options.Console : "";
    var showPlanets = typeof options.ShowPlanets !== "undefined" ? options.showPlanets : true;

    if (typeof layout !== "undefined" && layout !== "") template = layout;

    $(document).on("onContacts", function () {
        Render();
    });

    $(document).on("onRemoveContact", function (event, removeid) {
        // Remove from DOM
        $("#contact-" + removeid).remove();
    });

    $(document).on("onReset", function (event) {
        // Clear
        $this.html("");
    });

    function Render() {
        try {
            if (typeof contacts === "undefined") return;
            if ($this.length === 0) return;
            if (radarProcessing === true) return;
            if (comms === 1 && socketstatus === 0) { return; }
            if (mission === null) return;
            if (template === "") template = hf_RadarListing;

            radarProcessing = true;

            var list = "";

            for (var i in planetarySystem)
                list += DrawObject(planetarySystem[i]);

            for (var i in contacts)
                list += DrawObject(contacts[i]);

            $this.html(list);

            //if (!havetarget) {
            //    currenttarget = undefined;
            //}
        } catch (err) {
            console.log("RadarList.Render: " + err.message);
        }
        radarProcessing = false;
    }

    function DrawObject(o) {
        var row = "";
        var rlstyle = "";
        var itemstyle = "item-object";

        try {
            if (typeof o.Name === "undefined")
                return "";
            if (typeof o.BaseType === "undefined")
                return "";
            if (o.Name === "")
                return "";
            if (o.Type === "Missile")
                return "";
            if (o.InRange === false)
                return "";

            var range = GetDistance(thisvessel.Position, o.Position);
            if (o.BaseType === "Planet") range -= o.Scale;
            if (range < 0) range = 0;

            if (o.ID === selectedid) {
                SetText("#target-intel-range", toMetric(range));
                showtext = true;
            }

            var nt = template;
            if (currenttargetid === o.ID) {
                //havetarget = true;
                //currenttarget = o; //TODO: Consider Removing
                rlstyle = "background-color: #003d51;";
            }

            switch (o.BaseType) {
                case "Object":
                    itemstyle = "item-object";
                    break;
                case "Debris":
                    itemstyle = "item-debris";
                    break;
                case "Cluster":
                    return "";
                case "Planet":
                    if (!showPlanets)
                        return "";
                    itemstyle = "item-planet";
                    break;
                case "Container":
                    if (o.Faction === thisvessel.Faction)
                        itemstyle = "item-container-ally";
                    else if (o.Faction === "" || o.Faction === "Neutral")
                        itemstyle = "item-container-neutral";
                    else if (o.Faction !== thisvessel.Faction)
                        itemstyle = "item-container-enemy";
                    break;
                case "Station":
                    if (o.Faction === thisvessel.Faction)
                        itemstyle = "item-station-ally";
                    else if (o.Faction === "" || o.Faction === "Neutral")
                        itemstyle = "item-station-neutral";
                    else if (o.Faction !== thisvessel.Faction)
                        itemstyle = "item-station-enemy";
                    break;
                case "Vessel":
                    itemstyle = "item-vessel";
                    if (o.Faction === thisvessel.Faction)
                        itemstyle = "item-vessel-ally";
                    else if (o.Faction === "" || o.Faction === "Neutral")
                        itemstyle = "item-vessel-neutral";
                    else if (o.Faction !== thisvessel.Faction)
                        itemstyle = "item-vessel-enemy";
                    break;
                case "Drone":
                    itemstyle = "item-drone";
                    if (o.Faction === thisvessel.Faction)
                        itemstyle = "item-drone-ally";
                    else if (o.Faction === "" || o.Faction === "Neutral")
                        itemstyle = "item-drone-neutral";
                    else if (o.Faction !== thisvessel.Faction)
                        itemstyle = "item-drone-enemy";
                    break;
                case "Missile":
                    return "";
                default:
                    if (o.Faction !== thisvessel.Faction) itemstyle = "item-object-enemy";
                    break;
            }

            if (o.SubType === "Container") {
                if (o.Faction === thisvessel.Faction)
                    itemstyle = "item-container-ally";
                else if (o.Faction === "" || o.Faction === "Neutral")
                    itemstyle = "item-container-neutral";
                else if (o.Faction !== thisvessel.Faction)
                    itemstyle = "item-container-enemy";
            }

            var shields = o.Shields;
            if (typeof shields === "undefined")
                shields = 0;

            //                if ($("#contact-" + o.ID).length == 0) {
            // Add
            nt = replaceAll(nt, "[ID]", o.ID);
            nt = replaceAll(nt, "[UID]", o.ID);
            nt = replaceAll(nt, "[Name]", o.Name);
            nt = replaceAll(nt, "[Style]", itemstyle);
            nt = replaceAll(nt, "[Bearing]", GetBearingR(o.Relative));
            nt = replaceAll(nt, "[Distance]", toMetric(range));
            nt = replaceAll(nt, "[Shields]", parseInt(shields * 100));
            nt = replaceAll(nt, "[Hull]", parseInt(o.Integrity * 100));
            row += nt;
            //$this.append(nt);
            //} else {
            //    // Update
            //    if ($("#contact-name-" + o.ID).text() != o.Name)
            //        $("#contact-name-" + o.ID).text(o.Name);
            //    if ($("#contact-distance-" + o.ID).text() != toMetric(range))
            //        $("#contact-distance-" + o.ID).text(toMetric(range));

            //    if (!$("#contact-icon-" + o.ID).hasClass(itemstyle)) {
            //        $("#contact-icon-" + o.ID).removeClass(function (index, className) {
            //            return (className.match(/(^|\s)item-\S+/g) || []).join(' ');
            //        });
            //        $("#contact-icon-" + o.ID).addClass("item-icon");
            //        $("#contact-icon-" + o.ID).addClass(itemstyle);
            //    }
            //}

            // Focus? 
            // TODO: Remove To A Custom Event
            if (o.ID === selectedid) {
                if ($("#scan-shields").length !== 0)
                    $("#scan-shields").width(o.Shields * $("#scan-shields").parent().width());
                if ($("#scan-hull").length !== 0)
                    $("#scan-hull").width(o.Integrity * $("#scan-hull").parent().width());
                if ($("#scan-shields-v").length !== 0)
                    $("#scan-shields-v").height(o.Shields * $("#scan-shields-v").parent().height());
                if ($("#scan-hull-v").length !== 0)
                    $("#scan-hull-v").height(o.Integrity * $("#scan-hull-v").parent().height());
            }
        } catch (err) {

        }
        return row;
    }

};

// Fish-Eye Radar
jQuery.fn.RelativeRadar = function (mode) {
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d");

    if (typeof mode === 'undefined') mode = 1; // 1= Forward, 2= Rear, 3= Top

    var center = { x: 0, y: 0 };
    var coords = { x: 0, y: 0 };
    var radius = 0;
    var size = 3;

    ResetSize();
    Render();

    $(document).on("onResize", function (e) {
        ResetSize();
    });

    function ResetSize() {
        ct.canvas.width = $this.width();
        ct.canvas.height = $this.height();
    }

    function Render() {
        RenderRadar();
        requestAnimationFrame(Render);
    }

    function RenderRadar() {
        if (typeof thisvessel === "undefined") return;
        if (typeof contacts === "undefined") return;
        if (!$this.is(':visible')) return;

        try {
            if (comms === 1 && socketstatus === 0)
                return;

            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();
            ct.font = "bold 14px sans-serif";

            ct.fillStyle = "#aaffaa";
            ct.lineStyle = "#ffff00";
            ct.strokeStyle = "rgb(75,75,200)";
            ct.width = 2;
            ct.save();

            //drawEllipseWithBezier(ct, 10, 10, spacialData.Yaw, radius, 'blue');

            var center = { x: 0, y: 0 };
            center.x = ct.canvas.width / 2;
            center.y = ct.canvas.height / 2;
            radius = ((ct.canvas.width > ct.canvas.height) ? ct.canvas.height : ct.canvas.width) * .45;

            // Radar Circle
            ct.beginPath();
            ct.arc(center.x, center.y, radius, 0, fullCircle, true); //(Math.PI / 180) * 0

            ct.fillStyle = "rgba(0,0,0,.75)";
            ct.fill();
            ct.stroke();
            ct.closePath();

            //Inner Radar Circle
            ct.beginPath();
            ct.arc(center.x, center.y, radius / 2, 0, fullCircle, true); //(Math.PI / 180) * 0
            ct.strokeStyle = "rgb(50,50,100)";
            ct.stroke();
            ct.closePath();

            //Label
            ct.fillStyle = "#ffffff";
            if (mode === 1) {
                ct.fillText("F", 30, 30);
            } else if (mode === 2) {
                ct.fillText("R", 180, 30);
            }

            //Draw Dots
            for (var c in contacts) {
                var v = contacts[c];
                //var po = getOffset(thisvessel.Position, v.Position);

                if (typeof v.Name === 'undefined') continue;
                if (v.Name === "") continue;
                if (v.BaseType === "Missile") continue;
                if (v.BaseType === "Planet") continue;

                var xi;
                var yi;

                var relative;

                switch (mode) {
                    case 1:
                        // Front
                        //relative = RelativePosition(thisvessel.Position, v.Position);
                        if (v.Relative.Z > 0)
                            continue;
                        xi = center.x + -(v.Relative.X * radius);
                        yi = center.y + (v.Relative.Y * radius);
                        
                        break;
                    case 2:
                        // Back
                        //relative = RelativePosition(thisvessel.Position, v.Position, "Back");
                        if (v.Relative.Z <= 0)
                            continue;
                        xi = center.x + -(v.Relative.X * radius);
                        yi = center.y + (v.Relative.Y * radius);
                        
                        break;
                    case 3:
                        // Top - Show All
                        xi = center.x + -(v.Relative.X * radius);
                        yi = center.y + (v.Relative.Z * radius);
                        break;
                }

                ct.fillStyle = "rgb(225,225,255)";
                ct.lineWidth = 2;

                var range = Math.floor(GetDistance(thisvessel.Position, v.Position));
                var distAlpha = 1; // .1 + ((range / 40000) * .9);

                if (v.BaseType === "Planet") range -= v.Scale;
                if (range <= 0) {
                    range = .01;
                    distAlpha = 1;
                } else if (range > 10000) {
                    distAlpha = .5;
                } else {
                    distAlpha = .5 + (10000 - range) / 10000 * .5;
                }

                if (v.Faction === thisvessel.Faction)
                    ct.fillStyle = "rgba(0,255,0," + distAlpha + ")";
                else if (IsEnemyFaction(v))
                    ct.fillStyle = "rgba(225,0,0," + distAlpha + ")";
                else
                    ct.fillStyle = "rgba(0,180,235," + distAlpha + ")";

                ct.beginPath();
                ct.arc(xi, yi, size, 0, fullCircle, true);  //(Math.PI / 180) * 0
                ct.fill();
                ct.closePath();

                if (flighttargetid === v.ID) {
                    ct.beginPath();
                    ct.arc(xi, yi, size * 1.8, 0, fullCircle, true); //(Math.PI / 180) * 0
                    ct.strokeStyle = "rgb(0,180,235)";
                    ct.stroke();
                    ct.closePath();
                } else if (currenttargetid === v.ID) {
                    ct.beginPath();
                    ct.arc(xi, yi, size * 1.8, 0, fullCircle, true); //(Math.PI / 180) * 0
                    ct.strokeStyle = "rgb(255,0,0)";
                    ct.stroke();
                    ct.closePath();
                } else if (selectedid === v.ID) {
                    ct.beginPath();
                    ct.arc(xi, yi, size * 1.8, 0, fullCircle, true); //(Math.PI / 180) * 0
                    ct.strokeStyle = "rgb(255,255,0)";
                    ct.stroke();
                    ct.closePath();
                }
            }
            ct.restore();

        } catch (err) {
            console.log("RelativeRadar.Render: " + err.message);
        }
    }

    function drawEllipseWithEllipse(ctx, cx, cy, rx, ry, style) {
        if (ctx.ellipse) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.strokeStyle = style;
            ctx.stroke();
        }
    }

};

// Fish-Eye Radar
jQuery.fn.RelativeRadarFull = function (mode) {
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d");

    if (typeof mode === "undefined") mode = 1; // 1= Forward, 2= Read, 3= Top

    var center = { x: 0, y: 0 };
    var coords = { x: 0, y: 0 };
    var radius = 0;
    var outerradius = 0;
    var size = 3;

    renderRadar();

    function renderRadar() {
        requestAnimationFrame(renderRadar);
        if (typeof contacts === "undefined") return;
        if (!$this.is(':visible')) return;

        try {
            if (comms === 1 && socketstatus === 0) { return; }

            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();
            ct.font = "bold 14px sans-serif";

            ct.fillStyle = "#aaffaa";
            ct.lineStyle = "#ffff00";
            ct.strokeStyle = "rgb(75,75,200)";
            ct.width = 2;
            ct.save();

            //drawEllipseWithBezier(ct, 10, 10, spacialData.Yaw, radius, 'blue');

            var center = { x: 0, y: 0 };
            center.x = (ct.canvas.width / 2);
            center.y = (ct.canvas.height / 2);
            outerradius = ((ct.canvas.width > ct.canvas.height) ? ct.canvas.height : ct.canvas.width) * .45;
            radius = outerradius - 10; // Account For Outer Rim

            // Radar Circle
            ct.beginPath();
            ct.arc(center.x, center.y, outerradius, 0, fullCircle, true);
            ct.fillStyle = "rgb(0,0,0)";
            ct.fill();
            ct.stroke();
            ct.closePath();

            ct.beginPath();
            ct.arc(center.x, center.y, radius, 0, fullCircle, true); 
            ct.fillStyle = "rgb(0,0,0)";
            ct.fill();
            ct.stroke();
            ct.closePath();

            //Inner Radar Circle
            ct.beginPath();
            ct.arc(center.x, center.y, radius / 2, 0, fullCircle, true);
            ct.strokeStyle = "rgb(50,50,100)";
            ct.stroke();
            ct.closePath();

            //Draw Dots
            for (var c in contacts) {
                var v = contacts[c];
                //var po = getOffset(thisvessel.Position, v.Position);
                var outer = false;

                if (v.Name === "") continue;
                if (v.BaseType === "Missile") continue;
                if (v.BaseType === "Planet") continue;

                var xi;
                var yi;
                if (v.Relative.Z > 0) {
                    // Outer (Behind)
                    outer = true;

                    var rxi = -(v.Relative.X * 10);
                    var ryi = v.Relative.Y * 10;

                    if (rxi < 0)
                        rxi += -radius;
                    else
                        rxi += radius;
                    if (ryi < 0)
                        ryi += -radius;
                    else
                        ryi += radius;

                    xi = center.x + rxi;
                    yi = center.y + ryi;


                    //continue;
                } else {
                    xi = center.x + -(v.Relative.X * radius);
                    yi = center.y + (v.Relative.Y * radius);
                }

                //break;

                ct.fillStyle = "rgb(225,225,255)";
                ct.lineWidth = 2;
                //if (v.ID == selectedid)
                //    ct.fillStyle = "#fff";

                var range = GetDistance(thisvessel.Position, v.Position);
                if (v.BaseType === "Planet") range -= v.Scale;
                if (range < 0) range = 0;

                if (v.ID === selectedid) 
                    SetText("#target-intel-range", toMetric(range));

                if (v.Faction !== thisvessel.Faction && v.BaseType !== "Object" && v.Faction !== "") ct.fillStyle = "#ff0000";

                ct.beginPath();
                ct.arc(xi, yi, size, 0, fullCircle, true);  //(Math.PI / 180) * 0
                ct.fill();
                ct.closePath();

                if (flighttargetid === v.ID) {
                    ct.beginPath();
                    ct.arc(xi, yi, size * 1.8, 0, fullCircle, true); //(Math.PI / 180) * 0
                    ct.strokeStyle = "rgb(0,180,235)";
                    ct.stroke();
                    ct.closePath();
                } else if (currenttargetid === v.ID) {
                    ct.beginPath();
                    ct.arc(xi, yi, size * 1.8, 0, fullCircle, true); //(Math.PI / 180) * 0
                    ct.strokeStyle = "rgb(255,0,0)";
                    ct.stroke();
                    ct.closePath();
                } else if (selectedid === v.ID) {
                    ct.beginPath();
                    ct.arc(xi, yi, size * 1.8, 0, fullCircle, true); //(Math.PI / 180) * 0
                    ct.strokeStyle = "rgb(255,255,0)";
                    ct.stroke();
                    ct.closePath();
                }
            }
            ct.restore();

        } catch (err) {
            console.log("RelativeRadarFull.Render: " + err.message);
        }
    }

    function drawEllipseWithEllipse(ctx, cx, cy, rx, ry, style) {
        if (ctx.ellipse) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.strokeStyle = style;
            ctx.stroke();
        }
    }

};

// Science Scan Canvas  LEGACY
jQuery.fn.ScanningDisplay = function (isrotated, arcs) {
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d");
    var rotated = false;
    var lastrender = new Date();

    // Locals
    var lastzoom = 0;
    var maxzoom = 8;

    var snd_ping = new SoundQue("/sound/ping.mp3");
    var radarping = 5;

    var center = { x: 0, y: 0 };
    var coords = { x: 0, y: 0 };
    var gridoffset = { x: 0, y: 0 };

    var gridsize = 200;
    var gridcells = { x: 0, y: 0 };
    var starsize = 1024;
    var starcells = { x: 0, y: 0 };
    var showtext = true;
    var lastmaneuver = "Cruise";
    var showarcs = typeof arcs !== "undefined" ? arcs : true;
    var localscale = .01;
    var localgridscale = .01;
    //if (isrotated != undefined) rotated = isrotated;

    // load images
    var bg = new Image();
    bg.src = "images/grid1.jpg";
    var stars = new Image();
    stars.src = "images/stars.jpg";

    var rvp = new Image();
    rvp.src = "images/rdr_vessel.png";
    var rm = new Image();
    rm.src = "images/radar_missile.png";
    var ft = new Image();
    ft.src = "images/flight-lock.png";
    var tt = new Image();
    tt.src = "images/target-lock.png";
    var rp = new Image();
    rp.src = "images/planet.png";

    var icons = new Image();
    icons.src = "images/item-icons.png";

    //Set Canvas
    $this.css("background-image", "url(images/grid-s.png)");

    RenderDisplay();

    $this.on("mousedown", function (event) {
        var coords = GetEventCoords($this, event);

        CloseInfo();

        var offset = { x: 0, y: 0 };
        var closestobject;
        var closerange = 1000000;

        for (var c in contacts) {
            var v = contacts[c];
            var po = getOffset(thisvessel.Position, v.Position);
            var xi = center.x + (po.X * localscale * radarZoom);
            var yi = center.y + (po.Z * localscale * radarZoom);
            var radius = 20 + (4 - radarZoom) * 3;

            if (v.BaseType === "Planet") radius = (1.7 * (v.Scale * .006)) * radarZoom;
            //if (v.BaseType === "Planet") radius = 3.32 * (v.Scale * .006) * radarZoom;
            var range = GetDistance2(xi, yi, coords.x, coords.y);

            if (range <= radius && range < closerange) {
                closerange = range;
                closestobject = v;
            }

            // Player?
            var prange = GetDistance2(center.x, center.y, coords.x, coords.y);
            if (prange <= 30 && prange < closerange) {
                closestobject = thisvessel;
            }
        }

        if (typeof closestobject !== "undefined") {
            PlayClickSound();

            if (closestobject.ID === 0) {
                ObjectSelected(closestobject.Name);
            } else {
                ObjectSelected(closestobject.ID);
            }
        }

    });

    function RenderDisplay() {
        requestAnimationFrame(renderDisplay);
        if (typeof thisvessel === "undefined") return;
        if (typeof contacts === "undefined") return;
        if (!$this.is(':visible')) return;

        try {
            if (comms === 1 && socketstatus === 0) { return; }

            if (lastzoom !== radarZoom) {
                if (radarZoom > maxzoom) radarZoom = maxzoom;
                lastzoom = radarZoom;
            }

            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();
            ct.font = "9px sans-serif";
            ct.fillStyle = "#aaffaa";
            ct.lineStyle = "#ffff00";
            ct.save();

            center.x = (ct.canvas.width / 2);
            center.y = (ct.canvas.height / 2);

            // Offset
            var insize = 10000;
            var scaleX = (thisvessel.Position.X % insize) / insize;
            var scaleY = (thisvessel.Position.Y % insize) / insize;
            var rot = 0;
            var showtext = true;

            // Icon Sizing
            var ts = 30; // * radarZoom;
            if (ts < 12) ts = 12;
            var tl = -(ts / 2);

            // Grid
            var go = getOffset(thisvessel.Position, { X: 0, Y: 0, Z: 0 });
            gridoffset.x = center.x + ((go.X * localgridscale) * radarZoom);
            gridoffset.y = center.y + ((go.Z * localgridscale) * radarZoom);

            // Draw Grid
            var dotwidth = 1000 * radarZoom;

            if (thisvessel.Maneuver === "FTL") {
                $this.css("background-image", "none");
            } else if (lastmaneuver === "FTL") {
                $this.css("background-image", "url(images/grid-s.png)");
            }
            lastmaneuver = thisvessel.Maneuver;

            $this.css("background-position", gridoffset.x + "px " + gridoffset.y + "px");
            $this.css("background-size", 2000 * radarZoom);

            // Ping?
            DrawPING();

            // Draw Reticle
            if (showarcs) {
                ct.translate(center.x, center.y);
                if (!rotated) ct.rotate(DegreesToRadians(thisvessel.Position.X));

                var arld = 210000 * localscale * radarZoom;
                ct.lineWidth = 1;
                ct.strokeStyle = 'darkblue';

                ct.moveTo(center.x, center.y);
                // 200km
                ct.beginPath();
                ct.arc(0, 0, arld * 1.41, 0, fullCircle, true);
                ct.stroke();
                ct.closePath();

                ct.restore();
            }

            // Draw Contacts
            for (var c in contacts) {
                var v = contacts[c];

                if (typeof v.Name === "undefined") continue;
                if (typeof v.BaseType === "undefined") continue;

                if (selectedid === thisvessel.ID) {
                    if ($("#scan-shields").length !== 0)
                        $("#scan-shields").width(thisvessel.Shields * 380);
                    if ($("#scan-hull").length !== 0)
                        $("#scan-hull").width(thisvessel.Integrity * 380);
                }

                var po = getOffset(thisvessel.Position, v.Position);
                var xi = center.x + ((po.X * localscale) * radarZoom);
                var yi = center.y + ((po.Z * localscale) * radarZoom);
                var ipx = 0;
                var ipy = 0;
                var isScanning = typeof scanningid !== "undefined" && scanningid !== 0 && scanningid === v.ID;

                var below = false;
                rot = DegreesToRadians(v.Orientation.X);

                showtext = false;
                //if (rotated) {
                //ct.translate(center.x, center.y);
                //ct.rotate(-DegreesToRadians(spacialData.Yaw));
                //}

                if (po.Y < 0) below = true;

                if (v.Name !== "") {
                    var nw = ct.measureText(v.Name).width;
                    var range = 0;

                    showtext = false; //false

                    if (below)
                        ct.fillStyle = "#aaaaff";
                    else
                        ct.fillStyle = "#aaffaa";
                    if (v.ID === selectedid) 
                        ct.fillStyle = "#fff";

                    if (v.ID === selectedid || v.BaseType === "Planet") {
                        range = GetDistance(thisvessel.Position, v.Position);
                        if (v.BaseType === "Planet") range -= (v.Scale * scale);
                        if (range < 0) range = 0;
                    }

                    if (v.ID === selectedid) {
                        SetText("#target-intel-range", toMetric(range));
                        if ($("#target-bearing") !== undefined) $("#target-bearing").text(GetBearingR(v.Relative));
                        showtext = true;
                    }

                    if (v.BaseType === "Planet") {
                        // Planet
                        var ps = (v.Scale * localscale * scale) * radarZoom * 2;
                        var offs = Math.floor(ps / 2);
                        ipy = 75;

                        // Image
                        ct.drawImage(rp, xi - offs, yi - offs, ps, ps);

                        // Scanning?
                        if (isScanning) {
                            var rads = (Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 1.9));
                            ct.strokeStyle = "green";
                            ct.lineWidth = 4;
                            ct.beginPath();
                            ct.arc(xi, yi, ps * .51, 0, rads, true); //fullCircle
                            ct.stroke();
                            ct.closePath();
                        }

                        ct.fillText(v.Name, xi - parseInt(nw / 2), yi + 4);
                        var nd = ct.measureText(toMetric(range)).width;
                        ct.fillText(toMetric(range), xi - parseInt(nd / 2), yi + 16); // Distance

                    } else {
                        // Objects 

                        if (InRect(xi, yi, 0, 0, ct.canvas.width, ct.canvas.height)) {
                            // On Screen
                            ct.translate(xi, yi);

                            // Target?
                            var tso = ts + 4;
                            var tro = parseInt(-tso / 2);
                            if (v.ID === currenttargetid) {
                                ct.drawImage(tt, tro, tro, tso, tso);
                            }
                            if (v.ID === flighttargetid) {
                                ct.drawImage(ft, tro, tro, tso, tso);
                            }

                            // Scanning?
                            if (isScanning) {
                                //ct.width = 30;
                                var tsrads = Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 1.9); 
                                ct.strokeStyle = "green";
                                ct.lineWidth = 4;
                                ct.beginPath();
                                ct.arc(0, 0, 20, 0, tsrads, true); //fullCircle
                                ct.stroke();
                                ct.closePath();
                            }

                            // Label?
                            if (showtext === true) {
                                var lnd = ct.measureText(toMetric(range)).width;
                                var nl = 22;
                                var dl = -16;
                                if (nl < 6) nl = 6;
                                if (dl > -4) dl = -4;
                                ct.fillText(v.Name, -parseInt(nw / 2), nl); // Name
                                ct.fillText(toMetric(range), -parseInt(lnd / 2), dl); // Distance
                            }

                            ct.rotate(rot);
                            
                            if (v.Faction === thisvessel.Faction)
                                ipx = 60;
                            else if (IsEnemyFaction(v))
                                ipx = 120;
                            else
                                ipx = 180;

                            if (v.BaseType === "Missile") {
                                ct.drawImage(rm, -8, -8, 16, 16);
                            } else {
                                switch (v.BaseType) {
                                    case "Object":
                                        ipx = 0;
                                        break;
                                    case "Container":
                                        ipy = 240;
                                        break;
                                    case "Vessel":
                                        ipy = v.SubType === "Container" ? 240 : 60;
                                        break;
                                    case "Drone":
                                        ipy = 180;
                                        break;
                                    default:
                                        // Station-Other
                                        ipy = 120;
                                        break;
                                }

                                ct.drawImage(icons, ipx, ipy, 60, 60, tl, tl, ts, ts);
                            }

                            ct.rotate(-rot);
                            ct.translate(-xi, -yi);

                        } else {
                            // Off Screen
                            var inset = 0;
                            var itt = Intersect(inset, inset, ct.canvas.width, inset, center.x, center.y, xi, yi); // Top
                            var itb = Intersect(inset, ct.canvas.height, ct.canvas.width, ct.canvas.height, center.x, center.y, xi, yi); // Bottom
                            var itl = Intersect(inset, inset, inset, ct.canvas.height, center.x, center.y, xi, yi); // Left
                            var itr = Intersect(ct.canvas.width, inset, ct.canvas.width, ct.canvas.height, center.x, center.y, xi, yi); // Right

                            if (IsEnemyFaction(v)) ct.fillStyle = "#ff0000";
                            //if (v.Faction != thisvessel.Faction && v.BaseType != "Object" && v.Faction != "") ct.fillStyle = "#ff0000";

                            if (typeof itt !== "undefined") {
                                //ct.width = 3;
                                ct.beginPath();
                                ct.arc(itt.x, itt.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            } else if (itb) {
                                //ct.width = 3;
                                ct.beginPath();
                                ct.arc(itb.x, itb.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            } else if (itl) {
                                //ct.width = 3;
                                ct.beginPath();
                                ct.arc(itl.x, itl.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            } else if (itr) {
                                //ct.width = 3;
                                ct.beginPath();
                                ct.arc(itr.x, itr.y, 5, 0, fullCircle, true);
                                ct.fill();
                                ct.closePath();
                            }
                        }

                    }

                }
                ct.restore();
            }

            // Draw Vessel
            ct.translate(center.x, center.y);

            // Scanning Player?
            if (typeof scanningid !== "undefined" && scanningid !== 0 && scanningid === thisvessel.ID) {
                var srads = Math.PI * (2 - (ElapsedMilliseconds(scanstarted) / scandelay) * 1.9);
                ct.strokeStyle = "green";
                ct.lineWidth = 4;
                ct.beginPath();
                ct.arc(0, 0, 20, 0, srads, true); //fullCircle
                ct.stroke();
                ct.closePath();
            }

            if (!rotated) ct.rotate(DegreesToRadians(thisvessel.Position.X));

            if (ts < 12) ts = 12;
            ct.drawImage(rvp, tl, tl, ts, ts);

            ct.restore();
        } catch (err) {
            console.error(err);
        }
    }

    function DrawPING() {
        try {
            radarping += 13 * ElapsedMilliseconds(lastrender);
            lastrender = new Date();

            if (radarping > 300000) {
                radarping = 5;
            }
            if (radarping === 5 && typeof snd_ping !== "undefined") {
                snd_ping.Play();
            }
            ct.moveTo(center.x, center.y);
            ct.lineWidth = 4;
            ct.strokeStyle = '#101010';
            var rld = radarping * localscale * radarZoom;
            ct.beginPath();
            ct.arc(center.x, center.y, rld, 0, fullCircle, true);
            ct.stroke();
            ct.closePath();
        } catch (err) {
            console.log("ScanningDisplay.DrawPING", err.message);
        }
    }

};

// Planet Surface Render
jQuery.fn.PlanetDisplay = function () {
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d");
    var scanDetail;
    var bg = new Image();
    var lastScan;

    var st = new Image();
    st.src = "images/flight-lock.png";

    renderDisplay();

    bg.onload = function () {
        renderDisplay();
    };
    
    $(document).on("onScanDetail", function (event) {
        try {
            if (typeof scanResults.Gravity === "undefined") {
                return;
            }

            // Set Local Object
            scanDetail = scanResults;
            lastScan = undefined;
            bg.src = "planet." + scanDetail.Name + ".spng";
        } catch (err) {
            console.log("PlanetDisplay.onScanDetail: " + err.message);
        }
    });

    $this.on("mousedown", function (event) {
        lastScan = GetEventCoords($this, event);

        var offset = { x: 0, y: 0 };
        var closestobject;
        var closerange = 1000000;

        $(document).trigger("onPlanetFocusScan", lastScan);

        // Loop Through Planetary Objects 

    });

    function renderDisplay() {
        try {
            requestAnimationFrame(renderDisplay);
            if (!$this.is(':visible')) return;

            ct.canvas.width = $this.width();
            ct.canvas.height = $this.height();
            ct.drawImage(bg, 0, 0, $this.width(), $this.height());

            // 20 x 10 Grid
            var x = $this.width() / 20;
            var y = $this.height() / 10;
            var x2 = x * .5;
            var color = "rgba(1,1,1,.35)";
            var middle = "rgba(1,100,1,.35)";
            for (var w = 0; w < x; w++) {
                DrawLine(ct, w * x, 0, w * x, $this.height(), 1, (w === 10) ? middle : color);
            }
            for (var h = 0; h < y; h++) {
                DrawLine(ct, 0, h * y, $this.width(), h * y, 1, (h === 5) ? middle : color);
            }

            // Draw Scan Reticle
            if (typeof lastScan !== "undefined")
                ct.drawImage(st, lastScan.x - x2, lastScan.y - x2, x, x);
        } catch (err) {
            console.log("PlanetDisplay.renderDisplay: " + err.message);
        }
    }

    function clearDisplay() {
        scanDetail = undefined;
        //$this.css("background-image", "url()");
    }

};

// Damage Displays
jQuery.fn.DamageDisplay = function (mode, dir, source) {
    // Mode (1=Top, 2=Bottom, 3=Left, 4=Right, 5=Front, 6=Back )
    // Dir (1=Up, 2=Right, 3=Down, 4=Left) - Up Is Dire All Coords Are Based On
    var $this = $(this);
    var cv = $this;
    var ct = cv[0].getContext("2d");
    var rvp = new Image();
    var resized = false;
    var renderscale = 1;

    var wpn = new Image();
    wpn.src = "images/turret.png";
    var wpno = new Image();
    wpno.src = "images/turret-o.png";

    if (typeof mode === "undefined") mode = 1;
    if (typeof dir === "undefined") dir = 1;

    if (typeof source !== "undefined") {
        rvp.src = source;
    } else {
        rvp.src = "images/vessel-top-ol.png";
    }

    var center = { x: 0, y: 0 };
    var coords = { x: 0, y: 0 };

    ResetSize();
    Render();

    $(document).on("onResize", function (e) {
        ResetSize();
        Render();
    });

    $(document).on("onReset", function () {
        //ResetSize();
        Render();
    });

    $(document).on("onDamageInfo", function () {
        Render();
    });

    function ResetSize() {
        ct.canvas.width = $this.width();
        ct.canvas.height = $this.height();
    }

    function Render() {
        if ($this.is(':visible') && (!resized || ct.canvas.width == 0 || ct.canvas.height == 0)) {
            resized = true;
            ResetSize();
        }
            
        //if ($this.parent().width() !== 0 && !resized) {
        //    resized = true;
        //    Resize();
        //}

        ct.clearRect(0, 0, ct.canvas.width, ct.canvas.height);
        ct.font = "9px sans-serif";

        center.x = (ct.canvas.width / 2);
        center.y = (ct.canvas.height / 2);

        RenderDisplay();
        RenderLoadout();
        RenderDamage();
    }

    function RenderDisplay() {
        try {
            if (!$this.is(':visible')) return;

            if (rvp.height > rvp.width) {
                renderscale = rvp.height / ct.canvas.height;
                ct.drawImage(rvp, center.x - ((rvp.width / renderscale) / 2), 0, rvp.width / renderscale, ct.canvas.height);
                renderscale = rvp.height / center.y;
            } else {
                renderscale = rvp.width / ct.canvas.width;
                ct.drawImage(rvp, center.x - ((rvp.height / renderscale) / 2), 0, rvp.height / renderscale, ct.canvas.width);
                renderscale = rvp.width / center.y;
            }
        } catch (err) {
            console.log("DamageDisplay.RenderDisplay: " + err.message);
        }
    }

    function RenderLoadout() {
        try {
            if (typeof weaponData === "undefined") return;
            if (!$this.is(':visible')) return;

            var rot = 0;
            var iconscale = 60 / renderscale;
            var offset = -(iconscale / 2);

            renderscale *= .61;

            for (var i in weaponData) {
                var w = weaponData[i];
                if (w.Name === "") continue;

                var spot = { x: (center.x + (w.Position.X / renderscale)), y: (center.y + (w.Position.Z / renderscale)) };
                rot = -w.Rotation.Y;

                ct.save();
                ct.translate(spot.x, spot.y + 20);
                ct.rotate(rot);
                //if (true) {
                ct.drawImage(wpn, offset, offset, iconscale, iconscale);
                //} else {
                //    ct.drawImage(wpno, 0, 0, iconscale, iconscale);
                //}
                //ct.rotate(-rot);
                ct.translate(-spot.x, -spot.y);
                ct.restore();
            }
        } catch (err) {
            console.log("DamageDisplay.RenderLoadout: " + err.message);
        }
    }

    function RenderDamage() {
        try {
            if (typeof damageData === "undefined") return;
            if (!$this.is(':visible')) return;

            var rc = 0;
            if (damageData.length < 255) {
                rc = 255 - damageData.length;
            }
            for (var i in damageData) {
                var d = damageData[i];
                var size = d.Damage;

                if (size < 5)
                    size = 5;
                else if (size > 20)
                    size = 20;

                var fillColor = "rgb(255, 0, 0)";

                switch (mode) {
                    case 1:
                        // Top
                        if (d.Position.Y < 0) {
                            fillColor = "rgb(255, 100, 100)";
                        }
                        coords.x = d.Position.X;
                        coords.y = d.Position.Z;
                        break;

                    case 2:
                        // Right
                        if (d.Position.X <= 0) continue;
                        coords.x = d.Position.Y;
                        coords.y = d.Position.Z;
                        break;

                    case 4:
                        // Left
                        if (d.Position.X > 0) continue;
                        coords.x = d.Position.Y;
                        coords.y = d.Position.Z;
                        break;
                }

                switch (dir) {
                    case 1:
                        // Up
                        // Do Nothing
                        break;

                    case 3:
                        // Down

                        break;
                }

                coords.x = center.x + (coords.x / renderscale);
                coords.y = center.y + (coords.y / renderscale);

                ct.fillStyle = fillColor;
                ct.beginPath();
                ct.arc(coords.x, coords.y, size, 0, fullCircle, true);
                ct.fill();
                ct.closePath();
                rc++;
            }
        } catch (err) {
            console.log("DamageDisplay.RenderDamage: " + err.message);
        }
    }

};

jQuery.fn.DamageControl = function () {
    var $this = $(this);
    var template = "";

    Clear();

    $.get("hf-damage-listing.htm", {}, function (data) {
        template = data;
        Render();
    });

    $(document).on("onComponents", function () {
        Render();
    });

    $(document).on("onReset", function () {
        Clear();
    });

    function Clear() {
        $this.html("<div id='damage-none' class='centered bold'><br />ALL COMPONENTS OPERATIONAL</div>");
    }

    function Render() {
        if (template === "") return;
        var td = 0;

        var counter = 0;
        for (var i in componentData) {
            counter++;
            var c = componentData[i];
            var id = c.ID; // "#damage-control-" + c.ID;
            var selector = "[data-id='DC-" + id + "']";
            var selectorI = "[data-id='DCI-" + id + "']";
            var selectorT = "[data-id='DCT-" + id + "']";

            if (c.Name === "") continue;
            if (c.IntegrityR === 1) {
                // Remove?
                if ($(selector).length !== 0) {
                    $(selector).remove();
                }
                continue;
            }

            td++;

            switch (c.Type) {
                case "Battery":
                    //level = c.Stored;
                    break;
                case "Propulsion":
                    //continue;
                    break;
                case "Power":
                    //level = c.Level / c.Max;
                    //section = "components-power";
                    break;
            }

            var integrity = parseInt(100 * c.IntegrityR);
            var dmg = parseInt(100 - (100 * c.IntegrityR));

            if ($(selector).length === 0) {
                // Add
                var nt = template;
                //nt = nt.replace("[Style]", rlstyle);
                nt = replaceAll(nt, "[Index]", counter);
                nt = replaceAll(nt, "[ID]", c.ID);
                nt = replaceAll(nt, "[UID]", c.ID);
                nt = replaceAll(nt, "[Name]", c.Name);
                nt = replaceAll(nt, "[Integrity]", integrity);
                nt = replaceAll(nt, "[DamagePriority]", c.DamagePriority);
                $this.append(nt);
            } else {
                // Edit Existing
                SetText(selectorI, integrity);
                SetData(selectorI, "priority", c.DamagePriority);
                
            }

        }

        // Sort
        //$this.find('.damage-priority-item').sort(sortItems).appendTo($this);

        if (td > 0) {
            if ($("#damage-none").is(":visible"))
                $("#damage-none").hide();
        } else if (!$("#damage-none").is(":visible")) {
            $("#damage-none").show();
        }

    }

    function sortItems(a, b) {
        return ($(b).data('Priority')) < ($(a).data('Priority')) ? 1 : -1;
    }

    function renderTeams() {

    }

};

jQuery.fn.DamageControlTeams = function () {
    var $this = $(this);
    var template = "";

    $this.data("id", 0);

    clearDisplay();

    $.get("hf-damage-team.htm", {}, function (data) {
        template = data;
        renderDisplay();
    });

    $(document).on("onComponents", function () {
        renderDisplay();
    });

    $(document).on("onReset", function () {
        clearDisplay();
    });

    function clearDisplay() {
        $this.html("");
    }

    function renderDisplay() {
        if (template === "") return;
        if (typeof damageTeams === "undefined") return;

        for (var i in damageTeams) {
            var dt = damageTeams[i];
            var id = "#damage-team-" + dt.ID;

            var selectorT = "[data-id='DCT-" + dt.ComponentID + "']";

            if (dt.Name === "") continue;
            if ($(id).length === 0) {
                // Add

                var color = "#111230";

                switch (dt.ID) {
                    case 1: color = "#010082"; break;
                    case 2: color = "#258100"; break;
                    case 3: color = "#800000"; break;
                    case 4: color = "#837d00"; break;
                }

                var nt = template;
                nt = replaceAll(nt, "[ID]", dt.ID);
                nt = replaceAll(nt, "[Color]", color);
                nt = replaceAll(nt, "[Name]", dt.Name);
                nt = replaceAll(nt, "[Activity]", dt.Activity);
                $this.append(nt);
            } else {
                // Edit Existing
                if ($("#damage-team-activity-" + dt.ID).text() !== dt.Activity)
                    $("#damage-team-activity-" + dt.ID).text(dt.Activity);
            }

            // Check Location
            if (dt.ComponentID === "") {
                if ($(id).parent().data("id") !== "") {
                    $(id).detach().appendTo($this);
                }
            } else if (dt.ComponentID !== $(id).parent().data("id")) {
                $(id).detach().appendTo($(selectorT));
            }


        }

    }

};

jQuery.fn.DroneList = function (type, html) {
    var $this = $(this);

    if (typeof type === 'undefined') type = "";
    var dronetype = type;
    var template = "";
    if (typeof html === 'undefined') {
        $.get("hf-drone-listing.htm", {}, function (data) {
            template = data;
            Render();
        });
    } else {
        template = html;
    }

    $(document).on("onReset", function (event) {
        Clear();
    });

    $(document).on("onDroneInfo", function (event) {
        Render();
    });

    function Clear() {
        $this.empty();
    }

    function RenderDocks() {
        try {
            //
        } catch (err) {
            console.log("DroneList.RenderDocks: " + err.message);
        }
    }

    function Render() {
        try {
            if (template === "")
                return;
            if (typeof droneData === 'undefined')
                return;

            var selectDrone = false;

            for (var d in droneData) {
                var dt = droneData[d];
                if (typeof dt === 'undefined')
                    continue;

                if (dronetype !== "" && dt.SubType !== dronetype)
                    continue;

                var id = "#drone-listing-" + dt.ID;

                
                if (selecteddroneid === -1) {
                    selectDrone = true;
                    selecteddroneid = parseInt(dt.ID);
                }

                if (dt.Name === "") continue;
                if ($(id).length === 0) {
                    // Add

                    var icon = "";
                    switch (dt.SubType) {
                        case "Cargo":
                            icon = "cargo";
                            break;
                        case "Repair":
                            icon = "repair";
                            break;
                    }

                    var nt = template;
                    nt = replaceAll(nt, "[ID]", dt.ID);
                    nt = replaceAll(nt, "[Icon]", icon);
                    nt = replaceAll(nt, "[Name]", dt.Name);
                    nt = replaceAll(nt, "[Activity]", dt.Activity);
                    nt = replaceAll(nt, "[DockedAt]", dt.DockedAt);
                    nt = replaceAll(nt, "[Cargo]", "");
                    $this.append(nt);
                } else {
                    // Edit Existing
                    if ($("#drone-activity-" + dt.ID).text() !== dt.Activity)
                        $("#drone-activity-" + dt.ID).text(dt.Activity);
                }
            }

            if (selectDrone && typeof SelectDrone !== "undefined" && typeof selecteddroneid !== "undefined")
                SelectDrone(selecteddroneid);

        } catch (err) {
            console.log("DroneList.Render: " + err.message);
        }
    }

};

// Weapon Groups
jQuery.fn.WeaponGroupList = function () {
    var $this = $(this);
    var snd_loaded = new SoundQue("/sound/missile-loaded.mp3");
    var rendered = false;
    var wgP;
    var wgB;
    var wgM;
    
    $.get("hf-weapongroup-beam.htm", {}, function (data) { wgB = data; if (!rendered) RenderWeaponGroups(); });
    $.get("hf-weapongroup-projectile.htm", {}, function (data) { wgP = data; if (!rendered) RenderWeaponGroups(); });
    $.get("hf-weapongroup-missile.htm", {}, function (data) { wgM = data; if (!rendered)  RenderWeaponGroups(); });

    RenderWeaponGroups();

    $(document).on("onReset", function () {
        $this.empty();
    });

    $(document).on("onWeaponGroupInfo", function () {
        RenderWeaponGroups();
    });

    function RenderWeaponGroups() {
        try {
            if (typeof weaponGroups === "undefined") return;
            if ($this.length === 0) return;
            if (comms === 1 && socketstatus === 0) { return; }
            //if (mission == null) return;

            var hasmissiles = false;

            if (typeof wgM === "undefined") return;
            if (typeof wgB === "undefined") return;
            if (typeof wgM === "undefined") return;

            //$this.html("");

            var list = "";
            var count = 0;
            for (var i in weaponGroups) {
                var w = weaponGroups[i];
                var rlstyle = "";
                count++;
                var groupStatus = "";
                var target = false;
                var maxrange = 0;
                if (w.Name === "") continue;
                var nt = "";

                // Add Html
                if (w.GroupType === "Missile") {
                    nt = wgM;
                } else {
                    nt = wgP;
                }

                if (typeof nt === "undefined")
                    continue;

                var selector = "[data-id='WPNG-" + w.ID + "']";

                switch (w.GroupType) {
                    case "Missile":
                        break;
                    default:
                        if ($(selector).length === 0) {
                            // Add to DOM
                            nt = replaceAll(nt, "[Style]", rlstyle);
                            nt = replaceAll(nt, "[GroupID]", w.ID);
                            nt = replaceAll(nt, "[ID]", w.ID);
                            nt = replaceAll(nt, "[UID]", w.ID);
                            nt = replaceAll(nt, "[Name]", w.Name.toUpperCase());

                            $this.append(nt);

                            $("#group-fireatwill-" + w.ID).on("click", function () {
                                var wgid = $(this).data("id");
                                SendCMD("KMC", "FireGroupAtWill" + wgid);
                            });

                            MapGameKey("#group-fire-" + i, "FireGroup" + w.ID);
                            //MapGameKey("#group-fireatwill-" + i, "FireGroupAtWill" + w.ID, true);

                        }
                        break;
                }

                // UID is Used For Html ID On All Weapons
                var wcnt = 0;
                if (typeof weaponData !== "undefined") {
                    for (var gwi in w.Weapons) {
                        var wpn = weaponData[w.Weapons[gwi]];

                        if (typeof wpn === "undefined" || wpn === null)
                            continue;

                        var charge = 0;
                        charge = wpn.RecycleTime - wpn.Ready;
                        charge = charge / wpn.RecycleTime;

                        if (charge > 1)
                            charge = 1;

                        if (wpn.ProjectileRange > maxrange)
                            maxrange = (wpn.ProjectileRange * .001);

                        var selectorWPN = "[data-id='WPNG-" + wpn.ID + "']";
                        var selectorWPNImage = "[data-id='WPNGI-" + wpn.ID + "']";
                        var selectorWPNStatus = "[data-id='WPNGS-" + wpn.ID + "']";
                        var selectorWPNCharge = "[data-id='WPNGC-" + wpn.ID + "']";
                        var selectorWPNOrdinance = "[data-id='WPNGO-" + wpn.ID + "']";
                        var selectorWPNRange = "[data-id='WPNGR-" + wpn.ID + "']";
                        var selectorWPNFire = "[data-id='WPNGF-" + wpn.ID + "']";
                        
                        switch (w.GroupType) {
                            case "Missile":
                                hasmissiles = true;

                                if ($(selectorWPN).length === 0) {
                                    nt = wgM;
                                    nt = replaceAll(nt, "[Style]", rlstyle);
                                    nt = replaceAll(nt, "[GroupID]", i);
                                    nt = replaceAll(nt, "[ID]", wpn.ID);
                                    nt = replaceAll(nt, "[UID]", wpn.ID);
                                    nt = replaceAll(nt, "[Name]", wpn.Name.toUpperCase());
                                    $this.append(nt);
                                }

                                if (typeof $(selectorWPNImage) !== "undefined") {
                                    if (wpn.AmmoType !== "") {
                                        if (charge === 1) {
                                            // Loaded And Ready
                                            if (!$(selectorWPNImage).is(":visible")) {
                                                snd_loaded.Play();
                                            }

                                            $(selectorWPNImage).show();
                                            if (typeof $(selectorWPNCharge) !== "undefined") {
                                                $(selectorWPNCharge).hide();
                                            }
                                            if (typeof $(selectorWPNOrdinance) !== "undefined") {
                                                SetText(selectorWPNOrdinance, wpn.AmmoType);
                                            }
                                        } else {
                                            // Loading
                                            $(selectorWPNImage).hide();
                                            if (typeof $(selectorWPNCharge) !== "undefined") {
                                                $(selectorWPNCharge).show();
                                                $(selectorWPNCharge).css("width", parseInt(charge * $(selectorWPNCharge).parent().width()));
                                            }
                                            if (typeof $(selectorWPNOrdinance) !== "undefined") {
                                                SetText(selectorWPNOrdinance, "EMPTY");
                                            }
                                        }
                                    } else {
                                        // Empty
                                        $(selectorWPNImage).hide();
                                        $(selectorWPNCharge).hide();
                                        SetText(selectorWPNOrdinance, "EMPTY");
                                    }
                                }

                                if (charge === 1 && wpn.CurrentTargetID !== "" && wpn.AmmoType !== "")
                                    target = true;
                                else
                                    target = false;

                                // Missile Updates
                                if (!target) 
                                    AddClass(selectorWPNFire, "dim");
                                else 
                                    RemoveClass(selectorWPNFire, "dim");

                                $(selectorWPNStatus).html(groupStatus);
                                $(selectorWPNRange).html("RANGE: " + maxrange + "km");

                                break;
                            default:
                                // Update Status
                                if (valert > 5) {
                                    groupStatus += "<img id=\"weapon-lock-[ID]\" class=\"weapon-lock[LockOn]\" src=\"/images/lockon.png\" />";
                                    groupStatus = replaceAll(groupStatus, "[ID]", wcnt);

                                    if (wpn.CurrentTargetID !== "") { //WpnLockOn7161
                                        groupStatus = replaceAll(groupStatus, "[LockOn]", " locked");
                                        target = true;
                                    } else {
                                        groupStatus = replaceAll(groupStatus, "[LockOn]", "");
                                    }

                                    $("#group-fireatwill-" + w.ID).prop('checked', w.FireAtWill);
                                    if (!target) {
                                        if (!$("#group-fire-" + w.ID).hasClass("dim"))
                                            $("#group-fire-" + w.ID).addClass("dim");
                                    } else {
                                        if ($("#group-fire-" + w.ID).hasClass("dim"))
                                            $("#group-fire-" + w.ID).removeClass("dim");
                                    }

                                    SetHtml("#weapon-group-status-" + w.ID, groupStatus);
                                }
                                break;
                        }

                        wcnt++;
                    }

                    SetText("#weapon-group-range-" + w.ID, "RANGE: " + maxrange + "km");
                }
            }

            if (hasmissiles && $("#weapons-selected-ordinance").length === 0) {
                var mos = "<div id='weapons-selected-ordinance' class='panel-area pad-top centered'><div class='panel-header'>SELECTED ORDINANCE</div><br /><div id='selected-ordinance-name'>- NONE -</div><br /><div class='btn w200' onclick='ShowOrdinance()'>SELECT</div></div>";
                $this.append(mos);
            }

            //Set Actions Based on Status
            switch (valert) {
                case 3:
                    $("div[id^=group-fireatwill-]").text("OFF");
                    $("div[id^=group-fireatwill-]").addClass("main-red");
                    $("div[id^=group-fireatwill-]").removeClass("main-green");
                    $("div[id^=group-fireatwill-]").hide();
                    $(".weapon-load").show();
                    $(".weapon-fire").hide();
                    $("div[id^=group-fire-]").hide();
                    $("div[id^=weapon-offline-]").hide();
                    $("div[id^=weapon-ordinance-]").show();
                    $("div[id^=weapon-lock-]").show();
                    break;
                case 4:
                    $("div[id^=group-fire-]").show();
                    $("div[id^=group-fireatwill-]").show();
                    $(".weapon-load").show();
                    $(".weapon-fire").show();
                    $("div[id^=weapon-offline-]").hide();
                    $("div[id^=weapon-ordinance-]").show();
                    $("div[id^=weapon-lock-]").show();
                    break;
                default:
                    $("div[id^=group-fire-]").hide();
                    $("div[id^=group-fireatwill-]").text("OFF");
                    $("div[id^=group-fireatwill-]").addClass("main-red");
                    $("div[id^=group-fireatwill-]").removeClass("main-green");
                    $("div[id^=group-fireatwill-]").hide();
                    $(".weapon-load").hide();
                    $(".weapon-fire").hide();
                    $("div[id^=weapon-offline-]").show();
                    $("div[id^=weapon-ordinance-]").hide();
                    $("div[id^=weapon-lock-]").hide();
                    break;
            }
  
        } catch (err) {
            console.log("weaponGroupList: " + err.message);
        }
        rendered = true;
    }

};

// Weapon Listing
jQuery.fn.WeaponList = function () {
    var $this = $(this);
    var header = "";
    var template = "";
    var template2 = "";
    var headersRendered = false;

    $.get("hf-component-header.htm", {}, function (data) { header = data; });
    $.get("hf-component-level-w.htm", {}, function (data) { template = data; });

    $(document).on("onReset", function () {
        headersRendered = false;
        $this.html("");
    });

    $(document).on("onWeaponInfo", function () {
        Render();
    });

    function Render() {
        try {
            if (typeof weaponData === "undefined") return;
            if ($this.length === 0) return;
            if (comms === 1 && socketstatus === 0) { return; }
            if (mission === null) return;

            if (header === "") return;
            if (template === "") return;

            var section = "components-projectile";

            if (!headersRendered) {
                $this.append("<div>");
                $this.append(header.replace("[ID]", "projectile").replace("[Name]", "PROJECTILE"));
                $this.append(header.replace("[ID]", "missle").replace("[Name]", "MISSLE"));
                $this.append("</div>");
                headersRendered = true;
            }

            var list = "";
            for (var i in weaponData) {
                var w = weaponData[i];
                var rlstyle = "";

                var selector = "[data-id='WL-" + w.ID + "']"; 

                if (w.Name === "") continue;

                if ($(selector).length === 0) {
                    // Add

                    if (w.WeaponType === "Missile") {
                        section = "components-missle";
                        icon = "missile";
                        var mismsg = "";
                        if (w.AmmoType === "") {
                            mismsg = "Empty";
                        } else if (charge === 1) {
                            mismsg = "Loaded: " + w.AmmoType;
                        } else {
                            mismsg = "Loading: " + w.AmmoType;
                        }
                    } else {
                        section = "components-projectile";
                        icon = "projectile";
                    }

                    var nt = template;
                    nt = replaceAll(nt, "[Style]", rlstyle);
                    nt = replaceAll(nt, "[ID]", w.ID);
                    nt = replaceAll(nt, "[UID]", w.ID);
                    nt = replaceAll(nt, "[Name]", w.Name);
                    nt = replaceAll(nt, "[Icon]", icon);
                    nt = replaceAll(nt, "[Range]", toMetric(w.ProjectileRange * scale));
                    nt = replaceAll(nt, "[Description]", w.Class);
                    //nt = replaceAll(nt, "[Item.Integrity]", 192);
                    //nt = nt.replace("Item.LockOn", w.CurrentTargetID != "" ? "LockOn" : "");

                    //if (w.CurrentTargetID !== "") { //WpnLockOn7161
                    //    nt = replaceAll(nt, "[LockOn]", "LockOn");
                    //} else {
                    //    nt = replaceAll(nt, "[LockOn]", "");
                    //}
                    var charge = 0;
                    charge = w.RecycleTime - w.Ready;
                    charge = charge / w.RecycleTime;
                    if (charge > 1) charge = 1;
                    nt = replaceAll(nt, "[Charge]", parseInt(charge * 192));

                    $("#" + section).append(nt);

                } else {
                    //Update Html
                    
                    //if (w.CurrentTargetID != "") {
                    //    $("#WpnCharge" + w.ID).addClass("LockOn");
                    //} else {
                    //    $("#WpnCharge" + w.ID).removeClass("LockOn");
                    //}

                    // Active Charge
                    var chargeC = w.LevelR / 1;
                    $(selector).find(".component-charge").css("width", parseInt(chargeC * 150));

                    // Recycle
                    var charge2 = 0;
                    charge2 = w.RecycleTime - w.Ready;
                    charge2 = charge2 / w.RecycleTime;
                    if (charge2 > 1) charge2 = 1;

                    $(selector).find(".component-charge-level").css("width", parseInt(charge2 * 150));

                    if (w.BaseType === "Missile") {
                        if (w.AmmoType === "") {
                            $("#weapon-ord-" + w.ID).html("Empty");
                        } else if (charge === 1) {
                            $("#weapon-ord-" + w.ID).html("Loaded: " + w.AmmoType);
                        } else {
                            $("#weapon-ord-" + w.ID).html("Loading: " + w.AmmoType);
                        }
                    }

                }

            }

        } catch (err) {
            console.log("weaponList: " + err);
        }
    }

};

// Comm Channel Listing
jQuery.fn.CommChannelList = function () {
    var $this = $(this);

    SendCMD('CCL', '');

    $(document).on("onCommChannel", function () {

        try {
            if (typeof commChannels === "undefined") return;
            if ($this.length === 0) return;
            if (comms === 1 && socketstatus === 0) { return; }
            if (mission === null) return;

            var list = "";
            for (var i in commChannels) {
                var d = commChannels[i];
                var rlstyle = "";
                var nt = hf_CommListing;
                var iostr = "";
                var msgs = "&nbsp;";
                var state = "";
                var targetname = d.Target.Name;
                var itemstyle = "item-object";

                if (!d.Visible) {
                    $("#comm-tab-area-" + d.ID).hide();
                }

                switch (d.Target.BaseType) {
                    case "Planet":
                        itemstyle = "item-planet";
                        break;
                    case "Station":
                        if (d.Target.Faction !== thisvessel.Faction && d.Target.Faction !== "") itemstyle = "item-object-enemy";
                        break;
                    case "Vessel":
                        itemstyle = "item-vessel";
                        if (d.Target.Faction !== thisvessel.Faction && d.Target.Faction !== "") itemstyle = "item-vessel-enemy";
                        break;
                    case "Missile":
                        continue;
                    default:
                        if (d.Target.Faction !== thisvessel.Faction && d.Target.Faction !== "") itemstyle = "item-object-enemy";
                        break;
                }

                switch (d.State) {
                    case "Hailing":
                        state = "H<br />A<br />I<br />L";
                        rlstyle = "main-blue";
                        iostr += "<div class='question' onclick='OpenCommChannel([Target.ID])'>Hail Them Again...</div>";
                        break;
                    case "Open":
                        state = "O<br />P<br />E<br />N";
                        rlstyle = "main-green";

                        switch (d.Target.BaseType) {
                            case "Object":
                                targetname = "Object";
                                break;
                            case "Station":
                            case "Vessel":
                                if (d.Target.SubType === "Station") {
                                    if (thisvessel.Maneuver === "Docked") {
                                        iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'RequestDeparture','Request permission to Depart')\">Request permission to Depart</div>";
                                    } else if (thisvessel.Maneuver === "Departing" || thisvessel.Maneuver === "Docking") {
                                        // No Nothing
                                    } else {
                                        iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'RequestDock','Request permission to Dock')\">Request permission to Dock</div>";
                                    }
                                    //iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'RequestManifest','What is your Cargo Manifest?')\">What is your Cargo Manifest?</div>";
                                } else if (d.Target.SubType === "Satellite") {
                                    // No Nothing
                                } else {
                                    if (thisvessel.Faction === d.Target.Faction) {
                                        iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'AttackTarget','Attack our Target!')\">Attack our Target!</div>";
                                    } else {
                                        iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'Surrender','Surrender!')\">Surrender!</div>";
                                        iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'Taunt','Taunt Them!')\">Taunt Them!</div>";
                                    }
                                    iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'RequestDestination','What is your current Destination?')\">What is your current Destination?</div>";
                                    iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'RequestManifest','What is your Cargo Manifest?')\">What is your Cargo Manifest?</div>";
                                }

                                break;

                            case "":
                                break;
                        }

                        iostr += "<div class='question' onclick=\"SendCommMessage([Target.ID],'RequestStatus','What is your Status?')\">What is your Status?</div>";
                        break;
                }

                for (var mi in messageData) {
                    var m = messageData[mi];
                    if (m.SenderID === d.Target.ID) {
                        msgs = "<div align='right'><div class='comm-msg'><div class='comm-them'>" + m.Text + "</div></div></div>" + msgs;
                    } else if (m.TargetID === d.Target.ID) {
                        msgs = "<div class='comm-msg'><div class='comm-this'>" + m.Text + "</div></div>" + msgs;
                    }
                }
                //if (msgs != "&nbsp;") msgs = "<span class='lg'>Last Message:</span> " + msgs;
                //if (msgs != "&nbsp;") msgs = "<div class='comm-msg'><div class='comm-them'>" + msgs + "</div></div> ";

                //if (currenttargetid == o.ID) { rlstyle = "background-color: Blue;"; }
                nt = replaceAll(nt, "[Target.Icon]", itemstyle);
                nt = replaceAll(nt, "[Item.Messages]", msgs);
                nt = replaceAll(nt, "[Item.Options]", iostr);
                nt = replaceAll(nt, "[Style]", rlstyle);
                nt = replaceAll(nt, "[Target.ID]", d.Target.ID);
                nt = replaceAll(nt, "[Target.Name]", targetname);
                nt = replaceAll(nt, "[Item.State]", state);
                nt = replaceAll(nt, "[Item.Topics]", d.Topics);
                list = list + nt;
            }

            $this.html(list);
            //$this.scrollTop($this[0].scrollHeight);
            //$this.scrollTop($this.prop("scrollHeight"));
        } catch (err) {
            console.log("commChannelList: " + err);
        }
        //deckProcessing = false;
    });

};

// Comm Group Listing (CURRENT)
jQuery.fn.CommList = function () {
    var $this = $(this);
    var snd_chanopen = new SoundQue("/sound/channel-open.mp3");
    var snd_chanclose = new SoundQue("/sound/channel-close.mp3");
    var snd_msgnew = new SoundQue("/sound/message-new.mp3");
    var hf_tab = "";
    var firstrender = true;
    $.get("hf-comm-tab.htm", {}, function (data) { hf_tab = data; renderList(); });

    $(document).on("onCommChannel", function (event) {
        renderList();
    });

    $(document).on("onCommChannelSelect", function (event, channelid) {

    });

    $(document).on("onCommChannelClose", function (event, channelid) {
        $("#comm-tab-area-" + channelid).remove();
        $("#comm-channel-" + channelid).remove();

        // Sound
        snd_chanclose.Play();
    });

    $(document).on("onCommMessage", function (event, message) {
        renderMessage(message);            
    });

    $(document).on("onReset", function (event) {
        $("#comm-tabs").empty();
        $("#comm-activity").empty();
    });

    function renderList() {
        try {
            if (typeof thisvessel === "undefined") {
                SendCMD('CCL', '');
                return;
            }
            if (typeof commChannels === "undefined") return;
            if ($this.length === 0) return;
            if (comms === 1 && socketstatus === 0) { return; }
            if (mission === null) return;
            var list = "";

            for (var i in commChannels) {
                // Each Channel
                var cc = commChannels[i];

                if (typeof cc.ID === "undefined")
                    continue;

                //if (!cc.Visible) {
                //    $("#comm-tab-area-" + cc.ID).hide();
                //    continue;
                //}

                var rlstyle = "";
                var nt = hf_CommListing;
                var iostr = "";
                var msg = "";
                var state = "";
                var channelname = cc.Name;
                var itemstyle = "item-object";
                var chanid = "#comm-channel-" + cc.ID;
                var chanmsgsid = "#comm-messages-" + cc.ID;
                var commtabid = "#comm-tab-" + cc.ID;
                var commtabarea = "#comm-tab-area-" + cc.ID;

                // Add Section?
                if ($(commtabarea).length === 0) {
                    //if (thisvessel.ID == cc.Target.ID) continue;

                    // Set Tab
                    var newtab = hf_tab;
                    newtab = replaceAll(newtab, "[Sender.ID]", cc.ID);
                    newtab = replaceAll(newtab, "[Sender.Name]", cc.Name);
                    newtab = replaceAll(newtab, "[Sender.Icon]", itemstyle);
                    newtab = replaceAll(newtab, "[Channel.Icon]", "comm-icon-text");

                    $("#comm-tabs").append(newtab);

                    // Set Channel
                    var chan = hf_CommListing;
                    chan = replaceAll(chan, "[Sender.Icon]", itemstyle);
                    chan = replaceAll(chan, "[Sender.ID]", cc.ID);
                    chan = replaceAll(chan, "[Sender.Name]", cc.Name);

                    // Add
                    $("#comm-activity").append(chan);
                    Resize();

                    // Can Close?
                    if (!cc.CanClose) {
                        $("#channel-close-" + cc.ID).addClass("hidden");
                    }

                    // Data
                    $(commtabarea).data("id", cc.ID);
                    $(commtabarea).data("total", 0);
                    $(commtabarea).data("new", 0);
                    $(commtabarea).data("participants", cc.Participants.length);

                    // Sound!
                    if (!firstrender)
                        snd_chanopen.Play();
                } else {
                    // Update
                    if (cc.Name != "")
                        SetText("#comm-tab-name-" + cc.ID, cc.Name);
                    if (selectedid === cc.ID) {
                        SetText("#channel-name-" + cc.ID, cc.Name);
                        SetText("#response-target", cc.Name);
                    }
                }

                var totalmsgs = $(commtabarea).data("total");
                var totalnew = $(commtabarea).data("new");
                $("#comm-tab-new-" + cc.ID).hide();

                // Add Messages
                for (var mi in cc.Messages) {
                    var m = cc.Messages[mi];

                    totalmsgs++;
                    if (msg.Viewed === false) {
                        totalnew++;
                    }

                    renderMessage(m, true);
                }

                // Set Data
                $(commtabarea).data("total", totalmsgs);
                $(commtabarea).data("new", totalnew);
                $(commtabarea).data("participants", cc.Participants.length);

                if (typeof m !== "undefined") {
                    if (totalnew === 0 || selectedid === cc.ID) {
                        $("#comm-tab-new-" + cc.ID).hide();
                    } else {
                        $("#comm-tab-new-" + cc.ID).text(totalnew);
                        $("#comm-tab-new-" + cc.ID).show();
                    }
                } else {
                    $("#comm-tab-new-" + cc.ID).hide();
                }

                // Auto-Select
                if (selectedid === 0 || typeof selectedid === "undefined") {
                    ShowChannel(cc.ID);
                } else if (selectedid === cc.ID) {
                    ShowChannel(cc.ID, false);
                }

                // Scroll?
                ScrollToBottom(chanmsgsid);

                if ($(chanmsgsid).length !== 0 && $(chanmsgsid).html().length === 0) {
                    $(chanmsgsid).append("<div id='comm-empty-" + cc.ID + "' class='centered'><br /><br />There are currently no tramissions on this channel.<br /><br />To transmit a message on this channel, <br/>click the NEW button on the left<div>");
                } else {
                    $("#comm-channel-" + cc.ID + "-empty").hide();
                }
            }

            firstrender = false;

        } catch (err) {
            console.log("renderList: " + err);
        }

    }

    function renderMessage(msg) {
        try {
            var media = "";
            var msgtext = msg.Text.replace(/(?:\r\n|\r|\n)/g, '<br>');
            var msgstr = "";
            var msgisours = false;
            var totalparticipants = $("#comm-tab-area-" + msg.CommChannelID).data("participants");

            // If it's already present, continue
            var msgid = "comm-message-" + msg.ID;
            var msgOptions = "";
            if ($("#" + msgid).length > 0) return;

            if (msg.Media !== "") {
                media += " <span onclick=\"SendCMD('MDP', '" + msg.Media + "');\">Play Message</span>";
            }

            //switch (msg.Subject) {
            //    case "Location":
            //        msgOptions = "<div class='comm-link'>Send To: " + GetWaypointLink("Flight", msg.Key) + " | " + GetWaypointLink("Tactical", msg.Key) + " | " + GetWaypointLink("Sciences", msg.Key) + " | " + GetWaypointLink("All", msg.Key) + "</div>";
            //        break;
            //}

            if (msg.SenderID === thisvessel.ID) {
                // Our Ship
                msgisours = true;
                msgstr = "<div><div class='comm-tag'>==</div><div id='" + msgid + "' class='comm-msgs'><div class='comm-this'>" + msgtext + msgOptions + media + "</div></div></div>";
            } else {
                // Other Vessel
                var vesselname = "";
                if (totalparticipants > 1) {
                    vesselname = msg.SenderName;
                }
                msgstr = "<div><div class='comm-tag'></div><div id='" + msgid + "' class='comm-msgs'><div class='comm-sender'>" + vesselname + "</div><div class='comm-them'>" + msgtext + msgOptions + media + "</div></div></div>";
            }
                    
            // Topics
            msgstr = msgstr.replace(/\[Topic:(.*?)\]/, "<span class=\"topic\" onclick=\"AskTopic('Open', '$1')\">$1</span>");

            //msg = replaceAll(msg, "[Sender.Icon]", itemstyle);
            msgstr = replaceAll(msgstr, "[Item.Messages]", msgstr);
            //msg = replaceAll(msg, "[Item.Options]", iostr);
            //msg = replaceAll(msg, "[Style]", rlstyle);
            msgstr = replaceAll(msgstr, "[Sender.ID]", msg.SenderID);
            msgstr = replaceAll(msgstr, "[Sender.Name]", msg.SenderName);
            //msg = replaceAll(msg, "[Item.State]", state);

            // Add
            $("#comm-messages-" + msg.CommChannelID).append(msgstr);
            $("#comm-empty-" + msg.CommChannelID).hide();

            // Set Data
            var totalmsgs = $("#comm-tab-area-" + msg.CommChannelID).data("total");
            var totalnew = $("#comm-tab-area-" + msg.CommChannelID).data("new");
            $("#comm-tab-area-" + msg.CommChannelID).data("total", totalmsgs++);

            if (!msgisours && msg.Viewed === false && selectedid !== msg.CommChannelID) {
                $("#comm-tab-area-" + msg.CommChannelID).data("new", totalnew++);
                $("#comm-tab-new-" + msg.CommChannelID).text(totalnew);
                $("#comm-tab-new-" + msg.CommChannelID).show();
            }

            // Scroll?
            ScrollToBottom("#comm-messages-" + msg.CommChannelID);

            // Reset Topics?
            if (selectedid === msg.CommChannelID) 
                RequestTopics();

            // Sound!
            if (!firstrender && msg.SenderID !== thisvessel.ID)
                snd_msgnew.Play();

        } catch (err) {
            console.log("renderMessage: " + err);
        }
    }

    function GetWaypointLink(role, source) {
        return "<div class='link' onclick=\"SendCMD('', '');\">" + role + "</div>";
    }

};

// Comm Message Listing
// DEPRECIATED
jQuery.fn.MessageList = function (layout) {
    var $this = $(this);

    SendCMD('CML', '');

    $(document).on("onCommMessage", function () {

        try {
            if (typeof messageData === "undefined") return;
            if ($this.length === 0) return;
            if (comms === 1 && socketstatus === 0) { return; }
            if (mission === null) return;

            var list = "";

            for (var i in messageData) {
                var m = messageData[i];
                if (m.SenderID !== thisvessel.ID) {
                    var nt = layout;
                    var style = "friendly";

                    var t1 = new Date(m.Timestamp);
                    var t2 = new Date();
                    var dif = t1.getTime() - t2.getTime();

                    var secfrom = dif / 1000;
                    var seconds = Math.abs(secfrom);
                    var minutes = Math.round(seconds / 60, 0);
                    if (minutes > 0) {
                        minutes = minutes + " Minutes Ago";
                    } else {
                        minutes = "Just Now";
                    }

                    if (m.Sender.Name === "Object") {
                        style = "unknown";
                    } else if (m.Sender.Faction !== thisvessel.Faction) {
                        style = "enemy";
                    }

                    var icon = "item-object";

                    switch (m.Sender.BaseType) {
                        case "Planet":
                            icon = "item-planet";
                            break;
                        case "Station":
                            if (m.Sender.Faction !== thisvessel.Faction) itemstyle = "item-object-enemy";
                            break;
                        case "Vessel":
                            icon = "item-vessel";
                            if (m.Sender.Faction !== thisvessel.Faction) itemstyle = "item-vessel-enemy";
                            break;
                        case "Missile":
                            continue;
                        default:
                            if (m.Sender.Faction !== thisvessel.Faction) itemstyle = "item-object-enemy";
                            break;
                    }

                    nt = replaceAll(nt, "[Item.Message]", m.Text);
                    nt = replaceAll(nt, "[Item.Options]", "");
                    nt = replaceAll(nt, "[Item.Topics]", ""); //d.Topics
                    nt = replaceAll(nt, "[Item.Since]", minutes);
                    nt = replaceAll(nt, "[Style]", style);
                    nt = replaceAll(nt, "[Sender.ID]", m.Sender.ID);
                    nt = replaceAll(nt, "[Sender.Name]", m.Sender.Name);
                    nt = replaceAll(nt, "[Sender.Icon]", icon);

                    list = nt + list;
                } else if (m.TargetID === d.Target.ID) {
                    //msgs = "<div class='comm-msg'><div class='comm-this'>" + m.Text + "</div></div>" + msgs;
                }
            }
            //if (msgs != "&nbsp;") msgs = "<span class='lg'>Last Message:</span> " + msgs;
            //if (msgs != "&nbsp;") msgs = "<div class='comm-msg'><div class='comm-them'>" + msgs + "</div></div> ";

            //if (currenttargetid == o.ID) { rlstyle = "background-color: Blue;"; }

            $this.html(list);

        } catch (err) {
            console.log("messageList: " + err);
        }
        //deckProcessing = false;
    });

};

// Crew Listing
jQuery.fn.CrewList = function () {
    var $this = $(this);
    //if (crewfilter_deck == undefined) deck = -1;
    //if (crewfilter_activity == undefined) activity = -1;
    //if (alive == undefined) alive = true;
    //var deckProcessing = false;

    var listTemplate = "";

    $.get("hf-crew-listing.htm", {}, function (data) {
        listTemplate = data;
        RenderCrewListing();
    });

    $(document).on("onCrewInfo", function () {
        RenderCrewListing();
    });

    function RenderCrewListing() {
        try {
            if (typeof crewData === "undefined") return;
            if ($this.length === 0) return;
            //if (deckProcessing == true) return;
            if (comms === 1 && socketstatus === 0) { return; }
            if (mission === null) return;

            //deckProcessing = true;

            var list = "";
            for (var i in crewData) {
                var d = crewData[i];
                var rlstyle = "";
                var status = "alertStatus1";

                try {
                    if (typeof selectedcrewid !== "undefined") {
                        if (d.ID === selectedcrewid) {
                            rlstyle = "background-color: darkblue;";
                            UpdateCrewDetail(d);
                        }
                    }
                } catch (err) {
                    console.log("CrewList.Selected: " + err.message);
                }

                if (d.LastName === "") continue;
                if (typeof top.crewfilter_deck !== "undefined" && top.crewfilter_deck !== d.Deck) continue;
                if (typeof top.crewfilter_activity !== "undefined" && top.crewfilter_activity !== d.Activity) continue;
                if (typeof top.crewfilter_alive !== "undefined" && top.crewfilter_alive !== d.Alive) continue;
                if (typeof top.crewfilter_injured !== "undefined") {
                    if (top.crewfilter_injured === true && d.Health === 1) continue;
                    if (top.crewfilter_injured === false && d.Health !== 1) continue;
                }

                if (!d.Alive) {
                    rlstyle = "background-color: darkred;";
                    status = "alertStatus4";
                } else if (d.Health < 1) {
                    status = "alertStatus3";
                }

                var nt = listTemplate;
                //if (currenttargetid == o.ID) { rlstyle = "background-color: Blue;"; }
                nt = nt.replace("[Style]", rlstyle);
                nt = nt.replace("[Status]", status);
                nt = replaceAll(nt, "[Item.ID]", d.ID);
                nt = nt.replace("[Item.FirstName]", d.FirstName);
                nt = nt.replace("[Item.LastName]", d.LastName);
                nt = nt.replace("[Item.GenderIcon]", d.Gender.toLowerCase());
                nt = nt.replace("[Item.Heartrate]", d.Heartrate);
                nt = nt.replace("[Item.Health]", parseInt(d.Health * 192));
                nt = nt.replace("[Item.Rank]", d.Rank);

                //if (deckData != undefined) {
                //    //var deck = deckData[d.Deck];
                //    if (deckData[d.Deck].OfficerID == d.ID) {
                //        nt = nt.replace("[Item.Deck]", d.Deck + " Deck Officer");
                //    } else {
                //        nt = nt.replace("[Item.Deck]", d.Deck);
                //    }
                //} else {
                nt = nt.replace("[Item.Deck]", d.Deck);
                //}

                if (d.Alive) {
                    switch (d.Activity) {
                        case "OnDuty":
                            if (d.Conscious)
                                nt = nt.replace("[Item.Activity]", "On Duty");
                            else
                                nt = nt.replace("[Item.Activity]", "Unconscious");
                            break;
                        case "OffDuty":
                            if (d.Conscious)
                                nt = nt.replace("[Item.Activity]", "Off Duty");
                            else
                                nt = nt.replace("[Item.Activity]", "Unconscious");
                            break;
                        case "Asleep":
                            nt = nt.replace("[Item.Activity]", "Asleep");
                            break;
                        default:
                            nt = nt.replace("[Item.Activity]", d.Activity);
                            break;
                    }
                } else {
                    nt = nt.replace("[Item.Activity]", "DEAD");
                }


                list = list + nt;
            }

            $this.html(list);
        } catch (err) {
            console.log("crewList: " + err);
        }
    }

};

// Deck Listing
jQuery.fn.DeckList = function (layout) {
    var $this = $(this);
    var deckProcessing = false;
    var template = hf_DeckListing;
    if (typeof layout !== "undefined" && layout !== "") template = layout;

    $(document).on("onDeckInfo", function () {

        try {
            if (typeof deckData === "undefined") return;
            if ($this.length === 0) return;
            if (deckProcessing === true) return;
            if (comms === 1 && socketstatus === 0) { return; }
            if (mission === null) return;

            deckProcessing = true;
            var allconfirmed = true;
            var id = 0;

            // Header?
            if ($("#all-decks").length === 0) {
                $this.append("<div id='all-decks' class='bold centered padded' style='width: auto;'>-</div>");
            }

            var list = "";
            for (var i in deckData) {
                var d = deckData[i];
                id++;

                if (d.Name === "") continue;
                if (d.Alert !== valert) allconfirmed = false;
                if (template === "") template = hf_DeckListing;

                if ($("#deck-" + id).length === 0) {
                    // New
                    var nt = template;
                    nt = replaceAll(nt, "[Deck.ID]", id);
                    nt = replaceAll(nt, "[Deck.Name]", d.Name);
                    nt = replaceAll(nt, "[Deck.Alert]", d.Alert);
                    nt = replaceAll(nt, "[Deck.Temperature]", d.Temperature);
                    nt = replaceAll(nt, "[Deck.Officer.ID]", d.OfficerID);
                    nt = replaceAll(nt, "[Deck.Officer.Name]", d.OfficerName);
                    $this.append(nt);
                } else {
                    // Update
                    if ($("#deck-name-" + id).text() !== d.Name)
                        $("#deck-name-" + id).text(d.Name);
                    if ($("#deck-temperature-" + id).text() !== d.Temperature.toString())
                        $("#deck-temperature-" + id).text(d.Temperature);
                    if ($("#deck-officer-id-" + id).text() !== d.OfficerID.toString())
                        $("#deck-officer-id-" + id).text(d.OfficerID);
                    if ($("#deck-officer-name-" + id).text() !== d.OfficerName)
                        $("#deck-officer-name-" + id).text(d.OfficerName);

                    if (!$("#deck-alert-" + id).hasClass("alert-" + d.Alert)) {
                        $("#deck-alert-" + id).removeClass(function (index, className) {
                            return (className.match(/(^|\s)alert-\S+/g) || []).join(' ');
                        });
                        $("#deck-alert-" + id).addClass("alert-" + d.Alert);
                    }

                }
            }

            var deckstatus = "REPORTING IN PROGRESS";
            if (allconfirmed) {
                deckstatus = "ALL DECKS CONFIRMED";
            }

            if ($("#all-decks").text() !== deckstatus)
                $("#all-decks").text(deckstatus);

        } catch (err) {
            console.log("deckList: " + err);
        }
        deckProcessing = false;
    });

};

// Cargo Listing
jQuery.fn.CargoList = function (layout) {
    var $this = $(this);
    var template = "<div class='cargo-listing [Style]'><div class='container-icon [Item.Icon]'></div><div class='cargo-name'>[Item.Name]</div><div class='cargo-qty'>[Item.Quantity] [Item.Container]</div></div>";
    if (typeof layout !== "undefined" && layout !== "")
        template = layout;

    $(document).on("onCargoInfo", function () {
        Render();
    });

    function Render() {
        try {
            if (typeof cargoData === "undefined") return;
            if ($this.length === 0) return;
            if (comms === 1 && socketstatus === 0) { return; }
            //if (mission === null) return;

            var list = "";
            for (var i in cargoData) {
                var c = cargoData[i];

                if (selectedcargoid === -1)
                    selectedcargoid = parseInt(i);

                var nitem = template;
                var mi = c.Total > 1 ? "s" : "";
                nitem = replaceAll(nitem, "[Item.ID]", i);
                if (c.Icon !== "")
                    nitem = replaceAll(nitem, "[Item.Image]", "background-image: url('" + c.Icon + "')");
                nitem = replaceAll(nitem, "[Item.Icon]", c.Container === "" ? "" : c.Container.toLowerCase());
                nitem = replaceAll(nitem, "[Item.Name]", c.Name);
                nitem = replaceAll(nitem, "[Item.Container]", c.Container === "Passenger" ? "" : c.Container + mi);
                nitem = replaceAll(nitem, "[Item.Quantity]", c.Total);
                //nitem = replaceAll(nitem, "[Item.Description]", c.Description);
                nitem = replaceAll(nitem, "[Item.Description]", c.Container);

                list = list + nitem;
            }

            $this.html(list);

            if (typeof SelectCargo !== "undefined" && typeof selectedcargoid !== "undefined")
                SelectCargo(selectedcargoid);

        } catch (err) {
            console.log("cargoList: " + err);
        }
    }

};

// Component Levels
jQuery.fn.ComponentLevelsVertical = function () {
    var $this = $(this);
    var co = randomColor();

    $(document).on("onComponents", function () {
        if (componentData === null) return;

        var pw = 400; // $this.parent().height();
        var idx = -1;

        var list = "";
        for (var i in componentData) {
            idx++;
            var c = componentData[i];
            if (c.Name === "") continue;
            //if (c.Type == "Propulsion") continue;
            var level = c.LevelR;
            if (level === 0 && c.Level > 0) level = 1;

            if (c.Color === "") {
                c.Color = randomColor();
            }

            switch (c.Type) {
                case "Battery":
                    //level = c.Stored;
                    break;
                //case "Propulsion":
                //    //continue;
                //    break;
                case "Engine":
                    //level = c.Level / c.Max;
                    break;
            }

            var h = parseInt(pw * (level / 1));
            //if (!c.Online) h = 0;

            if ($("#VC" + idx).length === 0) {
                //Add Div
                var nt = "<div id='VC" + idx + "' class='GaugeVertialPad'>";
                nt += "<div class='GuageVertical'></div><div class='GuageMax'><div id='VCL" + idx + "' class='GaugeLevelVertical' style='background-color:" + c.Color + ";height:" + h + "px;'></div></div>";
                nt += "<div id='VCN" + idx + "' class=\"GuageLabel\">" + c.Name + "</div>";

                if (c.Status === 1) {
                    //nt += "<div id='VCC" + idx + "' class=\"btn GuageOnline\" onclick=\"toggleComponent(" + idx + ")\">OFF</div>";
                } else {
                    //nt += "<div id='VCC" + idx + "' class=\"btn GuageOffline\" onclick=\"toggleComponent(" + idx + ")\">ON</div>";
                }

                //nt += "<div class=\"GuageLabel\">" + c.Name + "</div>";
                //nt += "<div id='VCO" + idx + "' class=\"GuageOffline\" onclick=\"SendCMD('ECO', '" + idx + "');\">OFF</div>"; //idx
                nt += "</div>";
                $this.append(nt);
            } else {
                //Edit Existing
                pw = $("#VCL" + idx).parent().height();

                $("#VCL" + idx).height(h);
                $("#VCN" + idx).html(c.Name); // + "<br />" + Math.floor(c.Level));
                //var cd = $("#VCC" + idx);
                //if (c.Status == 1) {
                //    cd.text("ON");
                //    cd.addClass("GuageOnline");
                //    cd.removeClass("GuageOffline");
                //} else {
                //    cd.text("OFF");
                //    cd.addClass("GuageOffline");
                //    cd.removeClass("GuageOnline");
                //}
            }

            //list = list + nt;

        }

        //$this.html(list);

    });
};

// Component Levels
jQuery.fn.ComponentLevels = function () {
    var $this = $(this);
    var co = randomColor();
    var header = "";
    var template = "";
    var template2 = "";
    var headersRendered = false;

    var levelDown = false;

    $.get("hf-component-header.htm", {}, function (data) { header = data; });
    $.get("hf-component-level.htm", {}, function (data) { template = data; });

    $(document).on("onReset", function () {

    });

    $(document).on("onComponents", function () {
        Render();
    });

    $(document).on("mousedown", ".vc-charge-level", function (event) {
        levelDown = true;
        //var location = GetEventCoords($(this), event);
        //var max = parseInt($(this).width());

        //var data = Object.create(null);
        //data.ID = $(this).data("id");
        //data.Level = 2 * (location.x / max);
        //SendCMD("ECCF", JSON.stringify(data));

        SendLevel(this, event);
    });

    $(document).on("mousemove", ".vc-charge-level", function (event) {
        if (levelDown) 
            SendLevel(this, event);
    });

    $(document).on("mouseup mouseleave", ".vc-charge-level", function (event) {
        levelDown = false;
    });

    function SendLevel(source, event) {
        try {
            var location = GetEventCoords($(source), event);
            var max = parseInt($(source).width());
            var data = Object.create(null);
            data.ID = $(source).data("id");
            data.Level = 2 * (location.x / max);
            SendCMD("ECCF", JSON.stringify(data));
        } catch (err) {
            console.log("ComponentLevels.SendLevel: " + err.message);
        }
    }

    function Render() {
        if (componentData === null)
            return;
        if (header === "")
            return;
        if (template === "")
            return;

        try {
            if (!headersRendered) {
                $this.append("<div>");
                $this.append(header.replace("[ID]", "power").replace("[Name]", "POWER SOURCES"));
                $this.append(header.replace("[ID]", "int").replace("[Name]", "INTERNAL COMPONENTS"));
                $this.append(header.replace("[ID]", "ext").replace("[Name]", "EXTERNAL COMPONENTS"));
                $this.append("</div>");
                headersRendered = true;
            }

            var pw = 150;
            var ph = 75;    // 1 = 75, 2 = 150
            var idx = -1;

            var list = "";
            for (var i in componentData) {
                idx++;
                var c = componentData[i];
                if (c.Name === "")
                    continue;

                var section = "components-int";
                var icon = "other";
                var description = "-";
                var level = c.LevelR;
                var nt = template;

                if (level === 0 && c.Level > 0)
                    level = 1;

                if (c.Color === "")
                    c.Color = randomColor();

                var h = parseInt(pw * (level / 1));
                var cl = parseInt(ph * c.ChargeFactor);
                var dmg = parseInt(100 * c.IntegrityR);
                var min = parseInt(100 * (c.Min / c.Integrity));

                if (min == 0)
                    min = -4;

                if (c.Status === 1)
                    cl = 0;

                if ($("#vc-" + idx).length === 0) {
                    // Add New

                    switch (c.Type) {
                        case "Battery":
                            description = "Battery";
                            break;
                        case "Environment":
                            description = "Environmental Controls";
                            icon = "environment";
                            break;
                        case "Ftl":
                            description = "Faster Than Light Drive";
                            icon = "ftl";
                            break;
                        case "Maneuver":
                            description = "Maneuvering Thrusters";
                            icon = "maneuver";
                            break;
                        case "Propulsion":
                            description = "Main Propulsion";
                            icon = "propulsion";
                            break;
                        case "Power":
                            description = "Power Source";
                            section = "components-power";
                            icon = "power";
                            break;
                        case "Sensor":
                            description = "Sensor Controls";
                            section = "components-ext";
                            icon = "sensors";
                            break;
                        case "Shield":
                            description = "Deflector Shields";
                            icon = "shield";
                            break;
                        case "Projectile":
                            description = "Weapon: Projectile";
                            section = "components-ext";
                            icon = "projectile";
                            break;
                        case "Missile":
                            description = "Weapon: Missile";
                            section = "components-ext";
                            icon = "missile";
                            //nt = template2;
                            break;
                        case "Weapon":
                        case "WeaponSystem":
                            description = "Weapon";
                            section = "components-ext";
                            icon = "projectile";
                            //nt = template2;
                            break;
                    }

                    nt = replaceAll(nt, "[Item.ID]", c.ID);
                    nt = replaceAll(nt, "[Item.Icon]", icon);
                    nt = replaceAll(nt, "[Item.Status]", c.Status);
                    nt = replaceAll(nt, "[Item.Index]", idx);
                    nt = replaceAll(nt, "[Item.Name]", c.Name);
                    nt = replaceAll(nt, "[Item.Integrity]", dmg);
                    nt = replaceAll(nt, "[Item.Min]", "left:" + min + "px");
                    nt = replaceAll(nt, "[Item.Level]", c.Level);
                    nt = replaceAll(nt, "[Item.Description]", description);
                    $("#" + section).append(nt);

                } else {
                    // Edit Existing
                    $("#vc-charge-level-" + idx).width(cl);
                    $("#vc-target-level-" + idx).css("left", cl - 6);
                    $("#vc-target-level-" + idx).attr('title', c.ChargeFactor);
                    $("#vc-level-" + idx).width(h);
                    SetHtml("#vc-level-label-" + idx, c.Level === 0 ? "" : parseInt(c.LevelR * 100) + "<span class='font-tiny'> %<span>");

                    // Damage
                    var lastintegrity = parseFloat($("#vc-damage-" + idx).data("lastlevel"));
                    $("#vc-damage-" + idx).width(dmg);
                    SetHtml("#vc-damage-label-" + idx, dmg + "<span class='font-tiny'> %<span>");
                    SetText("#vc-name-" + idx, c.Name);
                    SetText("#vc-integrity-" + idx, c.Integrity);
                    SetData("#vc-damage-" + idx, "lastlevel", c.Integrity);
                    if (lastintegrity !== c.Integrity) {
                        if (c.Integrity <= c.Min) {
                            // Inoperable
                            RemoveClass("#vc-damage-" + idx, "prog-g");
                            RemoveClass("#vc-damage-" + idx, "prog-y");
                            AddClass("#vc-damage-" + idx, "prog-r");
                        } else if (c.IntegrityR < 1) {
                            // Damaged
                            RemoveClass("#vc-damage-" + idx, "prog-g");
                            RemoveClass("#vc-damage-" + idx, "prog-r");
                            AddClass("#vc-damage-" + idx, "prog-y");
                        } else {
                            // Fine
                            RemoveClass("#vc-damage-" + idx, "prog-r");
                            RemoveClass("#vc-damage-" + idx, "prog-y");
                            AddClass("#vc-damage-" + idx, "prog-g");
                        }
                    }

                    // State
                    var cd = $("#vc-state-" + idx);
                    if (c.Status === 0) {
                        cd.text("ON");
                        cd.addClass("vc-online");
                        cd.removeClass("vc-offline");
                        $("#vc-state-area-" + idx).removeClass("dim");
                    } else if (c.Status === 3) {
                        cd.text("OFF");
                        cd.addClass("vc-offline");
                        cd.removeClass("vc-online");
                        $("#vc-state-area-" + idx).addClass("dim");
                    } else {
                        cd.text("OFF");
                        cd.addClass("vc-offline");
                        cd.removeClass("vc-online");
                        $("#vc-state-area-" + idx).removeClass("dim");
                    }
                }

            }
        } catch (err) {
            console.log("ComponentLevels: " + err.message);
        }

    }

};

// Encounters
jQuery.fn.EncounterList = function (layout) {
    var $this = $(this);
    var template = "";
    var itemtemplate = "";
    if (typeof layout !== "undefined" && layout !== "")
        template = layout;

    $.get("hf-encounter-listing.htm", {}, function (data) {
        template = data;
        Render();
    });

    $.get("hf-encounter-item.htm", {}, function (data) {
        itemtemplate = data;
        Render();
    });

    $(document).on("onEncounters", function () {
        Render();
    });

    function Render() {
        try {
            if (typeof encounters === "undefined")
                return;
            if ($this.length === 0)
                return;

            if (template === "")
                return;
            if (itemtemplate === "")
                return;

            $this.empty();

            var id = 0;
            var list = "";
            for (var i in encounters) {
                var e = encounters[i];
                id++;

                var nt = template;
                nt = replaceAll(nt, "[Item.ID]", id);
                nt = replaceAll(nt, "[Item.Name]", e.Name);
                nt = replaceAll(nt, "[Item.Count]", GetLength(e.Encounters));
                
                var itemlist = "";
                for (var c in e.Encounters) {
                    var enc = e.Encounters[c];

                    var ei = itemtemplate;
                    ei = replaceAll(ei, "[Parent.ID]", id);
                    ei = replaceAll(ei, "[Parent.Name]", e.Name);
                    ei = replaceAll(ei, "[Item.ID]", enc.ID);
                    ei = replaceAll(ei, "[Item.Name]", enc.Name);
                    itemlist += ei;
                }

                nt = replaceAll(nt, "[Item.Encounters]", itemlist);

                $this.append(nt);
            }
        } catch (err) {
            console.log("EncounterList: " + err);
        }
    }

};

// Mission Objectives
jQuery.fn.ObjectivesList = function (layout) {
    var $this = $(this);
    var template = hf_Objectives;

    if (typeof layout !== "undefined" && layout !== "")
        template = layout;

    RenderObjectiveList();

    $(document).on("onMission", function () {
        RenderObjectiveList();
    });

    function RenderObjectiveList() {
        var list = "";
        var lists = "";
        var listo = "";
        var lastGroup = "";
        var totalGroups = 0;

        if (mission === null)
            return;

        if (template === "") {
            template = hf_Objectives;
            if (template === "")
                RenderObjectiveList();
        }

        for (var i in mission.Objectives) {
            var o = mission.Objectives[i];
            var line = template;

            if (o.Visible === false) continue;

            var status = "1";
            var counts = "";

            if (o.Complete) {
                status = "2";
            }

            switch (o.Type) {
                case "Objects_Hailed":
                case "Objects_Scanned":
                case "Objects_Survived":
                case "Objects_Destroyed":
                    counts = "<span style='color: grey;'>Status:</span> " + o.CurrentCount + " / " + o.Count;
                    break;
            }

            line = replaceAll(line, "[Title]", o.Title);
            line = replaceAll(line, "[Complete]", status);
            line = replaceAll(line, "[Counts]", counts);

            if (lastGroup !== o.Group) {
                lastGroup = o.Group;
                if (totalGroups > 0)
                    list += "</div>";
                list += "<div class='subtitle border-bottom c1'>" + lastGroup + "</div><div class='padded'>";
            }

            list += line;

            //switch (o.Rank) {
            //    case "Primary":
            //        list += line;
            //        break;
            //    default:
            //        lists += line;
            //        break;
            //}

        }

        if (totalGroups > 0)
            list += "</div>";

        //if (list === "") list = "<div class='centered'><br/ >None<br /><br /></div>";
        //if (lists === "") lists = "<div class='centered'><br/ >None<br /><br /></div>";

        //var final = "<div class='subtitle border-bottom c2'>Primary Objectives</div><div class='padded'>" + list + "</div><div class='subtitle border-bottom c2'>Secondary Objectives</div><div class='padded'>" + lists + "</div>";

        //$this.html(final);
        $this.html(list);
    }
};

jQuery.fn.TargetInfo = function (options) {
    var $this = $(this);

    // Options
    if (typeof options === "undefined") options = {};
    var targetType = typeof options.Type !== "undefined" ? options.Type : "";

    Initialize();
    ResetSize();
    Render();

    $(document).on("onResize", function (event) {
        ResetSize();
    });

    function Initialize() {

    }

    function ResetSize() {

    }

    function Render() {
        try {

        } catch (err) {
            console.log("TargetInfo.Render: " + err.message);
        }
    }

};

// Shield Status Image
jQuery.fn.ShieldImage = function () {
    var lastshieldstatus = "";
    var $this = $(this);

    $(document).on("onShieldInfo", function () {
        if (typeof shieldData === "undefined") return;

        var pl = shieldData.Level / shieldData.Max;
        var level = Math.ceil(pl * 10);
        if (!shieldData.Enabled) level = 0;

        if (shieldData.Enabled === true) {
            lastshieldstatus = true;
        } else {
            lastshieldstatus = false;
        }

        $this.removeClass();
        $this.addClass("shieldStatus" + level);
    });

};

// Shield Level
jQuery.fn.shieldLevelBar = function () {
    var $this = $(this);
    var lastlevel = -1;

    $(document).on("onReset", function (event) {
        lastlevel = -1;
    });

    $(document).on("onShieldInfo", function () {
        //if (shieldData.LevelR != lastlevel) {
        lastlevel = shieldData.LevelR;
        //var pl = (shieldData.LevelR / shieldData.Maximum)
        var pw = $this.parent().width();
        var level = Math.ceil(shieldData.LevelR * pw);
        $this.css("width", level);
        $this.html(Math.round(100 * shieldData.LevelR, 0) + "%");
        //}
    });

};
jQuery.fn.shieldLevelV = function () {
    var $this = $(this);
    var lastlevel = -1;

    if ($this.html() === "") {
        // Initialize
        var ntt = "<div id='vessel-energy-guage' class='GaugeVertialPad'><div class='GuageVertical'></div>";
        ntt += "<div class='GuageMax'>";
        ntt += "<div id='vessel-shield-v' class='GaugeLevelVertical' style='background-color:Blue;height:0px;'></div>";
        ntt += "</div>";
        ntt += "<div id='vessel-shield-level-v' class='vc-vertial-level'></div>";
        $this.html(ntt);
    }

    $(document).on("onReset", function (event) {
        lastlevel = -1;
    });

    $(document).on("onShieldInfo", function (event) {
        if (shieldData.Level !== lastlevel) {
            lastlevel = shieldData.Level;
            var pw = $this.parent().height();
            var pl = shieldData.Level / shieldData.Max;
            var h = parseInt(pw * pl);
            $("#vessel-shield-v").height(h);

            var level = shieldData.Max > 0 ? (shieldData.Level / shieldData.Max) : 0;
            level = (level * 100).toFixed(0);
            $("#vessel-shield-level-v").html(level + "<span class='font-tiny'>%<span>");
            //$this.animate({ height: h }, 125, "linear");
        }
    });

};

jQuery.fn.speedBarV = function () {
    var $this = $(this);
    var lastspeed = -1;

    var dialHeight = 60;
    var padOffset = 30;

    var height = 400;
    var section = 60;
    var zeroLevel = 350;
    var maxForward = 320;
    var maxReverse = 60;

    Resize();
    Render();

    $(document).on("onVesselInfo", function () {
        Render();
    });

    $(document).on("onResize", function () {
        Resize();
    });

    function Resize() {
        height = $this.parent().height();
        section = parseInt(height / 6);
        padOffset = parseInt(section / 2);

        maxForward = section * 4;
        maxReverse = section;

        zeroLevel = padOffset + maxForward;

    }

    function Render() {
        if (typeof thisvessel === "undefined")
            return;

        if (thisvessel.Maneuver === "FTL") {
            //if (spacialData.FtlSpeed === lastspeed)
            //    return;

            //lastspeed = spacialData.FtlSpeed;

            //if (lastspeed > 0) {
            //    var ftlHeight = parseInt(maxForward * (lastspeed / 4));
            //    //$this.animate({ height: h }, 125, "linear");
            //    $this.css({ bottom: padOffset + section + 'px', top: zeroLevel - ftlHeight + 'px' });

            //} else {
            //    // ZERO
            //    $this.css({ bottom: zeroLevel + 'px', top: zeroLevel + 'px' });

            //    $("#fuel-dial").css({ top: zeroLevel - padOffset + 'px' });
            //}
        } else {

            SetText("#speed-level", NumberWithCommas(parseInt(lastspeed * 1000)));
            SetText("#speed-level-max", NumberWithCommas(parseInt(thisvessel.MaxSpeed * 1000))); 

            if (thisvessel.Speed === lastspeed)
                return;

            lastspeed = thisvessel.Speed;

            if (lastspeed < thisvessel.MaxSpeed / 2) {
                AddClass("#speed-burst", "dim");
            } else {
                RemoveClass("#speed-burst", "dim");
            }

            if (lastspeed > 0) {
                // ABOVE ZERO
                if (thisvessel.Speed > thisvessel.MaxSpeed)
                    speed = thisvessel.MaxSpeed;

                var currentHeight = parseInt(maxForward * (lastspeed / thisvessel.MaxSpeed));

                $this.css({ 'background-color': 'var(--speed-forward)', bottom: padOffset + section + 'px', top: zeroLevel - currentHeight + 'px' });

                $("#fuel-dial").css({ top: zeroLevel - currentHeight - padOffset + 'px' });

            } else if (thisvessel.Speed < 0) {
                // REVERSE
                var max = thisvessel.MaxSpeed / 4;
                var currentReverse = math.abs(parseInt(section * (lastspeed / max)));

                $this.css({ 'background-color': 'var(--speed-reverse)', top: zeroLevel + 'px', bottom: padOffset + (section - currentReverse) + 'px' });

                $("#fuel-dial").css({ top: zeroLevel + currentReverse - padOffset + 'px' });

            } else {
                // ZERO
                $this.css({ bottom: zeroLevel + 'px', top: zeroLevel + 'px' });

                $("#fuel-dial").css({ top: zeroLevel - padOffset + 'px' });
            }

        }
    }

};

// Energy Level
jQuery.fn.energyLevelBar = function () {
    var $this = $(this);
    var lastlevel = -1;
    var maxwidth = $this.parent().width();

    $(document).on("onReset", function (event) {
        lastlevel = -1;
    });

    $(document).on("onVesselInfo", function () {
        if (typeof thisvessel === "undefined")
            return;

        if (thisvessel.Energy !== lastlevel || maxwidth == 0) {
            if (maxwidth === 0) maxwidth = $this.parent().width();

            lastlevel = thisvessel.Energy;
            var curlevel = lastlevel / thisvessel.MaxEnergy;
            if (curlevel > 1) pl = 1;
            //var pw = $this.parent().width();
            var level = Math.ceil(curlevel * maxwidth);
            $this.css("width", level);
        }
    });

};
jQuery.fn.energyLevelV = function () {
    var $this = $(this);
    var lastLevel = -1;
    var lastLevelr = -1;
    var lastHeight = $this.parent().height();

    if ($this.html() === "") {
        // Initialize
        var ntt = "<div id='vessel-energy-guage' class='GaugeVertialPad'><div class='GuageVertical'></div>";
        ntt += "<div class='GuageMax'>";
        ntt += "<div id='vessel-energy-v' class='GaugeLevelVertical' style='background-color:#ff6a00;height:0px;opacity:.4'></div>";
        ntt += "<div id='vessel-energy-used-v' class='GaugeLevelVertical' style='background-color:#ff6a00;height:0px;'></div>";
        ntt += "</div>";
        ntt += "<div id='vessel-energy-level-v' class='vc-vertial-level'></div>";
        $this.html(ntt);
    }

    $(document).on("onReset", function (event) {
        lastLevel = -1;
        lastLevelr = -1;
    });

    $(document).on("onVesselInfo", function () {
        var height = $("#vessel-energy-v").parent().height(); //$this.parent().height();

        if (typeof thisvessel === "undefined")
            return;

        if (thisvessel.Energy !== lastLevel || thisvessel.EnergyRemaining !== lastLevelr || height !== lastHeight) {
            lastLevel = thisvessel.Energy;
            lastLevelr = thisvessel.EnergyRemaining;
            lastHeight = height;

            var curlevel = lastLevel / thisvessel.MaxEnergy;
            var th = parseInt(height * curlevel);

            $("#vessel-energy-v").height(th);
            var hh = parseInt(height * (thisvessel.EnergyRemaining / thisvessel.MaxEnergy));
            $("#vessel-energy-used-v").height(hh);

            var level = thisvessel.MaxEnergy > 0 ? (thisvessel.EnergyRemaining / thisvessel.MaxEnergy) : 0;
            level = (level * 100).toFixed(0);
            $("#vessel-energy-level-v").html(level + "<span class='font-tiny'>%<span>");
        }
    });

};

// Hull Level
jQuery.fn.hullLevelBar = function () {
    var $this = $(this);
    var lastlevel = -1;
    var maxwidth = $this.parent().width();

    $(document).on("onReset", function (event) {
        lastlevel = -1;
    });

    $(document).on("onVesselInfo", function () {
        if (typeof thisvessel === "undefined")
            return;

        if (thisvessel.Integrity !== lastlevel || maxwidth == 0) {
            maxwidth = $this.parent().width();

            lastlevel = thisvessel.Integrity;
            var pl = thisvessel.Integrity;
            if (pl > 1) pl = 1;
            var level = Math.ceil(pl * maxwidth);
            $this.css("width", level);
        }
    });

};

// Heal Level
jQuery.fn.healLevelBar = function () {
    var $this = $(this);
    var lastlevel = -1;
    var maxwidth = $this.parent().width();

    $(document).on("onReset", function (event) {
        lastlevel = -1;
    });

    $(document).on("onVesselInfo", function (event) {
        if (thisvessel.Integrity !== lastlevel || maxwidth == 0) {
            if (maxwidth === 0) maxwidth = $this.parent().width();

            var pl = thisvessel.HealIntegrity;
            if (pl > 1) pl = 1;
            var level = Math.ceil(pl * maxwidth);
            $this.css("width", level);
        }
    });

};

jQuery.fn.hullLevelV = function () {
    var $this = $(this);
    var lastLevel = -1;
    var lastHeight = $this.parent().height();

    if ($this.html() === "") {
        // Initialize
        var ntt = "<div id='vessel-integrity-guage' class='GaugeVertialPad'><div class='GuageVertical'></div>";
        ntt += "<div class='GuageMax'>";
        ntt += "<div id='vessel-healintegrity-v' class='GaugeLevelVertical' style= 'background-color:greenyellow;height:0px;'></div>";
        ntt += "<div id='vessel-integrity-v' class='GaugeLevelVertical' style='background-color:green;height:0px;'></div>";
        ntt += "</div>";
        ntt += "<div id='vessel-integrity-level-v' class='vc-vertial-level'></div>";
        $this.html(ntt);
    }

    $(document).on("onReset", function (event) {
        lastLevel = -1;
        lastHeight = -1;
    });

    $(document).on("onVesselInfo", function (event) {
        var height = $("#vessel-integrity-v").parent().height();

        if (typeof thisvessel === "undefined")
            return;

        if (thisvessel.Integrity !== lastLevel || height !== lastHeight) {
            lastLevel = thisvessel.Integrity;
            lastHeight = height;
            var th = parseInt(height * lastLevel);
            $("#vessel-integrity-v").height(th);
            var hh = parseInt(height * thisvessel.HealIntegrity);
            $("#vessel-healintegrity-v").height(hh);


            //var level = thisvessel.MaxEnergy > 0 ? (thisvessel.Integrity / thisvessel.MaxEnergy) : 0;
            level = (lastLevel * 100).toFixed(0);
            $("#vessel-integrity-level-v").html(level + "<span class='font-tiny'>%<span>");
        }
    });

};

jQuery.fn.DmxTool = function (sid) {
    var id = sid;
    var $this = $(this);
    var eid = $this.attr('id');
    var pname = "dmx-preview-" + eid;
    var name = "dmx-picker-" + eid;

    if (typeof id === "undefined")
        id = "";

    $this.hide();
    $this.parent().css("position", "relative");
    $this.parent().append("<div id='" + pname + "' class='dmx-preview' style='background-color:" + $this.val() + "'></div>");
    $this.parent().append("<div id='" + name + "' class='dmx-picker hidden'></div>");

    //$("#" + name).on("mouseleave", function (event) {
    //    Hide();
    //});
    $(".dmx-channel").on("input", function (event) { // click event handler
        SetChannelColors();
    });
    $("#" + pname).click(function (e) { // preview click
        //var offset = $(e.currentTarget).position();
        //var left = offset.left + 80; //offset.left;
        //var top = offset.top; // + $this.height() + 4;
        //$('#' + name).css("top", top + "px");
        //$('#' + name).css("left", left + "px");
        RenderChannels();
        //Show();

        $("#dmx-channel-title").text(devices["ID" + id].Name + " Channel Detail");
        $("#dmx-channels").show();
    });

    $(document).on("onDevices", function () {
        if ($("#dmx-channel-list").is(":visible")) {
            RenderChannels();
        }
    });

    function Show() {
        $('#' + name).show();
    }
    function Hide() {
        $('#' + name).hide();
    }
    function SetColor(e) {

        $("#" + pname).data("hexvalue", hex);
        $("#" + pname).css('background-color', hex);
        $this.val(hex);

        if (typeof OnColorChange === "function") {
            // safe to use the function
            OnColorChange(id, hex);
        }
    }

    function RenderChannels() {
        if (!StoryIsSet()) return;

        if (!$("#dmx-channel-list").is(":visible")) {
            $("#dmx-channel-list").empty();
        }
        //if (!$('#' + name).is(":visible")) {
        //    $("#" + name).empty();
        //}

        var device = devices["ID" + id];
        var action = { Values: [] };

        if (typeof device === "undefined")
            return;

        var odd = true;
        var count = -1;
        var template = $("#dmx-channel-template").html();

        for (var c in device.Settings.Channels) {
            var cd = device.Settings.Channels[c];
            var objdiv = "#dmx-channel-" + cd.Channel;
            count++;

            var value = action.Values[count];
            if (typeof value === "undefined") value = 0;

            if ($(objdiv).length === 0) {
                // New
                var obj = template;
                obj = replaceAll(obj, "[Row.Style]", odd ? "" : "row-even");
                obj = replaceAll(obj, "[Device.ID]", id);
                obj = replaceAll(obj, "[Channel.Class]", "dmx-channel");
                obj = replaceAll(obj, "[Channel.No]", cd.Channel);
                obj = replaceAll(obj, "[Channel.Count]", count);
                obj = replaceAll(obj, "[Channel.Name]", cd.Name);
                obj = replaceAll(obj, "[Channel.Value]", cd.Value);

                // Add
                $("#dmx-channel-list").append(obj);
                //$("#" + name).append(obj);
            } else {
                // Update
                $("#dmx-channel-" + cd.Channel + "-level").val(cd.Value);
                $("#dmx-channel-" + cd.Channel + "-base").val(cd.Value);
            }
            odd = !odd;
        }

        SetChannelColors();

    }

};
function DmxSetChannel(deviceID, channel, source) {
    try {
        if (typeof source === "undefined")
            source = 1;
        var value;

        if (source === 1)
            value = $("#dmx-channel-" + channel + "-base").val();
        else
            value = $("#dmx-channel-" + channel + "-level").val();

        if ($("#dmx-channel-" + channel + "-base").val() !== value) {
            $("#dmx-channel-" + channel + "-base").val(value);
            var data = { DeviceID: deviceID, Channel: channel, Value: value };
            SendCMD("DVCCHC", JSON.stringify(data));
        }

        if ($("#dmx-channel-" + channel + "-level").val() !== value) {
            $("#dmx-channel-" + channel + "-level").val(value);
            var data2 = { DeviceID: deviceID, Channel: channel, Value: value };
            SendCMD("DVCCHC", JSON.stringify(data2));
        }

        SetChannelColors(deviceID);

    } catch (err) {
        console.log(err.message);
    }
}
function SetChannelColors(deviceID) {
    try {
        var pname = "dmx-preview-device-" + deviceID + "-property-color";
        var pkname = "dmx-picker-" + deviceID;
        var r;
        var g;
        var b;
        var a;

        $(".dmx-channel").each(function () {
            var cn = $(this).data("no");
            var trackName = $("#dmx-channel-" + cn + "-name").text();
            var track = $("#dmx-channel-" + cn + "-level");

            if (trackName.toLowerCase() === "red") {
                r = cn;
            } else if (trackName.toLowerCase() === "green") {
                g = cn;
            } else if (trackName.toLowerCase() === "blue") {
                b = cn;
            } else if (trackName.toLowerCase() === "amber") {
                a = cn;
            }
        });

        var rv = 0;
        var bv = 0;
        var gv = 0;
        var av = 0;

        // Set Base
        if (typeof r !== "undefined")
            rv = $("#dmx-channel-" + r + "-level").val();
        if (typeof g !== "undefined")
            gv = $("#dmx-channel-" + g + "-level").val();
        if (typeof b !== "undefined")
            bv = $("#dmx-channel-" + b + "-level").val();
        if (typeof a !== "undefined")
            av = $("#dmx-channel-" + a + "-level").val();

        // Set Colors
        if (typeof r !== "undefined")
            $("#dmx-channel-" + r + "-level").css("background-image", "linear-gradient(to right, rgb(" + 0 + "," + gv + "," + bv + "), rgb(" + 255 + "," + gv + "," + bv + "))");
        if (typeof g !== "undefined")
            $("#dmx-channel-" + g + "-level").css("background-image", "linear-gradient(to right, rgb(" + rv + "," + 0 + "," + bv + "), rgb(" + rv + "," + 255 + "," + bv + "))");
        if (typeof b !== "undefined")
            $("#dmx-channel-" + b + "-level").css("background-image", "linear-gradient(to right, rgb(" + rv + "," + gv + "," + 0 + "), rgb(" + rv + "," + gv + "," + 255 + "))");
        if (typeof a !== "undefined")
            $("#dmx-channel-" + a + "-level").css("background-image", "linear-gradient(to right, rgb(" + rv + "," + gv + "," + bv + "), rgb(" + rv + "," + gv + "," + bv + "))");

        var hex = RgbToHex2(rv, gv, bv);
        $("#" + pname).data("hexvalue", hex);
        $("#" + pname).css('background-color', hex);

        //var action = gameEvent.Actions[actionID];
        //action.Value = { R: rv, G: gv, B: bv };

    } catch (err) {
        console.log("SetTrackColors: " + err.message);
    }
}

jQuery.fn.ColorPicker = function (source) {
    var id = "";
    var $this = $(this);
    var bCanPreview = true; // can preview
    var eid = $this.attr('id');
    var pname = "color-preview-" + eid;
    var name = "color-picker-" + eid;
    var wheel = name + "-wheel";

    if (typeof source === "undefined")
        source = "";

    $this.hide();
    $this.parent().css("position", "relative");
    $this.parent().append("<div id='" + pname + "' class='color-preview' style='background-color:" + $this.val() + "'></div>");
    $this.parent().append("<div id='" + name + "' class='color-picker hidden'><canvas id='" + wheel + "' width='240' height='150'></canvas></div>");

    // create canvas and context objects
    var canvas = document.getElementById(wheel);
    var ctx = canvas.getContext('2d');
    // drawing active image
    var image = new Image();

    image.onload = function () {
        ctx.drawImage(image, 0, 0, image.width, image.height); // draw the image on the canvas
    };
    if (source !== "")
        image.src = source;
    else
        image.src = 'images/color-range.png';

    $this.on("change input", function (e) {
        $("#" + pname).css('background-color', $this.val());
    });
    $('#' + wheel).mousemove(function (e) { // mouse move handler
        //if (bCanPreview)
        //    SetColor(e);
    });
    $('#' + wheel).click(function (e) { // click event handler
        bCanPreview = !bCanPreview;
        SetColor(e);
        Hide();
    });
    $('#' + wheel).on("mouseout", function (event) {
        Hide();
    });
    $("#" + pname).click(function (e) { // preview click
        var offset = $(e.currentTarget).position();
        var left = 0; //offset.left;
        var top = offset.top + $this.height() + 4;
        $('#' + name).css("top", top + "px");
        $('#' + name).css("left", left + "px");
        ToggleWheel();
        bCanPreview = true;
    });
    function ToggleWheel() {
        $('#' + name).fadeToggle("fast", "linear");
    }
    function Hide() {
        if ($('#' + name).is(":visible"))
            $('#' + name).fadeOut("fast", "linear");
    }
    function SetColor(e) {
        // get coordinates of current position
        var canvasOffset = $(canvas).offset();
        var canvasX = Math.floor(e.pageX - canvasOffset.left);
        var canvasY = Math.floor(e.pageY - canvasOffset.top);
        // get current pixel
        var imageData = ctx.getImageData(canvasX, canvasY, 1, 1);
        var pixel = imageData.data;
        // update preview color
        //var pixelColor = "rgb(" + pixel[0] + ", " + pixel[1] + ", " + pixel[2] + ")";
        var dColor = pixel[2] + 256 * pixel[1] + 65536 * pixel[0];
        var hex = "#" + ('0000' + dColor.toString(16)).substr(-6);
        // update controls
        //$('#rVal').val(pixel[0]);
        //$('#gVal').val(pixel[1]);
        //$('#bVal').val(pixel[2]);
        $("#" + pname).data("hexvalue", hex);
        $("#" + pname).css('background-color', hex);
        $this.val(hex);

        if (typeof OnColorChange === "function") {
            // safe to use the function
            OnColorChange(id, hex);
        }
    }
};