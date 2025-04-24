// Emotion detection variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let emotionDetectionActive = false;
const emotionText = document.getElementById('emotion-text');

// Emotion states
const emotions = ['neutral', 'happy', 'sad', 'angry', 'fear', 'surprise', 'calm'];
let currentEmotion = 'neutral';
let emotionChangeTimer;
let emotionDetectionInterval;

// Initialize audio recording for emotion detection
async function initEmotionDetection() {
  try {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create media recorder
    mediaRecorder = new MediaRecorder(stream);
    
    // Set up event handlers
    mediaRecorder.onstart = () => {
      audioChunks = [];
      isRecording = true;
    };
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = async () => {
      isRecording = false;
      
      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      
      if (emotionDetectionActive) {
        // In a real implementation, send to server
        // For demo purposes, simulate response
        simulateEmotionDetection(audioBlob);
        
        // Start recording again if still active
        if (emotionDetectionActive) {
          startRecording();
        }
      }
    };
    
    return true;
  } catch (error) {
    console.error("Error initializing emotion detection:", error);
    alert("Could not access microphone for emotion detection. Please make sure microphone access is granted.");
    return false;
  }
}

// Toggle emotion detection
async function toggleEmotionDetection() {
  if (emotionDetectionActive) {
    // Stop emotion detection
    stopEmotionDetection();
  } else {
    // Start emotion detection
    if (!mediaRecorder && !(await initEmotionDetection())) {
      return;
    }
    
    startEmotionDetection();
  }
}

// Start emotion detection
function startEmotionDetection() {
  emotionDetectionActive = true;
  document.getElementById('start-emotion').textContent = 'Stop Emotion Detection';
  startRecording();
  
  // Set up recurring detection
  emotionDetectionInterval = setInterval(() => {
    if (isRecording) {
      mediaRecorder.stop();
    } else if (emotionDetectionActive) {
      startRecording();
    }
  }, 5000); // Process emotions every 5 seconds
}

// Stop emotion detection
function stopEmotionDetection() {
  emotionDetectionActive = false;
  document.getElementById('start-emotion').textContent = 'Start Emotion Detection';
  
  if (isRecording && mediaRecorder) {
    mediaRecorder.stop();
  }
  
  clearInterval(emotionDetectionInterval);
  emotionText.textContent = 'Not detected';
}

// Start recording audio
function startRecording() {
  if (mediaRecorder && !isRecording) {
    mediaRecorder.start();
  }
}

// For demo purposes, simulate emotion detection response
// In a real implementation, this would be replaced by the actual server call
function simulateEmotionDetection(audioBlob) {
  // Simulate processing delay
  setTimeout(() => {
    // Get random emotion for demo purposes
    // In a real implementation, this would come from the server
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    // Process detected emotion
    processEmotionResult(randomEmotion);
  }, 500);
}

// Actually send audio to server for emotion detection
// This would be used in a real implementation
async function sendAudioForEmotion(audioBlob) {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    const response = await fetch("http://localhost:5000/predict-emotion", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    processEmotionResult(data.emotion);
  } catch (error) {
    console.error("Error detecting emotion:", error);
    // Fall back to neutral if there's an error
    processEmotionResult('neutral');
  }
}

// Process emotion detection result
function processEmotionResult(emotion) {
  // Update current emotion
  currentEmotion = emotion;
  updateEmotionDisplay(emotion);
  
  // Adjust game difficulty based on emotion
  adjustGameByEmotion(emotion);
}

// Update emotion display
function updateEmotionDisplay(emotion) {
  // Capitalize first letter
  const displayEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1);
  emotionText.textContent = displayEmotion;
  
  // Color code for different emotions
  switch(emotion) {
    case 'happy':
      emotionText.style.color = '#4CAF50'; // Green
      break;
    case 'angry':
      emotionText.style.color = '#f44336'; // Red
      break;
    case 'fear':
      emotionText.style.color = '#9c27b0'; // Purple
      break;
    case 'sad':
      emotionText.style.color = '#2196F3'; // Blue
      break;
    case 'surprise':
      emotionText.style.color = '#ff9800'; // Orange
      break;
    case 'calm':
    case 'neutral':
    default:
      emotionText.style.color = '#FFFFFF'; // White
      break;
  }
}

// Adjust game difficulty based on detected emotion
function adjustGameByEmotion(emotion) {
  if (emotion === 'angry' || emotion === 'fear') {
    // Make game more challenging
    increaseSpeed();
  } else if (emotion === 'sad') {
    // Slightly reduce difficulty
    reduceObstacles();
  } else if (emotion === 'happy' || emotion === 'surprise') {
    // Keep normal difficulty but increase score opportunities
    // This would require game.js implementation
  } else if (emotion === 'calm' || emotion === 'neutral') {
    // Make game easier
    reduceObstacles();
  }
}

// Add button event listener
document.getElementById('start-emotion').addEventListener('click', toggleEmotionDetection);