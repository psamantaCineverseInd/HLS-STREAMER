import { useEffect, useState, useRef } from "react";
import Hls from "hls.js";

function HLSPlayer() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [isPlaying, setIsplaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);

  const changeQuality = (index) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = index;
  };
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsplaying(true);
    } else {
      video.pause();
      setIsplaying(false);
    }
  };
  const changeVolume = (volume) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    setVolume(value);
  };
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    const hls = new Hls();
    hlsRef.current = hls;

    hls.loadSource("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");

    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log(hls.levels);
      //   hls.levels.array.forEach((level, index) => {
      //     console.log(index, level.width, level.height, level.bitrate);
      //   });
      setLevels(hls.levels);
    });
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      hls.destroy();
    };
  }, []);
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  return (
    <div className="w-200 relative bg-zinc-900 border border-red-500 rounded-xl overflow-hidden">
      <video ref={videoRef} className="w-full aspect-video bg-black" />
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-white">🔊</span>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
          />
        </div>
        <div className="flex justify-between px-4 text-sm text-white">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <button onClick={togglePlay} className="text-white px-4 py-2">
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-full cursor-pointer"
      >
        ⚙
      </button>
      {showSettings && (
        <div className="absolute top-14 right-4 bg-zinc-900 text-white rounded-lg p-3 w-48">
          <button
            onClick={() => changeQuality(-1)}
            className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded"
          >
            Auto
          </button>
          {levels.map((level, index) => (
            <button
              key={index}
              onClick={() => changeQuality(index)}
              className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded"
            >
              {level.height}p
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default HLSPlayer;
