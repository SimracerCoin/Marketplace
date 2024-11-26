import React, { useState, useEffect } from "react";

const Countdown = ({ saleStart }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(saleStart));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(saleStart));
    }, 1000);

    return () => clearInterval(timer);
  }, [saleStart]);

  function calculateTimeLeft(timestamp) {
    const difference = timestamp - Date.now();
    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      return { days, hours, minutes, seconds };
    } else {
      return null;
    }
  }

  if (!timeLeft) {
    return <div>Sale started!</div>;
  }

  return (
    <h4>
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </h4>
  );
};

export default Countdown;
