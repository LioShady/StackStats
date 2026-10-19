package repository

import (
	"context"
	"errors"
	"log/slog"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"StackStats/services/data/internal/models"
)

type QuestionRepo struct {
	coll   *mongo.Collection
	logger *slog.Logger
}

func NewQuestionRepo(coll *mongo.Collection, logger *slog.Logger) *QuestionRepo {
	return &QuestionRepo{coll: coll, logger: logger}
}

// SaveMany возвращает (saved, duplicates, error)
func (r *QuestionRepo) SaveMany(ctx context.Context, items []model.Question) (int32, int32, error) {
	if len(items) == 0 {
		return 0, 0, nil
	}

	// Создаём уникальный индекс по link (идемпотентно)
	_, _ = r.coll.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "link", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// unordered — продолжит вставку, даже если часть упадёт на дубликате
	docs := make([]interface{}, 0, len(items))
	for _, q := range items {
		docs = append(docs, q)
	}

	res, err := r.coll.InsertMany(ctx, docs, options.InsertMany().SetOrdered(false))
	if err != nil {
		// mongo.BulkWriteException — значит были дубликаты, но часть вставилась
		if bwe, ok := errors.AsType[mongo.BulkWriteException](err); ok {
			saved := int32(len(docs) - len(bwe.WriteErrors))
			return saved, int32(len(bwe.WriteErrors)), nil
		}
		return 0, 0, err
	}
	return int32(len(res.InsertedIDs)), 0, nil
}
