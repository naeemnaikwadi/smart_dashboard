import React, { useState, useCallback } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';

const ScreenShareControls = ({ isInstructor }) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const toggleScreenShare = useCallback(async () => {
    if (!isInstructor || !localParticipant) return;

    setIsLoading(true);
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        await localParticipant.unpublishTrack(Track.Source.ScreenShare);
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        await localParticipant.setScreenShareEnabled(true);
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      alert('Failed to toggle screen share. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isInstructor, localParticipant, isScreenSharing]);

  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const isEnabled = localParticipant.isCameraEnabled;
      await localParticipant.setCameraEnabled(!isEnabled);
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  }, [localParticipant]);

  const toggleMicrophone = useCallback(async () => {
    if (!localParticipant) return;

    try {
      const isEnabled = localParticipant.isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(!isEnabled);
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  }, [localParticipant]);

  if (!isInstructor) {
    return (
      <div className="flex space-x-2">
        <button
          onClick={toggleMicrophone}
          className={`px-4 py-2 rounded-lg text-white ${
            localParticipant?.isMicrophoneEnabled
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {localParticipant?.isMicrophoneEnabled ? '🎤' : '🎤❌'}
        </button>
        <button
          onClick={toggleCamera}
          className={`px-4 py-2 rounded-lg text-white ${
            localParticipant?.isCameraEnabled
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {localParticipant?.isCameraEnabled ? '📹' : '📹❌'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={toggleScreenShare}
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg text-white ${
          isScreenSharing
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-blue-600 hover:bg-blue-700'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? '⏳' : isScreenSharing ? '🖥️ Stop Sharing' : '🖥️ Share Screen'}
      </button>
      
      <button
        onClick={toggleMicrophone}
        className={`px-4 py-2 rounded-lg text-white ${
          localParticipant?.isMicrophoneEnabled
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {localParticipant?.isMicrophoneEnabled ? '🎤' : '🎤❌'}
      </button>
      
      <button
        onClick={toggleCamera}
        className={`px-4 py-2 rounded-lg text-white ${
          localParticipant?.isCameraEnabled
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {localParticipant?.isCameraEnabled ? '📹' : '📹❌'}
      </button>
    </div>
  );
};

export default ScreenShareControls;
