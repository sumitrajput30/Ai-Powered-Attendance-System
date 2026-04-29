import React, { useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera } from 'lucide-react';

const videoConstraints = {
  width: 400,
  height: 300,
  facingMode: "user"
};

const WebcamCapture = ({ onCapture, loading }) => {
  const webcamRef = useRef(null);

  const capture = useCallback(
    () => {
      const imageSrc = webcamRef.current.getScreenshot();
      onCapture(imageSrc);
    },
    [webcamRef, onCapture]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-color)', width: '400px', height: '300px', backgroundColor: '#000' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          width={400}
          height={300}
        />
      </div>
      <button className="btn" onClick={capture} disabled={loading} style={{ width: '200px' }}>
        <Camera size={20} />
        {loading ? 'Processing...' : 'Capture Photo'}
      </button>
    </div>
  );
};

export default WebcamCapture;
