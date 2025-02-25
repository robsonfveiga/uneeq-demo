package models

// ErrorMessage represents an error message
type ErrorMessage struct {
	BaseMessage
	Error string `json:"error"`
	Code  string `json:"code"`
}
