package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	DataGRPCAddr string        // адрес data-service
	StackBaseURL string        // базовый URL StackExchange API
	PageSize     int           // сколько вопросов тянуть за раз
	Interval     time.Duration // период между запусками
}

func New() (*Config, error) {
	intervalSec, err := strconv.Atoi(getEnv("COLLECT_INTERVAL_SEC", "60"))
	if err != nil {
		return nil, fmt.Errorf("invalid COLLECT_INTERVAL_SEC: %w", err)
	}

	pageSize, err := strconv.Atoi(getEnv("PAGE_SIZE", "20"))
	if err != nil {
		return nil, fmt.Errorf("invalid PAGE_SIZE: %w", err)
	}

	return &Config{
		DataGRPCAddr: getEnv("DATA_GRPC_ADDR", "localhost:50052"),
		StackBaseURL: getEnv("STACK_BASE_URL", "https://api.stackexchange.com/2.3"),
		PageSize:     pageSize,
		Interval:     time.Duration(intervalSec) * time.Second,
	}, nil
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
