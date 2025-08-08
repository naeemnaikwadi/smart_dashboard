import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
  Chat,
  ConnectionStateToast,
} from '@livekit/components-react';
import {
  Track,
  Room,
  ConnectionState,
  RemoteParticipant,
  LocalParticipant,
  DataPacket_Kind,
  RoomEvent,
} from 'livekit-client';
import { getCurrentUser, getAuthHeaders } from '../utils/auth';
import ScreenShareControls from '../components/ScreenShareControls';
import '@livekit/components-styles';

const LiveSessionRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  
  // Instructor controls state
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  
  // Student interaction state
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState([]);

  const currentUser = getCurrentUser();
  const isInstructor = currentUser?.role === 'instructor';

  useEffect(() => {
    if (roomName && currentUser) {
      fetchToken();
    }
  }, [roomName, currentUser]);

  const fetchToken = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/livekit/join-room?roomName=${roomName}&identity=${currentUser.name}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUserRole(data.role);
      } else {
        throw new Error('Failed to get room token');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      setError('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnected = useCallback(() => {
    setConnected(false);
    navigate('/');
  }, [navigate]);

  const handleConnected = useCallback(() => {
    setConnected(true);
  }, []);

  // Instructor functions
  const fetchParticipants = async () => {
    if (!isInstructor) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/participants`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const removeParticipant = async (participantIdentity) => {
    if (!isInstructor) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/remove-participant`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantIdentity })
      });
      
      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const toggleParticipantPermissions = async (participantIdentity, canPublish) => {
    if (!isInstructor) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/update-permissions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantIdentity, canPublish: !canPublish })
      });
      
      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const createPoll = () => {
    if (!isInstructor || !newPoll.question.trim()) return;
    
    const poll = {
      id: Date.now(),
      question: newPoll.question,
      options: newPoll.options.filter(opt => opt.trim()),
      votes: {},
      active: true,
      createdAt: new Date()
    };
    
    setPolls(prev => [...prev, poll]);
    setNewPoll({ question: '', options: ['', ''] });
    
    // Broadcast poll to all participants
    // This would be handled by the room's data channel
  };

  const endRoom = async () => {
    if (!isInstructor) return;
    
    if (window.confirm('Are you sure you want to end this session for everyone?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/end`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error ending room:', error);
      }
    }
  };

  // Student functions
  const toggleHandRaise = () => {
    setHandRaised(!handRaised);
    // Send hand raise status via data channel
  };

  const sendReaction = (emoji) => {
    const reaction = {
      id: Date.now(),
      emoji,
      user: currentUser.name,
      timestamp: Date.now()
    };
    
    setReactions(prev => [...prev, reaction]);
    
    // Remove reaction after 3 seconds
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
    
    // Send reaction via data channel
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Joining session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 relative">
      <LiveKitRoom
        video={isInstructor}
        audio={isInstructor}
        token={token}
        serverUrl={process.env.REACT_APP_LIVEKIT_URL || 'ws://localhost:7880'}
        data-lk-theme="default"
        style={{ height: '100vh' }}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
      >
        {/* Main Video Conference */}
        <VideoConference 
          chatMessageFormatter={(message, participant) => `${participant?.name}: ${message}`}
        />
        
        {/* Instructor Controls Panel */}
        {isInstructor && (
          <div className="absolute top-4 right-4 z-50">
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Participants ({participants.length})
              </button>
              <button
                onClick={() => setShowPolls(!showPolls)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
              >
                Polls
              </button>
              <button
                onClick={endRoom}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Student Controls */}
        {!isInstructor && (
          <div className="absolute top-4 right-4 z-50">
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <button
                onClick={toggleHandRaise}
                className={`w-full px-4 py-2 rounded text-sm ${
                  handRaised 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white`}
              >
                {handRaised ? '✋ Hand Raised' : '✋ Raise Hand'}
              </button>
              
              <div className="flex space-x-1">
                {['👍', '👏', '❤️', '😂', '😮'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && isInstructor && (
          <div className="absolute top-20 right-4 w-80 bg-gray-800 rounded-lg p-4 z-50 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Participants</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {participants.map(participant => (
                <div key={participant.identity} className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{participant.name}</div>
                      <div className="text-gray-400 text-sm">
                        {participant.permission?.canPublish ? 'Can Share' : 'View Only'}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleParticipantPermissions(
                          participant.identity, 
                          participant.permission?.canPublish
                        )}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        {participant.permission?.canPublish ? 'Restrict' : 'Allow'}
                      </button>
                      <button
                        onClick={() => removeParticipant(participant.identity)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polls Panel */}
        {showPolls && isInstructor && (
          <div className="absolute top-20 right-4 w-96 bg-gray-800 rounded-lg p-4 z-50 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Live Polls</h3>
              <button
                onClick={() => setShowPolls(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Create Poll */}
            <div className="mb-4 p-3 bg-gray-700 rounded">
              <input
                type="text"
                placeholder="Poll question..."
                value={newPoll.question}
                onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                className="w-full bg-gray-600 text-white p-2 rounded mb-2"
              />
              
              {newPoll.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Option ${index + 1}...`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...newPoll.options];
                    newOptions[index] = e.target.value;
                    setNewPoll(prev => ({ ...prev, options: newOptions }));
                  }}
                  className="w-full bg-gray-600 text-white p-2 rounded mb-1"
                />
              ))}
              
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => setNewPoll(prev => ({ 
                    ...prev, 
                    options: [...prev.options, ''] 
                  }))}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                >
                  Add Option
                </button>
                <button
                  onClick={createPoll}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Create Poll
                </button>
              </div>
            </div>
            
            {/* Active Polls */}
            <div className="space-y-2">
              {polls.map(poll => (
                <div key={poll.id} className="bg-gray-700 rounded p-3">
                  <div className="text-white font-medium mb-2">{poll.question}</div>
                  <div className="space-y-1">
                    {poll.options.map((option, index) => (
                      <div key={index} className="text-gray-300 text-sm">
                        {option} ({Object.values(poll.votes).filter(v => v === index).length} votes)
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reactions Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
          {reactions.map(reaction => (
            <div
              key={reaction.id}
              className="absolute animate-bounce text-4xl"
              style={{
                left: Math.random() * 200 - 100,
                top: Math.random() * 200 - 100,
                animationDuration: '2s'
              }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
            <ScreenShareControls isInstructor={isInstructor} />
            
            <div className="border-l border-gray-600 h-8"></div>
            
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Leave Session
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <ConnectionStateToast />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default LiveSessionRoom;
