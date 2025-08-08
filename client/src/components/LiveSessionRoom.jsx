// components/LiveSessionRoom.jsx
import { useEffect, useRef, useState } from 'react';
import { connect } from 'livekit-client';

export default function LiveSessionRoom({ token, url }) {
  const [room, setRoom] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    let activeRoom;

    connect(url, token).then((joinedRoom) => {
      setRoom(joinedRoom);
      activeRoom = joinedRoom;

      // Attach local video
      joinedRoom.localParticipant.videoTracks.forEach((pub) => {
        const track = pub.track;
        if (track) track.attach(localVideoRef.current);
      });

      // Listen for remote participants
      joinedRoom.on('trackSubscribed', (track, publication, participant) => {
        if (track.kind === 'video') {
          track.attach(remoteVideoRef.current);
        }
      });
    });

    return () => {
      if (activeRoom) activeRoom.disconnect();
    };
  }, [token, url]);

  return (
    <div className="p-4 grid gap-4 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-semibold">👤 You (Instructor/Student)</h3>
        <video ref={localVideoRef} autoPlay muted className="rounded border" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">🧑‍🤝‍🧑 Remote Participant</h3>
        <video ref={remoteVideoRef} autoPlay className="rounded border" />
      </div>
    </div>
  );
}
