import React, { useState, useEffect } from "react";

const Countdown = ({ saleStart, saleEnd }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(saleStart));
  const [status, setStatus] = useState(getStatus(saleStart, saleEnd));

  useEffect(() => {
    if (saleEnd) return;
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(saleStart));
      setStatus(getStatus(saleStart, saleEnd));
    }, 1000);

    return () => clearInterval(timer);
  }, [saleStart, saleEnd]);

  function getStatus(saleStart, saleEnd) {
    if (saleEnd) return "soldOut";
    const now = Math.floor(Date.now() / 1000);
    if (now < saleStart) return "beforeStart";
    return "active";
  }

  function calculateTimeLeft(saleStart) {
    const now = Math.floor(Date.now() / 1000);
    const difference = saleStart - now;

    if (difference > 0) {
      const days = Math.floor(difference / (60 * 60 * 24));
      const hours = Math.floor((difference / (60 * 60)) % 24);
      const minutes = Math.floor((difference / 60) % 60);
      const seconds = Math.floor(difference % 60);
      return { days, hours, minutes, seconds };
    } else {
      return null;
    }
  }

  if (status === "soldOut") {
    return <h4>Sold out!</h4>;
  }

  if (status === "beforeStart" && !timeLeft) {
    return <h4>Loading...</h4>;
  }

  return (
    <div>
      {status === "beforeStart" && (
        <div>
          <h4 style={{ lineHeight: 0.5, marginBottom: 0 }}>
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </h4>
          <span>(sale starts in)</span>
        </div>
      )}
      {status === "active" && (
        <h4>Sale is open!</h4>
      )}
    </div>
  );
};

export default Countdown;