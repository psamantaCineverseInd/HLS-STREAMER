import { useEffect, useState, useRef } from "react";
import Hls from "hls.js";

function HLSPlayer() {
  const videoRef = useRef(null);
  const [levels, setLevels] = useState([]);
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const hls = new Hls();

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
      hls.destroy();
    };
  }, []);

  return (
    <div className="w-200 bg-zinc-900 border border-red-500 rounded-xl overflow-hidden">
      <video ref={videoRef} controls className="w-full aspect-video bg-black" />
      <div className="flex gap-2 p-3">
        {levels.map((level,index)=>(
            <button key={index} className="px-3 py-1 bg-zinc-800 text-white cursor-pointer hover:bg-zinc-500">
                {level.height}p
            </button>
        ))}
      </div>
    </div>
  );
}

export default HLSPlayer;
