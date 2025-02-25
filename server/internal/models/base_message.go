package models

// BaseMessage represents the common structure for all messages
type BaseMessage struct {
	Type      string `json:"type"`
	Timestamp int64  `json:"timestamp"`
}
