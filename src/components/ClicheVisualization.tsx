import React from "react";
import Particles from "react-tsparticles";
import "./ClicheVisualization.scss";

const particlesOptions = {
  background: {
    color: {
      value: "rgb(5, 8, 13)",
    },
  },
  detectRetina: true,
  fpsLimit: 30,
  interactivity: {
    detectsOn: "canvas",
    events: {
      resize: true,
    },
    modes: {
      attract: {
        distance: 200,
        duration: 0.4,
        speed: 1,
      },
      bubble: {
        distance: 400,
        duration: 2,
        opacity: 0.8,
        size: 40,
      },
      connect: {
        distance: 80,
        links: {
          opacity: 0.5,
        },
        radius: 60,
      },
      grab: {
        distance: 400,
        links: {
          opacity: 0.8,
        },
      },
      repulse: {
        distance: 200,
        duration: 0.4,
        speed: 1,
      },
      slow: {
        factor: 3,
        radius: 200,
      },
      trail: {
        delay: 1,
        quantity: 1,
      },
    },
  },
  particles: {
    color: {
      value: "#e7f4f7",
    },
    links: {
      blink: false,
      color: {
        value: "rgb(156, 210, 220)",
      },
      consent: false,
      distance: 150,
      enable: true,
      opacity: 0.4,
      width: 1,
      warp: false,
    },
    move: {
      angle: 90,
      direction: "none",
      enable: true,
      outMode: "out",
      random: false,
      speed: 2,
      straight: false,
      vibrate: false,
      warp: false,
    },
    number: {
      density: {
        enable: true,
        area: 200,
        factor: 1000,
      },
      limit: 0,
      value: 80,
    },
    opacity: {
      animation: {
        enable: true,
        minimumValue: 0.1,
        speed: 3,
        sync: false,
      },
      random: {
        enable: true,
        minimumValue: 1,
      },
      value: 0.5,
    },
    shape: {
      type: "circle",
    },
    size: {
      animation: {
        destroy: "none",
        enable: true,
        minimumValue: 0.1,
        speed: 20,
        startValue: "max",
        sync: false,
      },
      random: {
        enable: true,
        minimumValue: 1,
      },
      value: 5,
    },
  },
  pauseOnBlur: true,
};

export function ClicheVisualization(): JSX.Element {
  return (
    <Particles className="ClicheVisualization" options={particlesOptions} />
  );
}
