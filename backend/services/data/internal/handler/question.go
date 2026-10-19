package handler

import (
	"context"

	questionv1 "StackStats/gen/go/proto/question/v1"
	"StackStats/services/data/internal/models"
	"StackStats/services/data/internal/repository"
)

type QuestionHandler struct {
	questionv1.UnimplementedQuestionServiceServer
	repo *repository.QuestionRepo
}

func NewQuestionHandler(repo *repository.QuestionRepo) *QuestionHandler {
	return &QuestionHandler{repo: repo}
}

func (h *QuestionHandler) SaveQuestions(
	ctx context.Context,
	req *questionv1.SaveQuestionsRequest,
) (*questionv1.SaveQuestionsResponse, error) {
	items := make([]model.Question, 0, len(req.GetQuestions()))
	for _, q := range req.GetQuestions() {
		items = append(items, model.Question{
			Title: q.GetTitle(),
			Tags:  q.GetTags(),
			Body:  q.GetBody(),
			Link:  q.GetLink(),
		})
	}

	saved, duplicates, err := h.repo.SaveMany(ctx, items)
	if err != nil {
		return nil, err
	}
	return &questionv1.SaveQuestionsResponse{
		Saved:      saved,
		Duplicates: duplicates,
	}, nil
}
