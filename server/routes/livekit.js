const express = require('express');
const router = express.Router();
const { AccessToken, RoomServiceClient, RoomOptions } = require('livekit-server-sdk');
const { auth, instructorOnly } = require('../middleware/auth');
require('dotenv').config();

// ✅ Use .env values securely
const apiKey = process.env.LIVEKIT_API_KEY || 'testkey';
const apiSecret = process.env.LIVEKIT_API_SECRET || 'testsecret';
const livekitUrl = process.env.LIVEKIT_URL || 'http://localhost:7880';

const svc = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

// Create a new room
router.post('/create-room', async (req, res) => {
  const { roomName } = req.body;

  if (!roomName) {
    return res.status(400).json({ error: 'Missing roomName' });
  }

  try {
    await svc.createRoom({ name: roomName });
    res.json({ message: 'Room created', room: roomName });
  } catch (err) {
    console.error('Room creation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Join a room and generate JWT token with role-based permissions
router.get('/join-room', auth, async(req, res) => {
  const { roomName, identity } = req.query;
  const userRole = req.user.role;

  if (!roomName || !identity) {
    return res.status(400).json({ error: 'Missing roomName or identity' });
  }

  try {
    console.log(`Generating token for room: ${roomName}, identity: ${identity}, role: ${userRole}`);
    // ✅ DEBUG: Check if .env is being read correctly
    console.log("apiKey from env:", apiKey);
    console.log("apiSecret from env:", apiSecret);
    console.log("livekitUrl from env:", livekitUrl);

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: 3600, // 1 hour
    });

    // Role-based permissions
    if (userRole === 'instructor') {
      // Instructor permissions: Full control
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        roomAdmin: true,
        roomRecord: true,
        roomList: true,
        canUpdateOwnMetadata: true,
      });
    } else {
      // Student permissions: Limited control
      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: false, // Students can't publish by default
        canSubscribe: true,
        canPublishData: true, // For chat and reactions
        canUpdateOwnMetadata: true,
      });
    }

    const jwt = await token.toJwt();

    console.log("Generated token:", jwt);
    res.json({ token: jwt, role: userRole });

  } catch (err) {
    console.error("JWT generation error:", err.message);
    res.status(500).json({ error: 'Failed to generate JWT token' });
  }
});

// Get room participants (instructor only)
router.get('/room/:roomName/participants', auth, instructorOnly, async (req, res) => {
  const { roomName } = req.params;

  try {
    const participants = await svc.listParticipants(roomName);
    res.json({ participants });
  } catch (err) {
    console.error('Error fetching participants:', err.message);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Remove participant from room (instructor only)
router.post('/room/:roomName/remove-participant', auth, instructorOnly, async (req, res) => {
  const { roomName } = req.params;
  const { participantIdentity } = req.body;

  if (!participantIdentity) {
    return res.status(400).json({ error: 'Missing participantIdentity' });
  }

  try {
    await svc.removeParticipant(roomName, participantIdentity);
    res.json({ message: 'Participant removed successfully' });
  } catch (err) {
    console.error('Error removing participant:', err.message);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Mute participant (instructor only)
router.post('/room/:roomName/mute-participant', auth, instructorOnly, async (req, res) => {
  const { roomName } = req.params;
  const { participantIdentity, trackSid, muted } = req.body;

  if (!participantIdentity || !trackSid) {
    return res.status(400).json({ error: 'Missing participantIdentity or trackSid' });
  }

  try {
    await svc.mutePublishedTrack(roomName, participantIdentity, trackSid, muted);
    res.json({ message: `Participant ${muted ? 'muted' : 'unmuted'} successfully` });
  } catch (err) {
    console.error('Error muting participant:', err.message);
    res.status(500).json({ error: 'Failed to mute participant' });
  }
});

// Update participant permissions (instructor only)
router.post('/room/:roomName/update-permissions', auth, instructorOnly, async (req, res) => {
  const { roomName } = req.params;
  const { participantIdentity, canPublish, canSubscribe } = req.body;

  if (!participantIdentity) {
    return res.status(400).json({ error: 'Missing participantIdentity' });
  }

  try {
    await svc.updateParticipant(roomName, participantIdentity, {
      permission: {
        canPublish: canPublish || false,
        canSubscribe: canSubscribe !== false,
        canPublishData: true,
      }
    });
    res.json({ message: 'Participant permissions updated successfully' });
  } catch (err) {
    console.error('Error updating participant permissions:', err.message);
    res.status(500).json({ error: 'Failed to update participant permissions' });
  }
});

// Get room info
router.get('/room/:roomName/info', auth, async (req, res) => {
  const { roomName } = req.params;

  try {
    const rooms = await svc.listRooms([roomName]);
    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ room: rooms[0] });
  } catch (err) {
    console.error('Error fetching room info:', err.message);
    res.status(500).json({ error: 'Failed to fetch room info' });
  }
});

// End room (instructor only)
router.post('/room/:roomName/end', auth, instructorOnly, async (req, res) => {
  const { roomName } = req.params;

  try {
    await svc.deleteRoom(roomName);
    res.json({ message: 'Room ended successfully' });
  } catch (err) {
    console.error('Error ending room:', err.message);
    res.status(500).json({ error: 'Failed to end room' });
  }
});

module.exports = router;
