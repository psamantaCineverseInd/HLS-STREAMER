import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

function HLSPlayer() {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const playerRef = useRef(null);
  const progressRef = useRef(null);

  const [levels, setLevels] = useState([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [currentQuality, setCurrentQuality] = useState(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isSeeking, setIsSeeking] = useState(false);

  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  const getQualityLabel = (height) => {
    if (height <= 240) return "240p";
    if (height <= 360) return "360p";
    if (height <= 480) return "480p";
    if (height <= 720) return "720p";
    return "1080p";
  };

  const getInitialQualityCap = () => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) {
      return 720;
    }

    const type = connection.effectiveType;

    if (type === "slow-2g" || type === "2g") {
      return 240;
    }

    if (type === "3g") {
      return 480;
    }

    if (type === "4g") {
      return 720;
    }

    return 1080;
  };

  const getBandwidthCap = (bandwidth) => {
    if (!bandwidth || !Number.isFinite(bandwidth)) {
      return 720;
    }

    const mbps = bandwidth / 1000000;

    if (mbps < 0.7) {
      return 240;
    }

    if (mbps < 1.5) {
      return 360;
    }

    if (mbps < 3) {
      return 480;
    }

    if (mbps < 6) {
      return 720;
    }

    return 1080;
  };

  const getClosestLevelIndex = (maxHeight) => {
    if (!hlsRef.current) return -1;

    const availableLevels = hlsRef.current.levels;

    let selectedIndex = -1;

    availableLevels.forEach((level, index) => {
      if (level.height <= maxHeight) {
        selectedIndex = index;
      }
    });

    return selectedIndex;
  };

  const updateAutoQualityCap = () => {
    const hls = hlsRef.current;

    if (!hls || selectedQuality !== -1) return;

    const networkCap = getInitialQualityCap();
    const bandwidthCap = getBandwidthCap(
      hls.bandwidthEstimate
    );

    const finalCap = Math.min(
      networkCap,
      bandwidthCap
    );

    const levelIndex =
      getClosestLevelIndex(finalCap);

    if (levelIndex >= 0) {
      hls.autoLevelCapping = levelIndex;
    }
  };

  const changeQuality = (index) => {
    if (!hlsRef.current) return;

    if (index === -1) {
      hlsRef.current.autoLevelCapping =
        hlsRef.current.levels.length - 1;

      hlsRef.current.currentLevel = -1;

      setSelectedQuality(-1);

      return;
    }

    hlsRef.current.currentLevel = index;

    setSelectedQuality(index);
  };

  const togglePlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch (error) {
        console.error(
          "Unable to play video:",
          error
        );
      }
    } else {
      video.pause();
    }
  };

  const changeVolume = (value) => {
    const video = videoRef.current;

    if (!video) return;

    video.volume = value;

    if (value > 0) {
      video.muted = false;
      setIsMuted(false);
    }

    setVolume(value);
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.muted) {
      video.muted = false;
      setIsMuted(false);

      if (video.volume === 0) {
        video.volume = 1;
        setVolume(1);
      }
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time)) {
      return "0:00";
    }

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor(
      (time % 3600) / 60
    );
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleProgressHover = (e) => {
    if (!progressRef.current || !duration) {
      return;
    }

    const rect =
      progressRef.current.getBoundingClientRect();

    const position = e.clientX - rect.left;

    const percentage = Math.min(
      Math.max(position / rect.width, 0),
      1
    );

    const time = percentage * duration;

    setHoverTime(time);
    setHoverPosition(percentage * 100);
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);

    const video = videoRef.current;

    if (!video) return;

    setIsSeeking(true);

    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleFullscreen = async () => {
    const player = playerRef.current;

    if (!player) return;

    try {
      if (!document.fullscreenElement) {
        await player.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(
        "Fullscreen error:",
        error
      );
    }
  };

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleSeeking = () => {
      setIsSeeking(true);
    };

    const handleSeeked = () => {
      setIsSeeking(false);
    };

    video.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    video.addEventListener(
      "play",
      handlePlay
    );

    video.addEventListener(
      "pause",
      handlePause
    );

    video.addEventListener(
      "seeking",
      handleSeeking
    );

    video.addEventListener(
      "seeked",
      handleSeeked
    );

    const hls = new Hls({
      abrEwmaFastLive: 3,
      abrEwmaSlowLive: 9,

      abrEwmaDefaultEstimate: 1000000,

      abrBandWidthFactor: 0.8,

      abrBandWidthUpFactor: 0.6,

      maxBufferLength: 30,

      maxMaxBufferLength: 60,

      capLevelToPlayerSize: false,
    });

    hlsRef.current = hls;

    hls.loadSource(
      "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
    );

    hls.attachMedia(video);

    hls.on(
      Hls.Events.MANIFEST_PARSED,
      () => {
        console.log(
          "Available HLS levels:",
          hls.levels
        );

        setLevels(hls.levels);

        hls.currentLevel = -1;

        setTimeout(() => {
          updateAutoQualityCap();
        }, 500);
      }
    );

    hls.on(
      Hls.Events.LEVEL_SWITCHED,
      (_, data) => {
        const level =
          hls.levels[data.level];

        if (!level) return;

        setCurrentQuality({
          width: level.width,
          height: level.height,
        });
      }
    );

    const qualityInterval = setInterval(() => {
      if (selectedQuality === -1) {
        updateAutoQualityCap();
      }
    }, 2000);

    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      clearInterval(qualityInterval);

      video.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      video.removeEventListener(
        "play",
        handlePlay
      );

      video.removeEventListener(
        "pause",
        handlePause
      );

      video.removeEventListener(
        "seeking",
        handleSeeking
      );

      video.removeEventListener(
        "seeked",
        handleSeeked
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      hls.destroy();
    };
  }, [selectedQuality]);

  const progressPercentage = duration
    ? (currentTime / duration) * 100
    : 0;

  return (
    <div className="w-full max-w-[1300px]">

      <div
        ref={playerRef}
        className={`relative w-full bg-black overflow-hidden ${
          isFullscreen
            ? "h-screen max-w-none rounded-none border-0"
            : "aspect-video rounded-xl border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
        }`}
      >
        <video
          ref={videoRef}
          className={`block w-full bg-black object-contain ${
            isFullscreen
              ? "h-screen"
              : "h-full"
          }`}
        />

        {isSeeking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm">
              <LoaderCircle
                size={32}
                className="text-red-500 animate-spin"
              />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black/95 to-transparent pt-12 px-4 pb-3">

          <div
            ref={progressRef}
            className="relative mb-3"
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
          >
            {hoverTime !== null &&
              duration > 0 && (
                <div
                  className="absolute bottom-5 -translate-x-1/2 pointer-events-none z-20"
                  style={{
                    left: `${hoverPosition}%`,
                  }}
                >
                  <div className="bg-black text-white text-xs font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-zinc-700">
                    {formatTime(hoverTime)}
                  </div>
                </div>
              )}

            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.01"
              value={currentTime}
              onChange={handleSeek}
              className="relative z-10 w-full h-1 appearance-none rounded-full cursor-pointer accent-red-500"
              style={{
                background: `linear-gradient(
                  to right,
                  #ef4444 0%,
                  #ef4444 ${progressPercentage}%,
                  #52525b ${progressPercentage}%,
                  #52525b 100%
                )`,
              }}
            />
          </div>

          <div className="flex items-center gap-4 text-white">

            <button
              onClick={togglePlay}
              className="hover:text-red-500 transition-colors cursor-pointer"
              aria-label={
                isPlaying
                  ? "Pause"
                  : "Play"
              }
            >
              {isPlaying ? (
                <Pause
                  size={21}
                  fill="currentColor"
                />
              ) : (
                <Play
                  size={21}
                  fill="currentColor"
                />
              )}
            </button>

            <div className="flex items-center gap-2">

              <button
                onClick={toggleMute}
                className="hover:text-red-500 transition-colors cursor-pointer"
                aria-label={
                  isMuted
                    ? "Unmute"
                    : "Mute"
                }
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={
                  isMuted
                    ? 0
                    : volume
                }
                onChange={(e) =>
                  changeVolume(
                    Number(e.target.value)
                  )
                }
                className="w-20 h-1 accent-red-500 cursor-pointer"
              />

            </div>

            <div className="text-sm text-zinc-200 whitespace-nowrap">

              {formatTime(currentTime)}

              <span className="text-zinc-500 mx-1">
                /
              </span>

              {formatTime(duration)}

            </div>

            <div className="ml-auto flex items-center gap-4">

              <button
                onClick={() => {
                  setShowSettings(
                    !showSettings
                  );
                  setShowQuality(false);
                }}
                className={`transition-colors cursor-pointer ${
                  showSettings
                    ? "text-red-500"
                    : "text-white hover:text-red-500"
                }`}
                aria-label="Settings"
              >
                <Settings size={22} />
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-500 transition-colors cursor-pointer"
                aria-label={
                  isFullscreen
                    ? "Exit fullscreen"
                    : "Fullscreen"
                }
              >
                {isFullscreen ? (
                  <Minimize size={21} />
                ) : (
                  <Maximize size={21} />
                )}
              </button>

            </div>
          </div>
        </div>

        {showSettings &&
          !showQuality && (
            <div className="absolute bottom-16 right-4 w-56 bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-lg shadow-2xl overflow-hidden text-white">

              <div className="px-4 py-3 border-b border-zinc-800 font-semibold">
                Settings
              </div>

              <button
                onClick={() =>
                  setShowQuality(true)
                }
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <span>
                  Quality
                </span>

                <div className="flex items-center gap-2 text-zinc-400">

                  <span className="text-xs">
                    {selectedQuality === -1
                      ? "Auto"
                      : getQualityLabel(
                          levels[
                            selectedQuality
                          ]?.height || 0
                        )}
                  </span>

                  <ChevronRight
                    size={16}
                  />

                </div>
              </button>

            </div>
          )}

        {showQuality && (
          <div className="absolute bottom-16 right-4 w-60 max-h-[320px] bg-zinc-950/95 backdrop-blur-md border border-zinc-700 rounded-lg shadow-2xl overflow-hidden text-white">

            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">

              <button
                onClick={() =>
                  setShowQuality(false)
                }
                className="hover:text-red-500 transition-colors cursor-pointer"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <span className="font-semibold">
                Quality
              </span>

            </div>

            <div className="max-h-[260px] overflow-y-auto">

              <button
                onClick={() =>
                  changeQuality(-1)
                }
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer ${
                  selectedQuality === -1
                    ? "bg-red-500/15 text-red-500"
                    : "hover:bg-zinc-800"
                }`}
              >

                <div className="flex flex-col items-start">

                  <span>
                    Auto
                  </span>

                  <span className="text-xs text-zinc-500">
                    Adaptive quality
                  </span>

                </div>

                {selectedQuality === -1 && (
                  <span className="text-red-500 font-bold">
                    ✓
                  </span>
                )}

              </button>

              {levels.map(
                (level, index) => (
                  <button
                    key={`${level.height}-${index}`}
                    onClick={() =>
                      changeQuality(index)
                    }
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer ${
                      selectedQuality ===
                      index
                        ? "bg-red-500/15 text-red-500"
                        : "hover:bg-zinc-800"
                    }`}
                  >

                    <div className="flex flex-col items-start">

                      <span>
                        {getQualityLabel(
                          level.height
                        )}
                      </span>

                      <span className="text-xs text-zinc-500">
                        {(
                          level.bitrate /
                          1000000
                        ).toFixed(2)}{" "}
                        Mbps
                      </span>

                    </div>

                    {selectedQuality ===
                      index && (
                      <span className="text-red-500 font-bold">
                        ✓
                      </span>
                    )}

                  </button>
                )
              )}

            </div>

          </div>
        )}

      </div>

      <div className="mt-5 bg-zinc-950 border border-red-500/30 rounded-xl p-6 text-white">

        <h2 className="text-xl font-bold text-red-500 flex items-center gap-2 mb-5">
          <span>ℹ️</span>
          Stream Info
        </h2>

        <p className="mb-4">
          <span className="font-semibold">
            Source:
          </span>{" "}
          Sintel (Blender Foundation)
        </p>

        <div className="mb-4">

          <p className="font-semibold mb-2">
            URL:
          </p>

          <div className="bg-black border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 break-all font-mono">
            https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
          </div>

        </div>

        <p>
          <span className="font-semibold">
            Current Quality:
          </span>{" "}

          {currentQuality
            ? `${currentQuality.width} × ${currentQuality.height}`
            : "Loading..."}
        </p>

      </div>

    </div>
  );
}

export default HLSPlayer;