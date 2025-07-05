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
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        
        // Send the final transcript to parent component
        if (transcript.trim()) {
          onTextReceived(transcript.trim());
          setTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
        
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setError('Microphone not accessible. Please check permissions.');
            break;
          case 'not-allowed':
            setError('Microphone permission denied. Please allow microphone access.');
            break;
          case 'network':
            setError('Network error. Please check your connection.');
            break;
          default:
            setError('Speech recognition error. Please try again.');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript, onTextReceived]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError('');
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
  };

  if (!isSupported) {
    return (
      <Message 
        severity="info" 
        text="Voice recognition is not supported in this browser. Try Chrome or Edge for voice features." 
        className="w-full"
      />
    );
  }

  const displayText = transcript + interimTranscript;

  return (
    <div className={`voice-to-text ${className}`}>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="pi pi-microphone text-blue-600 text-xl"></i>
              <h4 className="font-semibold text-gray-800">Voice Input</h4>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-600">
                {isListening ? 'Listening...' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <Button
              label={isListening ? 'Stop Recording' : buttonLabel}
              icon={isListening ? 'pi pi-stop' : 'pi pi-microphone'}
              className={`${isListening ? 'p-button-danger' : 'p-button-success'}`}
              onClick={isListening ? stopListening : startListening}
            />
            
            {(transcript || interimTranscript) && (
              <Button
                label="Clear"
                icon="pi pi-times"
                className="p-button-outlined p-button-secondary"
                onClick={clearTranscript}
              />
            )}
          </div>

          {/* Transcript Display */}
          {displayText && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[80px]">
              <div className="text-sm text-gray-600 mb-2">Recognized Text:</div>
              <div className="text-gray-800">
                <span className="font-medium">{transcript}</span>
                {interimTranscript && (
                  <span className="text-gray-500 italic">{interimTranscript}</span>
                )}
              </div>
            </div>
          )}

          {/* Placeholder when no text */}
          {!displayText && !isListening && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 min-h-[80px] flex items-center justify-center">
              <p className="text-gray-500 text-center">{placeholder}</p>
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
              <li>Speak clearly and at a normal pace</li>
              <li>Ensure you're in a quiet environment</li>
              <li>Allow microphone access when prompted</li>
              <li>The text will be added when you stop recording</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceToText;