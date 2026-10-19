package main

import (
	"StackStats/services/collector/internal/config"
	"context"
	"os"

	"github.com/joho/godotenv"

	"StackStats/pkg/logger"
	"StackStats/services/collector/internal/collector"
	//"StackStats/services/collector/internal/config"
	"StackStats/services/collector/internal/clients/data"
	"StackStats/services/collector/internal/fetcher"
)

func main() {
	// 1. Логгер
	logg, file, err := logger.New("collector.log")
	if err != nil {
		os.Exit(1)
	}
	defer file.Close()

	// 2. .env + config
	if err := godotenv.Load("services/collector/.env"); err != nil {
		logg.Warn("no .env file found, using defaults")
	}
	cfg, err := config.New()
	if err != nil {
		logg.Error("config load failed", "err", err)
		os.Exit(1)
	}

	// 3. gRPC-клиент к data-service
	dataClient, err := data.New(logg, cfg.DataGRPCAddr, cfg.Interval, 3)
	if err != nil {
		logg.Error("data client failed", "err", err)
		os.Exit(1)
	}
	defer dataClient.Close()

	// 4. Внешний HTTP-клиент
	f := fetcher.New(logg, cfg.StackBaseURL)

	// 5. Собираем и запускаем
	col := collector.New(f, dataClient, logg, cfg.PageSize)

	// 6. Graceful shutdown по Ctrl+C / SIGTERM
	//ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	//defer stop()

	err = col.RunOnce(context.Background())
	if err != nil {
		logg.Error("error in collector: ", err)
	}
}
