import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CITY_COORDS = {
  gurugram: [28.4595, 77.0266],
  gurgaon: [28.4595, 77.0266],
  noida: [28.5355, 77.391],
  delhi: [28.6139, 77.209],
  jaipur: [26.9124, 75.7873],
  mumbai: [19.076, 72.8777],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
};

function resolveCoordinates(property) {
  const lat = Number(property?.latitude);
  const lng = Number(property?.longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }

  const location = String(property?.location || "").toLowerCase();

  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (location.includes(city)) {
      return coords;
    }
  }

  return [28.6139, 77.209];
}

function PropertyMap({ property }) {
  const [ready, setReady] = useState(false);
  const position = resolveCoordinates(property);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-800 bg-gray-950 text-gray-400">
        Loading map...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-800">
      <MapContainer
        key={property?.id || property?.location}
        center={position}
        zoom={12}
        scrollWheelZoom={false}
        className="h-64 w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon}>
          <Popup>
            <strong>{property?.title}</strong>
            <br />
            {property?.location}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default PropertyMap;
