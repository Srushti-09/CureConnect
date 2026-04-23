import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const VideoCallContext = createContext();

const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');

export const VideoCallProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState('');
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // We only access navigator.mediaDevices inside the specific consultation route, 
    // but we can initialize the socket listener globally.
    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  const answerCall = async () => {
    setCallAccepted(true);

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        // Here normally we'd emit individual ICE candidates via socket
      }
    };

    peer.ontrack = (event) => {
      if (userVideo.current) {
        userVideo.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.setRemoteDescription(new RTCSessionDescription(call.signal));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const sendAnswer = () => {
      socket.emit('answerCall', { signal: peer.localDescription, to: call.from });
      connectionRef.current = peer;
    };

    if (peer.iceGatheringState === 'complete') {
      sendAnswer();
    } else {
      peer.onicegatheringstatechange = () => {
        if (peer.iceGatheringState === 'complete') {
          sendAnswer();
        }
      };
      // Fallback timeout in case gathering gets stuck
      setTimeout(() => {
        if (peer.iceGatheringState !== 'complete') {
          sendAnswer();
        }
      }, 2000);
    }
  };

  const callUser = async (idToCall) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302"] },
      ],
    });

    peer.ontrack = (event) => {
      if (userVideo.current) {
        userVideo.current.srcObject = event.streams[0];
      }
    };

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const sendOffer = () => {
      socket.emit('callUser', { userToCall: idToCall, signalData: peer.localDescription, from: me, name });
    };

    if (peer.iceGatheringState === 'complete') {
      sendOffer();
    } else {
      peer.onicegatheringstatechange = () => {
        if (peer.iceGatheringState === 'complete') {
          sendOffer();
        }
      };
      setTimeout(() => {
        if (peer.iceGatheringState !== 'complete') {
          sendOffer();
        }
      }, 2000);
    }

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.setRemoteDescription(new RTCSessionDescription(signal));
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    window.location.reload();
  };

  return (
    <VideoCallContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      setStream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export default VideoCallContext;
