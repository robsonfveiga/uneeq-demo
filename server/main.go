package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message types matching the frontend
const (
	MessageTypeAudio         = "AUDIO"
	MessageTypeTranscription = "TRANSCRIPTION"
	MessageTypeEndOfStream   = "END_OF_STREAM"
	MessageTypeError         = "ERROR"
)

// BaseMessage represents the common structure for all messages
type BaseMessage struct {
	Type      string `json:"type"`
	Timestamp int64  `json:"timestamp"`
}

// AudioMessage represents an audio chunk from the client
type AudioMessage struct {
	BaseMessage
	AudioData   string `json:"audioData"`
	SampleRate  int    `json:"sampleRate"`
	IsLastChunk bool   `json:"isLastChunk"`
}

// ErrorMessage represents an error message
type ErrorMessage struct {
	BaseMessage
	Error string `json:"error"`
	Code  string `json:"code"`
}

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

// WebSocket connection upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

func main() {
	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll("uploads", 0755); err != nil {
		log.Fatal("Failed to create uploads directory:", err)
	}

	// WebSocket endpoint
	http.HandleFunc("/ws", handleWebSocket)

	// Start server
	port := ":8080"
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade connection:", err)
		return
	}
	defer conn.Close()

	// Create context for the session
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create session ID
	sessionID := fmt.Sprintf("%d", time.Now().UnixNano())

	// Initialize speech service
	speechSvc, err := NewSpeechService(ctx, conn, sessionID)
	if err != nil {
		log.Printf("Failed to create speech service: %v", err)
		sendError(conn, "Failed to initialize speech service", "INIT_ERROR")
		return
	}
	defer func() {
		if err := speechSvc.Close(); err != nil {
			log.Printf("Error closing speech service: %v", err)
		}
	}()

	// Initialize audio channel
	audioChan, err := speechSvc.ProcessAudioStream(ctx)
	if err != nil {
		log.Printf("Failed to start audio stream: %v", err)
		sendError(conn, "Failed to start audio stream", "STREAM_ERROR")
		return
	}

	// Create new audio collector
	collector := &AudioCollector{
		sessionID: sessionID,
		timestamp: time.Now(),
		audioChan: audioChan,
		speechSvc: speechSvc,
	}

	// Cleanup function
	defer func() {
		collector.mu.Lock()
		collector.closed = true
		collector.mu.Unlock()

		// Save any remaining audio before closing
		if err := collector.saveAudio(); err != nil {
			log.Printf("Error saving final audio: %v", err)
		}
	}()

	log.Printf("New WebSocket connection established. Session ID: %s", collector.sessionID)

	for {
		// Read message
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}

		if messageType != websocket.TextMessage {
			continue
		}

		// Parse the base message to determine type
		var baseMsg BaseMessage
		if err := json.Unmarshal(message, &baseMsg); err != nil {
			log.Println("Error parsing message:", err)
			continue
		}

		switch baseMsg.Type {
		case MessageTypeAudio:
			// Handle audio message
			var audioMsg AudioMessage
			if err := json.Unmarshal(message, &audioMsg); err != nil {
				log.Println("Error parsing audio message:", err)
				continue
			}

			// Process audio chunk
			if err := collector.processAudioChunk(audioMsg); err != nil {
				log.Println("Error processing audio chunk:", err)
				sendError(conn, "Failed to process audio chunk", "PROCESSING_ERROR")
			}

		case MessageTypeEndOfStream:
			// Save the complete audio file
			if err := collector.saveAudio(); err != nil {
				log.Println("Error saving audio:", err)
				sendError(conn, "Failed to save audio", "SAVE_ERROR")
			} else {
				log.Printf("Audio saved successfully for session %s", collector.sessionID)
			}
			return // Exit the WebSocket handler
		}
	}
}

func (ac *AudioCollector) processAudioChunk(msg AudioMessage) error {
	ac.mu.Lock()
	if ac.closed {
		ac.mu.Unlock()
		return fmt.Errorf("collector is closed")
	}
	ac.mu.Unlock()

	// Decode base64 audio data
	audioData, err := base64.StdEncoding.DecodeString(msg.AudioData)
	if err != nil {
		return fmt.Errorf("failed to decode base64 audio: %v", err)
	}

	// Add chunk to collection for saving
	ac.mu.Lock()
	ac.chunks = append(ac.chunks, audioData)
	ac.mu.Unlock()

	// Send audio data to speech service with timeout
	select {
	case ac.audioChan <- audioData:
		return nil
	case <-time.After(100 * time.Millisecond):
		return fmt.Errorf("audio channel blocked, dropping chunk")
	}
}

func (ac *AudioCollector) saveAudio() error {
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

func sendError(conn *websocket.Conn, errMsg, code string) {
	errorMessage := ErrorMessage{
		BaseMessage: BaseMessage{
			Type:      MessageTypeError,
			Timestamp: time.Now().UnixMilli(),
		},
		Error: errMsg,
		Code:  code,
	}

	if err := conn.WriteJSON(errorMessage); err != nil {
		log.Printf("Error sending error message: %v", err)
	}
}
