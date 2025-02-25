package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"

	"today.whyme/internal/models"
	"today.whyme/internal/services"
	"today.whyme/internal/utils"
)

// WebSocket connection upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

// HandleWebSocket handles WebSocket connections
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
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
	sessionID := generateSessionID()

	// Initialize speech service
	speechSvc, err := services.NewSpeechService(ctx, conn, sessionID)
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
	audioCollector := services.NewAudioCollector(sessionID, audioChan, speechSvc)

	// Cleanup function
	defer func() {
		audioCollector.Close()

		// Save any remaining audio before closing
		if err := audioCollector.SaveAudio(); err != nil {
			log.Printf("Error saving final audio: %v", err)
		}
	}()

	log.Printf("New WebSocket connection established. Session ID: %s", sessionID)

	handleWebSocketMessages(ctx, conn, audioCollector)
}

func handleWebSocketMessages(ctx context.Context, conn *websocket.Conn, audioCollector *services.AudioCollector) {
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
		var baseMsg models.BaseMessage
		if err := json.Unmarshal(message, &baseMsg); err != nil {
			log.Println("Error parsing message:", err)
			continue
		}

		switch baseMsg.Type {
		case models.MessageTypeAudio:
			// Handle audio message
			var audioMsg models.AudioMessage
			if err := json.Unmarshal(message, &audioMsg); err != nil {
				log.Println("Error parsing audio message:", err)
				continue
			}

			// Process audio chunk
			if err := audioCollector.ProcessAudioChunk(audioMsg.AudioData); err != nil {
				log.Println("Error processing audio chunk:", err)
				sendError(conn, "Failed to process audio chunk", "PROCESSING_ERROR")
			}

		case models.MessageTypeEndOfStream:
			// Save the complete audio file
			if err := audioCollector.SaveAudio(); err != nil {
				log.Println("Error saving audio:", err)
				sendError(conn, "Failed to save audio", "SAVE_ERROR")
			} else {
				log.Printf("Audio saved successfully for session %s", audioCollector.GetSessionID())
			}
			return // Exit the WebSocket handler
		}
	}
}

func sendError(conn *websocket.Conn, errMsg, code string) {
	errorMessage := models.ErrorMessage{
		BaseMessage: models.BaseMessage{
			Type:      models.MessageTypeError,
			Timestamp: utils.GetNowTimestamp(),
		},
		Error: errMsg,
		Code:  code,
	}

	if err := conn.WriteJSON(errorMessage); err != nil {
		log.Printf("Failed to send error message: %v", err)
	}
}

func generateSessionID() string {
	return utils.FormatSessionID()
}
