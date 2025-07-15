import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Image from "../Image.jsx";

export default function IndexPage() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    axios
      .get("/places")
      .then((response) => {
        // Ensure the data is an array before setting it
        if (Array.isArray(response.data)) {
          setPlaces(response.data);
        } else {
          console.error("Unexpected response from /places:", response.data);
          setPlaces([]); // fallback to empty array
        }
      })
      .catch((err) => {
        console.error("Error fetching /places:", err);
        setPlaces([]); // fallback to prevent crashing
      });
  }, []);

  return (
    <div className="mt-8 grid gap-x-6 gap-y-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
      {places.map((place) => (
        <Link to={"/place/" + place._id} key={place._id}>
          <div className="bg-gray-500 mb-2 rounded-2xl flex">
            {place.photos?.[0] && (
              <Image
                className="rounded-2xl object-cover aspect-square"
                src={place.photos[0]}
                alt=""
              />
            )}
          </div>
          <h2 className="font-bold">{place.address}</h2>
          <h3 className="text-sm text-gray-500">{place.title}</h3>
          <div className="mt-1">
            <span className="font-bold">${place.price}</span> per night
          </div>
        </Link>
      ))}
    </div>
  );
}
