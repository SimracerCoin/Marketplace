import React, { useState, useEffect } from "react";

const Countdown = ({ saleStart, saleEnd }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(saleStart, saleEnd));
  const [status, setStatus] = useState(getStatus(saleStart, saleEnd));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(saleStart, saleEnd));
      setStatus(getStatus(saleStart, saleEnd));
    }, 1000);

    return () => clearInterval(timer);
  }, [saleStart, saleEnd]);

  function getStatus(saleStart, saleEnd) {
    const now = Math.floor(Date.now() / 1000);
    if (now < saleStart) return "beforeStart";
    if (now >= saleStart && now < saleEnd) return "active";
    if (now >= saleEnd) return "ended";
  }

  function calculateTimeLeft(saleStart, saleEnd) {
    const now = Math.floor(Date.now() / 1000);
    const target = now < saleStart ? saleStart : saleEnd;
    const difference = target - now;

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

  if (status === "ended") {
    return <h4>Sales have ended!</h4>;
  }

  if (status === "beforeStart" && !timeLeft) {
    return <h4>Loading...</h4>;
  }

  return (
    <div>
      {status === "beforeStart" && (
        <div>
          <h4 style={{lineHeight: 0.5, marginBottom: 0}}>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</h4>
          <span>(sale starts in)</span>
        </div>
      )}
      {status === "active" && (
        <div>
          <h4 style={{lineHeight: 0.5, marginBottom: 0}}>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</h4>
          <span>(sale ends in)</span>
        </div>
      )}
    </div>
  );
};

export default Countdown;