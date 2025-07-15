import { useContext, useState } from "react";
import { UserContext } from "../UserContext.jsx";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios";
import PlacesPage from "./PlacesPage";
import AccountNav from "../AccountNav";

export default function ProfilePage() {
  const [redirect, setRedirect] = useState(null);
  const { ready, user, setUser } = useContext(UserContext);
  let { subpage } = useParams();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");

  if (!subpage) subpage = "profile";

  async function logout() {
    await axios.post("/logout");
    setRedirect("/");
    setUser(null);
  }

  async function saveProfile() {
    try {
      const { data } = await axios.post("/profile", { name, phone, location });
      setUser(data);
      setEditing(false);
      alert("Profile updated successfully");
    } catch (err) {
      alert("Error updating profile");
    }
  }

  if (!ready) return "Loading...";
  if (ready && !user && !redirect) return <Navigate to={"/login"} />;
  if (redirect) return <Navigate to={redirect} />;

  return (
    <div className="px-4 md:px-8 py-4 flex flex-col min-h-screen w-full">
      <AccountNav />

      {subpage === "profile" && (
        <div className="max-w-md mx-auto mt-8 w-full">
          {!editing ? (
            <div className="bg-white shadow p-8 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-700">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <h2 className="text-3xl font-semibold mb-2">{user.name}</h2>
              <p className="text-gray-600 mb-1">{user.email}</p>
              <p className="text-gray-600 mb-1">
                📞 {user.phone || "Not Provided"}
              </p>
              <p className="text-gray-600 mb-4">
                📍 {user.location || "Not Provided"}
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setEditing(true)}
                  className="bg-primary text-white px-6 py-2 rounded-full shadow hover:shadow-lg transition"
                >
                  Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="bg-gray-300 px-6 py-2 rounded-full shadow hover:shadow-lg transition"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-center">
                Edit Profile
              </h2>
              <div className="mb-2">
                <label className="block text-sm font-semibold">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border p-2 rounded focus:outline-primary"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border p-2 rounded focus:outline-primary"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-semibold">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border p-2 rounded focus:outline-primary"
                />
              </div>
              <div className="flex gap-4 justify-center mt-4">
                <button
                  onClick={saveProfile}
                  className="bg-primary text-white px-6 py-2 rounded-full shadow hover:shadow-lg transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-300 px-6 py-2 rounded-full shadow hover:shadow-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {subpage === "places" && <PlacesPage />}
    </div>
  );
}
