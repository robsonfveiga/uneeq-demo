package services

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// AudioCollector handles collecting and saving audio chunks
type AudioCollector struct {
	mu        sync.Mutex
	chunks    [][]byte
	sessionID string
	timestamp time.Time
	audioChan chan<- []byte
	speechSvc *SpeechService
	closed    bool
}

// NewAudioCollector creates a new audio collector instance
func NewAudioCollector(sessionID string, audioChan chan<- []byte, speechSvc *SpeechService) *AudioCollector {
	return &AudioCollector{
		sessionID: sessionID,
		timestamp: time.Now(),
		audioChan: audioChan,
		speechSvc: speechSvc,
		chunks:    make([][]byte, 0),
	}
}

// ProcessAudioChunk processes a single audio chunk
func (ac *AudioCollector) ProcessAudioChunk(audioData string) error {
	ac.mu.Lock()
	if ac.closed {
		ac.mu.Unlock()
		return fmt.Errorf("collector is closed")
	}
	ac.mu.Unlock()

	// Decode base64 audio data
	decodedData, err := base64.StdEncoding.DecodeString(audioData)
	if err != nil {
		return fmt.Errorf("failed to decode base64 audio: %v", err)
	}

	// Add chunk to collection for saving
	ac.mu.Lock()
	ac.chunks = append(ac.chunks, decodedData)
	ac.mu.Unlock()

	// Send audio data to speech service with timeout
	select {
	case ac.audioChan <- decodedData:
		return nil
	case <-time.After(100 * time.Millisecond):
		return fmt.Errorf("audio channel blocked, dropping chunk")
	}
}

// SaveAudio saves the collected audio chunks to a file
func (ac *AudioCollector) SaveAudio() error {
	ac.mu.Lock()
	defer ac.mu.Unlock()

	if len(ac.chunks) == 0 {
		return fmt.Errorf("no audio chunks to save")
	}

	// Create filename with timestamp and session ID
	filename := filepath.Join("uploads", fmt.Sprintf("audio_%s.webm", ac.sessionID))

	// Open file for writing
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

	// Write all chunks to file
	for _, chunk := range ac.chunks {
		if _, err := file.Write(chunk); err != nil {
			return fmt.Errorf("failed to write chunk: %v", err)
		}
	}

	// Clear chunks after successful save
	ac.chunks = nil

	return nil
}

// Close marks the collector as closed
func (ac *AudioCollector) Close() {
	ac.mu.Lock()
	defer ac.mu.Unlock()
	ac.closed = true
}

// GetSessionID returns the collector's session ID
func (ac *AudioCollector) GetSessionID() string {
	return ac.sessionID
}
