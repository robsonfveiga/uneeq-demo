package utils

import "time"

// GetNowTimestamp returns the current timestamp in milliseconds
func GetNowTimestamp() int64 {
	return time.Now().UnixMilli()
}

// FormatSessionID formats a session ID with the current timestamp
func FormatSessionID() string {
	return time.Now().Format("20060102150405.000")
}
