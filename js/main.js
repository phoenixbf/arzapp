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
        //ATON.SceneHub.clear();
        //APP.setupCommon();
    });

    ATON.on("Tap", (e)=>{
        if (ATON._hoveredSemNode) APP.updateSemPanel(ATON._hoveredSemNode);
        else $("#idPanel").hide();
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