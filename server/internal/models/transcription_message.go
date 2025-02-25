package models

// TranscriptionMessage represents a transcription response
type TranscriptionMessage struct {
	BaseMessage
	Text    string `json:"text"`
	IsFinal bool   `json:"isFinal"`
}
