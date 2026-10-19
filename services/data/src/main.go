package main

import (
	"context"
	"net"
	"os"
	"time"

	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	questionv1 "StackStats/gen/go/proto/question/v1"
	"StackStats/pkg/logger"
	"StackStats/services/data/internal/config"
	"StackStats/services/data/internal/handler"
	"StackStats/services/data/internal/repository"
)

func main() {
	logg, file, err := logger.New("app.logg")
	if err != nil {
		os.Exit(1)
	}
	defer file.Close()

	if err = godotenv.Load("services/data/.env"); err != nil {
		logg.Warn("no .env file found")
	}
	cfg, err := config.New()
	if err != nil {
		logg.Error("config load failed", "err", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := cfg.DBURI
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		logg.Error("mongo connect", "err", err)
		os.Exit(1)
	}
	defer client.Disconnect(context.Background())

	coll := client.Database("stack").Collection("questions")
	repo := repository.NewQuestionRepo(coll, logg)
	h := handler.NewQuestionHandler(repo)

	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		logg.Error("listen: %v", err)
		os.Exit(0)
	}

	loggingOpts := []logging.Option{
		logging.WithLogOnEvents(
			logging.PayloadReceived, logging.PayloadSent,
		),
	}

	srv := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			logging.UnaryServerInterceptor(logger.InterceptorLogger(logg), loggingOpts...),
		),
	)

	questionv1.RegisterQuestionServiceServer(srv, h)
	reflection.Register(srv)

	logg.Info("[data] gRPC listening", "addr", ":50052")
	if err := srv.Serve(lis); err != nil {
		logg.Error("serve: %v", err)
	}
}
