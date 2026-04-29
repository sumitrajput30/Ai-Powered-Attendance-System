import numpy as np
import base64
import cv2

try:
    import face_recognition
    FACE_REC_AVAILABLE = True
except ImportError:
    FACE_REC_AVAILABLE = False
    print("Warning: face_recognition module not found. Using mock matching logic.")

def decode_image_base64(base64_string: str):
    # Remove header if present (e.g., "data:image/jpeg;base64,...")
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    img_data = base64.b64decode(base64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image

def get_face_encoding(base64_image: str):
    image = decode_image_base64(base64_image)
    if image is None:
        return None
        
    # Use OpenCV for basic face detection regardless of face_recognition availability
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return None  # No face found by OpenCV
    except Exception as e:
        print(f"OpenCV face detection error: {e}")
    
    if not FACE_REC_AVAILABLE:
        # Proceed with mock encoding if face was found (or if detection failed but we want to allow it)
        return [0.1, 0.2, 0.3]
        
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_image)
    
    if not face_locations:
        return None  # No face found
    
    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
    return face_encodings[0].tolist()

def compare_faces(known_encoding: list, unknown_base64_image: str):
    unknown_encoding = get_face_encoding(unknown_base64_image)
    if unknown_encoding is None:
        return False
        
    if not FACE_REC_AVAILABLE:
        # Mock comparing logic returns True
        return True
    
    known_enc_np = np.array(known_encoding)
    unknown_enc_np = np.array(unknown_encoding)
    
    results = face_recognition.compare_faces([known_enc_np], unknown_enc_np, tolerance=0.6)
    return results[0]
