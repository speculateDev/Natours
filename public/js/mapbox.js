/* eslint-disable */
// Parse locations from the data attribute
export const displayMap = locations => {
  // Set Mapbox access token
  mapboxgl.accessToken =
    'pk.eyJ1Ijoiam9uYXNzY2htZWR0bWFubiIsImEiOiJjam54ZmM5N3gwNjAzM3dtZDNxYTVlMnd2In0.ytpI7V7w7cyT1Kq5rT9Z1A';

  // Create a new map instance
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jonasschmedtmann/cjvi9q8jd04mi1cpgmg7ev3dy',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // interactive: false
  });

  // Create a 'LngLatBounds' with no coordinates
  const bounds = new mapboxgl.LngLatBounds();

  // Add markers to the map
  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 40
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  // Fit map to bounds
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 200,
      right: 200
    }
  });

  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
};
