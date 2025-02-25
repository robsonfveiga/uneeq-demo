package config

import (
	"os"
	"path/filepath"
)

// Config holds all configuration settings
type Config struct {
	Port           string
	UploadsDir     string
	AllowedOrigins []string
}

// DefaultConfig returns the default configuration
func DefaultConfig() *Config {
	return &Config{
		Port:           ":8080",
		UploadsDir:     "uploads",
		AllowedOrigins: []string{"*"}, // Allow all origins in development
	}
}

// EnsureUploadsDir ensures the uploads directory exists
func (c *Config) EnsureUploadsDir() error {
	return os.MkdirAll(filepath.Clean(c.UploadsDir), 0755)
}
