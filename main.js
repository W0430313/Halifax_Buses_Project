(function(){

    //the map of halifax that gets displayed, set with a zoom factor of 14 by default
    var map = L.map('theMap').setView([44.650627, -63.597140], 14);

    //our custom busIcon
    var busIcon = L.icon({
        iconUrl: 'bus.png',
        iconSize: [30,30]
    })


    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    //the group that all of our buses gets added to
    //gets cleared out every time through the function so that the old buses don't remain on the map
    var layerGroup = L.layerGroup().addTo(map)

    //explicity call function once so that data is there when the page opens
    ShowData()

    //once it's called once, set an interval to refresh the map every 10 seconds
    var refreshMap = setInterval(ShowData, 10000)


    function ShowData()
    {
    //fetching the data from the halifax bus api
     fetch('https://hrmbusapi.herokuapp.com/').then(response => response.json() ).then(function(json) {
        
        console.log("-----------------------------------------")
        console.log("Raw Bus JSON:")
        
        //this is the raw unfiltered JSON of all the bus information
        let busJson = json
        console.log(busJson)
    
        
        console.log("-----------------------------------------")
        console.log("Filtered Bus JSON:")
        
        //filter the buses to only show route 10 or lower
        let filteredBuses = busJson.entity.filter(b=>Number(b.vehicle.trip.routeId) <= 10)
        console.log(filteredBuses)
        
        console.log("-----------------------------------------")

        console.log("Converted to GeoJSON")

        //create an empty object to hold our geoJSON data
        let geoJSON = {}

        //set its type property to be a Feature Collection
        geoJSON.type = "FeatureCollection"

        //set its features property to have the following information for all filtered buses: 
        //Type: feature, a properties object {} that has the properties route, bus number, and bearing,
        //and a geometry object {} that has a type property of Point, and coordinates that are the buses lat and long values.
        geoJSON.features = filteredBuses.map(b =>( {["type"]: "Feature",
            ["properties"]: {["route"]: b.vehicle.trip.routeId, ["busNum"]: b.vehicle.vehicle.id, ["bearing"]: b.vehicle.position.bearing} ,
            ["geometry"]: {["type"]: "Point",["coordinates"]: [b.vehicle.position.longitude,b.vehicle.position.latitude ] } } ) 
        )
        console.log(geoJSON)
        console.log("---------------------------------------------")
        
        //before we put the buses on the map, clear the layerGroup to make sure the buses from the last refresh don't get shown on the map
        layerGroup.clearLayers()

    


        L.geoJSON(geoJSON, {
            pointToLayer: function(geoJsonPoint, latlng) {
                //sets each object in our geoJSON object with type: Point to have our custom bus icon, 
                //and rotates the bus based on the buses bearing
                return L.marker(latlng, {
                    icon: busIcon,
                    rotationAngle: geoJsonPoint.properties.bearing
                })
            },
            onEachFeature(feature,layer){
                //sets the popup for each bus to be the buses line number and the bus number
                layer.bindPopup('Line: ' + feature.properties.route + " Bus No: " + feature.properties.busNum)
            }
        }).addTo(layerGroup)
    })
    }

})()