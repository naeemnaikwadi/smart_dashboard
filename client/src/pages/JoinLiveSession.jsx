import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  LiveKitRoom,
  useLocalParticipant,
  useTracks,
  GridLayout,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";

const livekitURL = "ws://localhost:7880";

const RaiseHandButton = () => {
  const { localParticipant } = useLocalParticipant();
  const [raised, setRaised] = useState(false);

  const toggleRaiseHand = async () => {
    const newState = !raised;
    setRaised(newState);
    try {
      await localParticipant.setMetadata(JSON.stringify({ handRaised: newState }));
    } catch (err) {
      console.error("Raise hand error:", err);
    }
  };

  return (
    <button
      onClick={toggleRaiseHand}
      className={`px-4 py-2 rounded text-white ${raised ? 'bg-yellow-600' : 'bg-blue-600'}`}
    >
      {raised ? 'Lower Hand ✋' : 'Raise Hand ✋'}
    </button>
  );
};

function LiveRoomContent() {
  const tracks = useTracks(
    [{ source: 'camera' }, { source: 'microphone' }],
    { onlySubscribed: false }
  );

  console.log("Tracks:", tracks); // For debug

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <RoomAudioRenderer />
      <div className="flex-1">
        <GridLayout tracks={tracks} />
      </div>
      <div className="p-4 flex justify-between items-center">
        <RaiseHandButton />
        <ControlBar />
      </div>
    </div>
  );
}

export default function JoinLiveSession() {
  const { roomName, username } = useParams();
  const [token, setToken] = useState(null);
  const [joined, setJoined] = useState(false);
  const [mediaDevices, setMediaDevices] = useState({ cams: [], mics: [] });
  const [selectedCam, setSelectedCam] = useState('');
  const [selectedMic, setSelectedMic] = useState('');

  useEffect(() => {
    const getToken = async () => {
      try {
        const res = await fetch(`/api/livekit/join-room?roomName=${roomName}&identity=${username}`);
        const data = await res.json();
        setToken(data.token);
      } catch (error) {
        console.error("Token fetch error:", error);
      }
    };

    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        const mics = devices.filter((d) => d.kind === 'audioinput');
        setMediaDevices({ cams, mics });

        if (!selectedCam && cams.length > 0) setSelectedCam(cams[0].deviceId);
        if (!selectedMic && mics.length > 0) setSelectedMic(mics[0].deviceId);
      } catch (err) {
        console.error("Device access error:", err);
        setMediaDevices({ cams: [], mics: [] });
      }
    };

    getToken();
    getDevices();
  }, [roomName, username]);

  if (!token) return <p className="text-center mt-20 text-white">Loading session...</p>;

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-gray-900 text-white">
        <h2 className="text-xl font-semibold">Ready to Join "{roomName}"?</h2>

        <div>
          <label className="block mb-1 font-medium">Camera</label>
          <select
            className="p-2 border rounded text-black"
            onChange={(e) => setSelectedCam(e.target.value)}
            value={selectedCam}
          >
            {(mediaDevices?.cams || []).map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || 'Camera'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Microphone</label>
          <select
            className="p-2 border rounded text-black"
            onChange={(e) => setSelectedMic(e.target.value)}
            value={selectedMic}
          >
            {(mediaDevices?.mics || []).map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || 'Microphone'}
              </option>
            ))}
          </select>
        </div>

        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setJoined(true)}
        >
          Join Live Session
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl="ws://localhost:7880"
      connect={true}
      video={true}
      audio={true}
     //videoCaptureDefaults={{ deviceId: selectedCam }}
    // audioCaptureDefaults={{ deviceId: selectedMic }}
     // onConnected={() => console.log("Connected to LiveKit room")}
      //onDisconnected={(room, reason) => console.log("Disconnected:", reason)}
    >
      <LiveRoomContent />
    </LiveKitRoom>
  );
}
