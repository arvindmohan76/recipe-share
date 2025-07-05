import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';

interface VoiceToTextProps {
  onTextReceived: (text: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
}

const VoiceToText: React.FC<VoiceToTextProps> = ({ 
  onTextReceived, 
  placeholder = "Click the microphone to start speaking...",
  buttonLabel = "Start Recording",
  className = ""
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      console.log('Speech Recognition API is supported');
      
      // Check if we're on HTTPS or localhost (required for microphone access)
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecureContext) {
        setError('Voice input requires HTTPS or localhost for security reasons.');
        return;
      }

      const recognition = new SpeechRecognition();
      
      // Configure recognition settings
      recognition.continuous = false; // Changed to false for better control
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError('');
        setPermissionGranted(true);
        finalTranscriptRef.current = '';
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        console.log('Speech recognition result received', event);
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalText += transcript;
            console.log('Final transcript:', transcript);
          } else {
            interimText += transcript;
            console.log('Interim transcript:', transcript);
          }
        }

        if (finalText) {
          finalTranscriptRef.current += finalText;
          setTranscript(finalTranscriptRef.current);
        }
        
        setInterimTranscript(interimText);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setInterimTranscript('');
        
        // Send the final transcript to parent component
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          console.log('Sending final transcript to parent:', finalText);
          onTextReceived(finalText);
          setTranscript('');
          finalTranscriptRef.current = '';
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event);
        setIsListening(false);
        setInterimTranscript('');
        
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please ensure your microphone is connected and unmuted, speak clearly, and try again.');
            break;
          case 'audio-capture':
            setError('Microphone not accessible. Please check your microphone connection.');
            break;
          case 'not-allowed':
            setError('Microphone permission denied. Please allow microphone access and try again.');
            setPermissionGranted(false);
            break;
          case 'network':
            setError('Network error occurred. Please check your internet connection.');
            break;
          case 'service-not-allowed':
            setError('Speech recognition service not allowed. Please try again.');
            break;
          case 'bad-grammar':
            setError('Speech recognition grammar error. Please try again.');
            break;
          case 'language-not-supported':
            setError('Language not supported. Please try again.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}. Please try again.`);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.log('Speech Recognition API not supported');
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Error stopping recognition:', e);
        }
      }
    };
  }, [onTextReceived]);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep track of the stream to properly clean it up later
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop()); // Stop the stream immediately
      setPermissionGranted(true);
      setError('');
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Microphone permission denied. Please allow microphone access in your browser settings.');
      setPermissionGranted(false);
      return false;
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available.');
      return;
    }

    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }

    // Request microphone permission first
    if (!permissionGranted) {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        return;
      }
    }

    try {
      setError('');
      setTranscript('');
      setInterimTranscript('');
      finalTranscriptRef.current = '';
      
     // Add a small delay after permission is granted before starting recognition
     // This helps browsers properly initialize the audio context
     setTimeout(() => {
      console.log('Starting speech recognition...');
      recognitionRef.current.start();
     }, 300);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        console.log('Stopping speech recognition...');
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
    finalTranscriptRef.current = '';
  };

  if (!isSupported) {
    return (
      <Message 
        severity="warn" 
        text="Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice features." 
        className="w-full"
      />
    );
  }

  const displayText = transcript + interimTranscript;

  return (
    <div className={`voice-to-text ${className}`}>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="pi pi-microphone text-blue-600 dark:text-blue-400 text-xl"></i>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">Voice Input</h4>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isListening ? 'Listening...' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Permission Status */}
          {!permissionGranted && !error && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <i className="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  Microphone permission required for voice input
                </span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              label={isListening ? 'Stop Recording' : buttonLabel}
              icon={isListening ? 'pi pi-stop' : 'pi pi-microphone'}
              className={`${isListening ? 'p-button-danger' : 'p-button-success'}`}
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported}
            />
            
            {(transcript || interimTranscript) && (
              <Button
                label="Clear"
                icon="pi pi-times"
                className="p-button-outlined p-button-secondary"
                onClick={clearTranscript}
              />
            )}

            {!permissionGranted && !isListening && (
              <Button
                label="Grant Permission"
                icon="pi pi-shield"
                className="p-button-outlined p-button-info"
                onClick={requestMicrophonePermission}
              />
            )}
          </div>

          {/* Transcript Display */}
          {displayText && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[80px]">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recognized Text:</div>
              <div className="text-gray-800 dark:text-gray-200">
                <span className="font-medium">{transcript}</span>
                {interimTranscript && (
                  <span className="text-gray-500 dark:text-gray-400 italic"> {interimTranscript}</span>
                )}
              </div>
            </div>
          )}

          {/* Placeholder when no text */}
          {!displayText && !isListening && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[80px] flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-center">{placeholder}</p>
            </div>
          )}

          {/* Listening indicator */}
          {isListening && !displayText && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[80px] flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Listening... Please speak now</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Message severity="error" text={error} className="w-full" />
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-600 space-y-1">
            <p>💡 <strong>Tips for better recognition:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Click "Start Recording" and wait for the red indicator</li>
              <li>Speak clearly and at a normal pace</li>
              <li>Ensure you're in a quiet environment</li>
              <li>Allow microphone access when prompted</li>
              <li>The text will be added when recording stops</li>
            </ul>
          </div>

          {/* Browser compatibility info */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <strong>Browser Support:</strong> Works best in Chrome and Edge. Limited support in Firefox and Safari.
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceToText;