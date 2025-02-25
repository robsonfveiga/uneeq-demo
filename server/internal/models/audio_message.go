package models

// AudioMessage represents an audio chunk from the client
type AudioMessage struct {
	BaseMessage
	AudioData   string `json:"audioData"`
	SampleRate  int    `json:"sampleRate"`
	IsLastChunk bool   `json:"isLastChunk"`
}
