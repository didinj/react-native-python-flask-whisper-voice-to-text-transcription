/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import axios from 'axios';
import { useState } from 'react';
import {
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

function App() {
  const audioRecorderPlayer = AudioRecorderPlayer;
  const [recording, setRecording] = useState(false);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await audioRecorderPlayer.startRecorder();
    audioRecorderPlayer.addRecordBackListener(e => {
      return;
    });
    setRecording(true);
    setAudioPath(result); // result contains the file path
  };

  const stopRecording = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setRecording(false);
    if (result) {
      setAudioPath(result);
      const transcript = await uploadAudio(result);
      setTranscription(transcript);
    }
  };

  const uploadAudio = async (uri: string) => {
    const formData = new FormData();

    // Extract file name and type (basic)
    const filename = uri.split('/').pop() || 'recording.wav';
    const fileType = 'audio/wav'; // or 'audio/m4a' depending on recorder settings

    formData.append('audio', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: filename,
      type: fileType,
    } as any);

    try {
      const response = await axios.post(
        'http://<your-server-ip>:5000/transcribe',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('Transcription:', response.data.transcription);
      return response.data.transcription;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      {audioPath && <Text>Audio saved at: {audioPath}</Text>}
      {transcription && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Transcription:</Text>
          <Text>{transcription}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
