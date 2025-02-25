package services

import (
	"context"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	speech "cloud.google.com/go/speech/apiv1"
	speechpb "cloud.google.com/go/speech/apiv1/speechpb"
	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/types/known/wrapperspb"

	"today.whyme/internal/models"
)

// SpeechService handles the Google Speech-to-Text streaming
type SpeechService struct {
	client     *speech.Client
	conn       *websocket.Conn
	sessionID  string
	streaming  bool
	streamOnce sync.Once
	stopChan   chan struct{}
	mu         sync.Mutex

	// Stream management
	streamTimeout  time.Duration
	audioInput     [][]byte
	lastAudioInput [][]byte
	restartCounter int
	audioChan      chan []byte
}

// NewSpeechService creates a new speech service instance
func NewSpeechService(ctx context.Context, conn *websocket.Conn, sessionID string) (*SpeechService, error) {
	client, err := speech.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create speech client: %v", err)
	}

	return &SpeechService{
		client:         client,
		conn:           conn,
		sessionID:      sessionID,
		stopChan:       make(chan struct{}),
		streamTimeout:  290 * time.Second, // Google's limit is 305 seconds
		audioInput:     make([][]byte, 0),
		lastAudioInput: make([][]byte, 0),
	}, nil
}

// Close closes the speech service and releases resources
func (s *SpeechService) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.streaming {
		close(s.stopChan)
		s.streaming = false
		if s.audioChan != nil {
			close(s.audioChan)
			s.audioChan = nil
		}
	}
	return s.client.Close()
}

// ProcessAudioStream handles the streaming of audio to Google Speech-to-Text
func (s *SpeechService) ProcessAudioStream(ctx context.Context) (chan<- []byte, error) {
	s.mu.Lock()
	if s.audioChan != nil {
		s.mu.Unlock()
		return nil, fmt.Errorf("stream already initialized")
	}
	s.audioChan = make(chan []byte, 32)
	s.mu.Unlock()

	stream, err := s.client.StreamingRecognize(ctx)
	if err != nil {
		s.mu.Lock()
		close(s.audioChan)
		s.audioChan = nil
		s.mu.Unlock()
		return nil, fmt.Errorf("failed to create streaming recognize stream: %v", err)
	}

	// Send the streaming config
	if err := s.sendStreamConfig(stream); err != nil {
		s.mu.Lock()
		close(s.audioChan)
		s.audioChan = nil
		s.mu.Unlock()
		return nil, err
	}

	s.streaming = true

	// Start the stream timeout timer
	go s.handleStreamTimeout(ctx, stream)

	// Start processing responses in a goroutine
	go s.handleResponses(ctx, stream)

	// Start processing audio data in a goroutine
	go s.handleAudioData(ctx, stream, s.audioChan)

	return s.audioChan, nil
}

func (s *SpeechService) sendStreamConfig(stream speechpb.Speech_StreamingRecognizeClient) error {
	return stream.Send(&speechpb.StreamingRecognizeRequest{
		StreamingRequest: &speechpb.StreamingRecognizeRequest_StreamingConfig{
			StreamingConfig: &speechpb.StreamingRecognitionConfig{
				Config: &speechpb.RecognitionConfig{
					Encoding:                   speechpb.RecognitionConfig_WEBM_OPUS,
					SampleRateHertz:            48000,
					LanguageCode:               "en-US",
					EnableAutomaticPunctuation: true,
					EnableSpokenPunctuation:    wrapperspb.Bool(true),
					EnableSpokenEmojis:         wrapperspb.Bool(true),
					UseEnhanced:                true,
					Model:                      "latest_long",
				},
				InterimResults: true,
			},
		},
	})
}

func (s *SpeechService) handleStreamTimeout(ctx context.Context, stream speechpb.Speech_StreamingRecognizeClient) {
	timer := time.NewTimer(s.streamTimeout)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return
	case <-timer.C:
		s.restartStream(ctx)
	}
}

func (s *SpeechService) restartStream(ctx context.Context) {
	s.mu.Lock()
	if !s.streaming {
		s.mu.Unlock()
		return
	}
	s.mu.Unlock()

	log.Printf("[Session: %s] Restarting stream (counter: %d)", s.sessionID, s.restartCounter)

	s.mu.Lock()
	// Save current audio input as last audio input
	s.lastAudioInput = s.audioInput
	s.audioInput = make([][]byte, 0)
	s.restartCounter++
	s.mu.Unlock()

	// Create new stream
	stream, err := s.client.StreamingRecognize(ctx)
	if err != nil {
		log.Printf("Failed to create new stream: %v", err)
		return
	}

	// Resend config
	if err := s.sendStreamConfig(stream); err != nil {
		log.Printf("Failed to send config to new stream: %v", err)
		return
	}

	s.mu.Lock()
	// Resend unfinalized audio from last request
	lastAudio := s.lastAudioInput
	s.mu.Unlock()

	if len(lastAudio) > 0 {
		for _, chunk := range lastAudio {
			if err := stream.Send(&speechpb.StreamingRecognizeRequest{
				StreamingRequest: &speechpb.StreamingRecognizeRequest_AudioContent{
					AudioContent: chunk,
				},
			}); err != nil {
				log.Printf("Failed to resend audio chunk: %v", err)
				return
			}
		}
	}

	// Start new timeout timer
	go s.handleStreamTimeout(ctx, stream)

	// Start new response handler
	go s.handleResponses(ctx, stream)
}

// handleResponses processes the responses from Google Speech-to-Text
func (s *SpeechService) handleResponses(ctx context.Context, stream speechpb.Speech_StreamingRecognizeClient) {
	defer stream.CloseSend()

	for {
		select {
		case <-ctx.Done():
			return
		default:
			resp, err := stream.Recv()
			if err == io.EOF {
				return
			}
			if err != nil {
				if ctx.Err() != nil {
					// Context was canceled, normal termination
					return
				}
				log.Printf("Failed to receive response: %v", err)
				return
			}

			// Process each result
			for _, result := range resp.Results {
				if len(result.Alternatives) > 0 {
					transcript := result.Alternatives[0].Transcript
					isFinal := result.IsFinal

					// Create and send transcription message
					msg := models.TranscriptionMessage{
						BaseMessage: models.BaseMessage{
							Type:      models.MessageTypeTranscription,
							Timestamp: time.Now().UnixMilli(),
						},
						Text:    transcript,
						IsFinal: isFinal,
					}

					if err := s.conn.WriteJSON(msg); err != nil {
						log.Printf("Failed to send transcription: %v", err)
						return
					}
				}
			}
		}
	}
}

// handleAudioData processes incoming audio data and sends it to Google Speech-to-Text
func (s *SpeechService) handleAudioData(ctx context.Context, stream speechpb.Speech_StreamingRecognizeClient, audioChan <-chan []byte) {
	for {
		select {
		case <-ctx.Done():
			return
		case audioData, ok := <-audioChan:
			if !ok {
				return
			}

			s.mu.Lock()
			s.audioInput = append(s.audioInput, audioData)
			s.mu.Unlock()

			if err := stream.Send(&speechpb.StreamingRecognizeRequest{
				StreamingRequest: &speechpb.StreamingRecognizeRequest_AudioContent{
					AudioContent: audioData,
				},
			}); err != nil {
				log.Printf("Failed to send audio data: %v", err)
				return
			}
		}
	}
}
