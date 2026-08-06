import React, {
  createContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";

export const userDataContext = createContext();

function UserContext({ children }) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

  // User Data
  const [userData, setUserData] = useState(null);

  // Assistant Image States
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Get Current Logged In User
  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(
        "/api/user/current",
        {
          withCredentials: true,
        }
      );

      setUserData(result.data);
      console.log(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, []);

  const value = {
    serverUrl,

    userData,
    setUserData,

    backendImage,
    setBackendImage,

    frontendImage,
    setFrontendImage,

    selectedImage,
    setSelectedImage,

    handleCurrentUser,
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;