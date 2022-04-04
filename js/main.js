let APP = {};
window.APP = APP;

APP.pathConf = "config/config.json";
APP.cdata = undefined;


APP.init = ()=>{
    ATON.FE.realize();
    ATON.FE.addBasicLoaderEvents();

    APP.argSite = ATON.FE.urlParams.get('s');

    APP.setupEvents();

    APP.setupUI();

    APP.loadConfig( APP.pathConf );

    ATON.addUpdateRoutine( APP.update );

    APP._sidPast    = undefined;
    APP._sidPresent = undefined;
    APP.currPeriod  = "m";
    APP.currSite    = undefined;
    
    APP._povs    = [];
    APP._cPOVind = 0;

    // Handle different versions
    ATON.setCollectionPathModifier((url)=>{
        if (!url.endsWith(".gltf")) return url;
        if (!ATON.device.isMobile && !ATON.device.lowGPU) return url;

        let fname = ATON.Utils.getFilename(url);
        let base  = ATON.Utils.getBaseFolder(url);
        let mURL  = base + "m/" + fname;

        return mURL;
    });
};

APP.setupUI = ()=>{
    $("#idPeriod").on("input change",()=>{
        let v = parseInt( $("#idPeriod").val() );
        
        if (v === 0) APP.switchPeriod("m");
        else APP.switchPeriod("a");
    });

    ATON.FE.uiAddButtonVR("idTopToolbar");

    ATON.FE.uiAddButton("idBottomToolbar", "prev", APP.povPrev, "Previous Viewpoint" );
    ATON.FE.uiAddButton("idBottomToolbar", "next", APP.povNext, "Next Viewpoint" );

    // SUI
    ATON.SUI.enableSemIcons();

    let buttons = [];

    let suiSwitch = new ATON.SUI.Button("sui_switch");
    suiSwitch
        .setText("Switch")
        .onSelect = ()=>{
            if (APP.currPeriod === "a"){
                APP.switchPeriod("m");
            }
            else {
                APP.switchPeriod("a");
            }
        };

    buttons.push( suiSwitch );

    APP.wristToolbar = ATON.SUI.createToolbar( buttons );

    // wrist sui
    let pi2 = (Math.PI * 0.5);
    APP.wristToolbar.setPosition(-0.1,0,0.1).setRotation(-pi2,-pi2,pi2).setScale(0.5);

    APP.wristToolbar.attachToRoot();
    APP.wristToolbar.hide();
};

// POVs
APP.povNext = ()=>{
    let numpovs = APP._povs.length;
    if (numpovs < 1) return;

    APP._cPOVind = (APP._cPOVind + 1) % numpovs;

    let pov = APP._povs[APP._cPOVind];
    let dur = (ATON.XR._bPresenting)? ATON.XR.STD_TELEP_DURATION : 1.0;

    console.log(pov);

    ATON.Nav.requestPOV(pov, dur);
};
APP.povPrev = ()=>{
    let numpovs = APP._povs.length;
    if (numpovs < 1) return;

    APP._cPOVind = (APP._cPOVind - 1);
    if (APP._cPOVind<0) APP._cPOVind = (numpovs-1);

    let pov = APP._povs[APP._cPOVind];

    let dur = (ATON.XR._bPresenting)? ATON.XR.STD_TELEP_DURATION : 1.0;
    ATON.Nav.requestPOV(pov, dur);
};

// Update
APP.update = ()=>{

};

// Config
APP.loadConfig = (path)=>{
    return $.getJSON( path, ( data )=>{
        //console.log(data);
        console.log("Loaded config: "+path);

        APP.cdata = data;

        ATON.fireEvent("APP_ConfigLoaded");
    });
};

APP.setupCommon = ()=>{
    if (!APP.currSite) return;

    let S = APP.cdata.sites[APP.currSite];

    if (S.home){
        let pov = S.home;

        ATON.Nav.setHomePOV( 
            new ATON.POV()
            .setPosition(pov.position[0],pov.position[1],pov.position[2])
            .setTarget(pov.target[0],pov.target[1],pov.target[2])
            .setFOV(pov.fov)
        );
    }
};

APP.loadSite = (ss)=>{
    if (!ss) return;
    if (APP.cdata === undefined) return;

    let S = APP.cdata.sites[ss];
    if (!S) return;

    APP._sidPast    = S.a;
    APP._sidPresent = S.m;

    APP.currPeriod = "m";
    APP.currSite   = ss;

    APP.setupCommon();

    ATON.FE.loadSceneID( APP._sidPresent );

    console.log("Site loaded");
};

APP.switchPeriod = (p)=>{
    if (p === APP.currPeriod) return;

    ATON.SceneHub.clear();

    //ATON.SceneHub.clearSemantics();
    //ATON.Nav.clear();

    APP.setupCommon();

    if (p === "a") ATON.FE.loadSceneID( APP._sidPast );
    else ATON.FE.loadSceneID( APP._sidPresent );

    APP.currPeriod = p;
};

// Events
APP.setupEvents = ()=>{
    ATON.on("APP_ConfigLoaded", ()=>{
        APP.loadSite( APP.argSite );
        console.log(APP.argSite);

        ATON.Nav.requestHome(0.1);
    });

    ATON.EventHub.clearEventHandlers("AllNodeRequestsCompleted");
    ATON.on("AllNodeRequestsCompleted", ()=>{
        $("#idLoader").hide();
    });

    ATON.EventHub.clearEventHandlers("SceneJSONLoaded");
    ATON.on("SceneJSONLoaded", ()=>{
        APP._povs    = [];
        APP._cPOVind = 0;

        for (let k in ATON.Nav.povlist){
            let pov = ATON.Nav.povlist[k];
    
            if (k !== "home") APP._povs.push(pov);
            //console.log(pov);
        }
    });

    ATON.on("Tap", (e)=>{
        if (ATON._hoveredSemNode) APP.updateSemPanel(ATON._hoveredSemNode);
        else $("#idPanel").hide();
    });

    // Immersive Sessions
    ATON.on("XRcontrollerConnected", (c)=>{
        if (c === ATON.XR.HAND_L){
            ATON.XR.controller1.add(APP.wristToolbar);
            APP.wristToolbar.show();  
        }
    });
};

APP.updateSemPanel = (semid)=>{
    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return;

    let descr = S.getDescription();
    if (descr) descr = JSON.parse(descr);

    let htmlcode = "";
    htmlcode += "<div class='atonPopupTitle'>";
    //htmlcode += "<div id='idPanelClose' class='atonBTN' style='float:left; margin:0px;'>X</div>"; // background-color: #bf7b37
    htmlcode += semid+"</div>";

    htmlcode += "<div class='atonSidePanelContent' style='height: calc(100% - 50px);'>";
    if (descr) htmlcode += "<div class='descriptionText'>"+descr+"</div>";
    htmlcode += "</div>";

    //htmlcode += "<div id='idPanelClose' class='atonBTN atonBTN-red atonSidePanelCloseBTN' >X</div>";

    ATON.FE.playAudioFromSemanticNode(semid);

    $("#idPanel").html(htmlcode);
    $("#idPanel").show();
};


// run
window.onload = ()=>{
    APP.init();
};