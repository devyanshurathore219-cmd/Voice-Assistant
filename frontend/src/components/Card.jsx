import React from "react";

function Card({ image }) {
  return (
    <div
      className="w-[150px] h-[250px] bg-[#020220] border-2 border-[#0000ff66] rounded-2xl overflow-hidden
      hover:shadow-2xl hover:shadow-blue-950 cursor-pointer
      hover:border-4 hover:border-white transition-all duration-300"
    >
      <img
        src={image}
        alt="Card"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default Card;