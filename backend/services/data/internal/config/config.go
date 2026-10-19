package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBURI string
}

func New() (*Config, error) {
	DBURI, err := getEnv("DB_URI")
	if err != nil {
		return nil, err
	}

	return &Config{
		DBURI: DBURI,
	}, nil
}

func getEnv(key string) (string, error) {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value, nil
	}
	return "", fmt.Errorf("%s is required", key)
}
