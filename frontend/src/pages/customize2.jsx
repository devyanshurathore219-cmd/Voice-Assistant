import React, { useContext, useState } from "react";
import { userDataContext } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MdKeyboardBackspace } from "react-icons/md";

function Customize2() {
  const {
    userData,
    backendImage,
    selectedImage,
    serverUrl,
    setUserData,
  } = useContext(userDataContext);

  const [assistantName, setAssistantName] = useState(
    userData?.assistantName || ""
  );

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleUpdateAssistant = async () => {
    if (!userData) {
      alert("You must be signed in to create an assistant.");
      navigate("/signin");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("assistantName", assistantName);

      if (backendImage) {
        formData.append("assistantImage", backendImage);
      } else {
        formData.append("imageUrl", selectedImage);
      }

      const result = await axios.post("/api/user/update", formData, {
        withCredentials: true,
      });

      console.log(result.data);

      setUserData(result.data);

      setLoading(false);

      // Navigate to home after successful update
      navigate("/");
    } catch (error) {
      const resp = error.response;
      console.error("updateAssistant error:", resp || error.message || error);
      if (resp && resp.status === 401) {
        alert("Session expired or user not found. Please sign in again.");
        navigate("/signin");
        setLoading(false);
        return;
      }

      if (resp && resp.data) {
        console.error("response.data:", resp.data);
        alert(
          `Update failed: ${resp.data.message || JSON.stringify(resp.data)}`,
        );
      } else {
        alert(`Update failed: ${error.message || "Unknown error"}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-black to-[#030353] flex justify-center items-center flex-col p-[20px] relative">
      <MdKeyboardBackspace
        className="absolute top-[30px] left-[30px] text-white cursor-pointer w-[25px] h-[25px]"
        onClick={() => navigate("/customize")}
      />

      <h1 className="text-white mb-[40px] text-[30px] text-center">
        Enter Your{" "}
        <span className="text-blue-200">Assistant Name</span>
      </h1>

      <input
        type="text"
        placeholder="eg. shifra"
        className="
          w-full
          max-w-[600px]
          h-[60px]
          outline-none
          border-2
          border-white
          bg-transparent
          text-white
          placeholder-gray-300
          px-[20px]
          py-[10px]
          rounded-full
          text-[18px]
        "
        required
        value={assistantName}
        onChange={(e) => setAssistantName(e.target.value)}
      />

      {assistantName && (
        <button
          className="
            min-w-[300px]
            h-[60px]
            mt-[30px]
            text-black
            font-semibold
            cursor-pointer
            bg-white
            rounded-full
            text-[19px]
            transition-all
            duration-300
            hover:bg-blue-500
            hover:text-white
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
          disabled={loading}
          onClick={handleUpdateAssistant}
        >
          {!loading
            ? "Finally Create Your Assistant"
            : "Loading..."}
        </button>
      )}
    </div>
  );
}

export default Customize2;