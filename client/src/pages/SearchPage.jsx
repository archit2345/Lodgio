import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

export default function SearchPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const query = params.get("query");

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    axios
      .get(`/search?query=${encodeURIComponent(query)}`)
      .then((res) => {
        setPlaces(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [query]);

  if (!query) return <div>Please enter a search query.</div>;

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      {loading ? (
        <div className="text-center text-lg">Loading...</div>
      ) : places.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {places.map((place) => (
            <Link
              to={`/place/${place._id}`}
              key={place._id}
              className="rounded-lg overflow-hidden shadow hover:shadow-lg transition duration-300 block"
            >
              <img
                src={place.photos[0]}
                alt={place.title}
                className="h-64 w-full object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold">{place.title}</h2>
                <p className="text-gray-600">{place.address}</p>
                <p className="mt-2 font-bold">${place.price} per night</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600 text-lg">
          No results found for "<span className="font-semibold">{query}</span>"
        </div>
      )}
    </div>
  );
}
