import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PhoneOff, Video, Mic, MicOff, VideoOff, Copy } from 'lucide-react';
import VideoCallContext from '../context/VideoCallContext';
import { useAuth } from '../context/AuthContext';

export default function VideoConsultation() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [callerId, setCallerId] = useState('');

  const {
    myVideo,
    userVideo,
    callAccepted,
    callEnded,
    stream,
    setStream,
    callUser,
    leaveCall,
    call,
    answerCall,
    me,
    setName
  } = useContext(VideoCallContext);

  useEffect(() => {
    setName(user?.name || 'Guest');
    
    // Request media devices
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        console.error("Error accessing media devices.", err);
      });
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(me);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <h2 style={{ color: '#00d4ff', marginBottom: '1rem' }}>Consultation Room</h2>
      
      {/* Video Grid */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1200px' }}>
        {/* Local Video - Always rendered so ref exists */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(0, 212, 255, 0.4)', flex: '1 1 400px', maxWidth: '600px', aspectRatio: '16/9', background: '#111', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
        >
          <video playsInline muted ref={myVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.7)', padding: '6px 16px', borderRadius: '12px', fontSize: 16, fontWeight: 'bold' }}>
            {user?.name || 'You'}
          </div>
          {!stream && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#00d4ff' }}>
              Starting Camera...
            </div>
          )}
        </motion.div>

        {/* Remote Video - Always rendered if call Accepted */}
        {callAccepted && !callEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '2px solid #7c3aed', flex: '1 1 400px', maxWidth: '600px', aspectRatio: '16/9', background: '#111', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
          >
            <video playsInline ref={userVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.7)', padding: '6px 16px', borderRadius: '12px', fontSize: 16, fontWeight: 'bold' }}>
              {call.name || 'Remote User'}
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls & Connection Panel */}
      <div style={{
        marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%', maxWidth: '600px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: '4px' }}>Your Connection ID</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <code style={{ background: '#111827', padding: '6px 12px', borderRadius: '6px', color: '#00d4ff' }}>
                {me || 'Loading...'}
              </code>
              <button onClick={copyToClipboard} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Copy size={20} />
              </button>
              {copied && <span style={{ fontSize: 12, color: '#10b981' }}>Copied!</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
             <button onClick={leaveCall} style={{ background: '#ef4444', border: 'none', padding: '12px 24px', borderRadius: '12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
               <PhoneOff size={20} /> Leave
             </button>
          </div>
        </div>

        {/* Incoming Call Alert */}
        {call.isReceivingCall && !callAccepted && (
          <div style={{ background: 'rgba(124, 58, 237, 0.2)', border: '1px solid #7c3aed', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{call.name} is calling you...</p>
            </div>
            <button onClick={answerCall} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Answer
            </button>
          </div>
        )}

        {/* Call User Input */}
        {!callAccepted && !call.isReceivingCall && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="ID to Call" 
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff' }}
                />
                <button 
                  onClick={() => callUser(callerId)}
                  style={{ background: '#00d4ff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Call
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
