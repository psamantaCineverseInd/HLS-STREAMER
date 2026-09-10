import HLSPlayer from "./components/HLSPlayer";
import logo from "./assets/hlslogo.png";

function App() {
  return (
    <main className="min-h-screen bg-black px-6 py-6">

      {/* Logo */}
      <img
        src={logo}
        alt="HLS Player"
        className="w-36 mb-6"
      />

      {/* Player */}
      <div className="flex justify-center">
        <HLSPlayer />
      </div>

    </main>
  );
}

export default App;