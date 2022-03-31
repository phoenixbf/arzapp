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

    // Handle different versions
    ATON.setCollectionPathModifier((url)=>{
        if (!url.endsWith(".gltf")) return url;
        if (!ATON.device.isMobile) return url;

        url = url.replace(".gltf", "-m.gltf");
        return url;
    });
};

APP.setupUI = ()=>{
    $("#idPeriod").on("input change",()=>{
        let v = parseInt( $("#idPeriod").val() );
        
        if (v === 0) APP.switchPeriod("m");
        else APP.switchPeriod("a");
    });
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

APP.loadSite = (ss)=>{
    if (!ss) return;
    if (APP.cdata === undefined) return;

    let S = APP.cdata.sites[ss];

    APP._sidPast    = S.a;
    APP._sidPresent = S.m;

    ATON.FE.loadSceneID( APP._sidPresent );
    APP.currPeriod = "m";

    console.log("Site loaded");
};

APP.switchPeriod = (p)=>{
    if (p === APP.currPeriod) return;

    //ATON.SceneHub.clear();

    if (p === "a") ATON.FE.loadSceneID( APP._sidPast );
    else ATON.FE.loadSceneID( APP._sidPresent );

    APP.currPeriod = p;
};

// Events
APP.setupEvents = ()=>{
    ATON.on("APP_ConfigLoaded", ()=>{
        APP.loadSite( APP.argSite );
        console.log(APP.argSite);
    });

    ATON.on("AllNodeRequestsCompleted", ()=>{

    });
};


// run
window.onload = ()=>{
    APP.init();
};