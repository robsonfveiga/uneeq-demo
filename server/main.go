package main

import (
	"log"
	"net/http"

	"today.whyme/internal/config"
	"today.whyme/internal/handlers"
)

func main() {
	// Load configuration
	cfg := config.DefaultConfig()

	// Ensure uploads directory exists
	if err := cfg.EnsureUploadsDir(); err != nil {
		log.Fatal("Failed to create uploads directory:", err)
	}

	// WebSocket endpoint
	http.HandleFunc("/ws", handlers.HandleWebSocket)

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := http.ListenAndServe(cfg.Port, nil); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
