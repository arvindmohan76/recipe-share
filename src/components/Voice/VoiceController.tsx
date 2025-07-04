import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

interface VoiceControllerProps {
  onCommand: (command: string) => void;
}

const VoiceController: React.FC<VoiceControllerProps> = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [commandFeedback, setCommandFeedback] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript;
        setLastCommand(command);
        setCommandFeedback(`Processing: "${command}"`);
        onCommand(command);
        
        // Clear feedback after 3 seconds
        setTimeout(() => {
          setCommandFeedback('');
        }, 3000);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onCommand]);

  const startListening = () => {
    if (recognition) {
      // Add a small delay to ensure the recognition state has fully reset
      setTimeout(() => {
        try {
          setIsListening(true);
          recognition.start();
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          setIsListening(false);
        }
      }, 100);
    }
  };

  const stopListening = () => {
    if (recognition) {
      setIsListening(false);
      try {
        recognition.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  };

  if (!isSupported) {
    return (
      <Message 
        severity="info" 
        text="Voice commands are not supported in this browser. Try Chrome or Edge for voice features." 
        className="w-full"
      />
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🎤 Voice Cooking Assistant
        </h3>
        
        <div className="flex justify-center gap-4 mb-4">
          <Button
            label={isListening ? 'Stop Listening' : 'Start Listening'}
            icon={isListening ? 'pi pi-stop' : 'pi pi-microphone'}
            className={`px-6 py-3 font-medium ${isListening ? 'p-button-outlined p-button-danger' : 'p-button-outlined p-button-success'}`}
            onClick={isListening ? stopListening : startListening}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Available Commands:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• "Next step"</li>
                <li>• "Previous step"</li>
                <li>• "Read ingredients"</li>
                <li>• "Read current step"</li>
                <li>• "Start cooking"</li>
                <li>• "Stop cooking"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Status:</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-gray-600">
                  {isListening ? 'Listening...' : 'Not listening'}
                </span>
              </div>
              {commandFeedback && (
                <div className="text-sm text-blue-600 font-medium mb-2">
                  {commandFeedback}
                </div>
              )}
              {lastCommand && (
                <div className="text-sm text-gray-600">
                  Last command: "{lastCommand}"
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center space-y-1">
          <p>Click "Start Listening" and speak clearly. The assistant will respond to your voice commands.</p>
          <p className="text-xs">🔊 Voice responses are enabled - you'll hear spoken feedback for your commands.</p>
        </div>
      </div>
    </Card>
  );
};

export default VoiceController;