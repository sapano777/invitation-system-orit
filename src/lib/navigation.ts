// Deep links that open Waze / Google Maps with directions to the venue.
// Coordinates are exact; the address is a fallback when none were set.

type Place = { lat: number | null; lng: number | null; address: string | null; venue_name: string | null };

function query(place: Place) {
  return [place.venue_name, place.address].filter(Boolean).join(", ");
}

export function wazeUrl(place: Place): string | null {
  if (place.lat !== null && place.lng !== null) {
    return `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`;
  }
  return place.address ? `https://waze.com/ul?q=${encodeURIComponent(query(place))}&navigate=yes` : null;
}

export function googleMapsUrl(place: Place): string | null {
  if (place.lat !== null && place.lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  }
  return place.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query(place))}` : null;
}
